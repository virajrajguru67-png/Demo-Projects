const express = require('express');
const { body, validationResult, query } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Helper function to generate ticket number
const generateTicketNumber = async() => {
    const year = new Date().getFullYear();
    const [result] = await pool.execute(
        'SELECT COUNT(*) as count FROM tickets WHERE YEAR(created_at) = ?', [year]
    );
    const count = result[0].count + 1;
    return `TKT-${year}-${count.toString().padStart(4, '0')}`;
};

// Get all tickets with filters and pagination
router.get('/', [
    authenticateToken,
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isInt(),
    query('priority').optional().isInt(),
    query('category').optional().isInt(),
    query('assignee').optional().isInt(),
    query('requester').optional().isInt(),
    query('search').optional().isString()
], async(req, res) => {
    try {
        const {
            page = 1,
                limit = 20,
                status,
                priority,
                category,
                assignee,
                requester,
                search
        } = req.query;

        const offset = (page - 1) * limit;

        let query = `
      SELECT 
        t.*,
        tc.name as category_name,
        tc.color as category_color,
        tp.name as priority_name,
        tp.level as priority_level,
        tp.color as priority_color,
        ts.name as status_name,
        ts.color as status_color,
        ts.is_final as status_is_final,
        u1.username as requester_name,
        u1.email as requester_email,
        u2.username as assignee_name,
        u2.email as assignee_email,
        st.name as team_name,
        d.name as department_name,
        CASE 
          WHEN t.sla_due_date < NOW() AND ts.is_final = FALSE THEN TRUE 
          ELSE FALSE 
        END as is_overdue
      FROM tickets t
      LEFT JOIN ticket_categories tc ON t.category_id = tc.id
      LEFT JOIN ticket_priorities tp ON t.priority_id = tp.id
      LEFT JOIN ticket_statuses ts ON t.status_id = ts.id
      LEFT JOIN users u1 ON t.requester_id = u1.id
      LEFT JOIN users u2 ON t.assignee_id = u2.id
      LEFT JOIN support_teams st ON t.team_id = st.id
      LEFT JOIN departments d ON t.department_id = d.id
      WHERE 1=1
    `;

        const queryParams = [];

        // Apply filters
        if (status) {
            query += ' AND t.status_id = ?';
            queryParams.push(status);
        }

        if (priority) {
            query += ' AND t.priority_id = ?';
            queryParams.push(priority);
        }

        if (category) {
            query += ' AND t.category_id = ?';
            queryParams.push(category);
        }

        if (assignee) {
            query += ' AND t.assignee_id = ?';
            queryParams.push(assignee);
        }

        if (requester) {
            query += ' AND t.requester_id = ?';
            queryParams.push(requester);
        }

        if (search) {
            query += ' AND (t.title LIKE ? OR t.description LIKE ? OR t.ticket_number LIKE ?)';
            const searchTerm = `%${search}%`;
            queryParams.push(searchTerm, searchTerm, searchTerm);
        }

        // Role-based filtering
        if (req.user.role === 'employee') {
            query += ' AND t.requester_id = ?';
            queryParams.push(req.user.id);
        }

        query += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
        queryParams.push(parseInt(limit), parseInt(offset));

        const [tickets] = await pool.execute(query, queryParams);

        // Get total count for pagination
        let countQuery = 'SELECT COUNT(*) as total FROM tickets t WHERE 1=1';
        const countParams = [];

        if (status) {
            countQuery += ' AND t.status_id = ?';
            countParams.push(status);
        }
        if (priority) {
            countQuery += ' AND t.priority_id = ?';
            countParams.push(priority);
        }
        if (category) {
            countQuery += ' AND t.category_id = ?';
            countParams.push(category);
        }
        if (assignee) {
            countQuery += ' AND t.assignee_id = ?';
            countParams.push(assignee);
        }
        if (requester) {
            countQuery += ' AND t.requester_id = ?';
            countParams.push(requester);
        }
        if (search) {
            countQuery += ' AND (t.title LIKE ? OR t.description LIKE ? OR t.ticket_number LIKE ?)';
            const searchTerm = `%${search}%`;
            countParams.push(searchTerm, searchTerm, searchTerm);
        }

        if (req.user.role === 'employee') {
            countQuery += ' AND t.requester_id = ?';
            countParams.push(req.user.id);
        }

        const [countResult] = await pool.execute(countQuery, countParams);
        const total = countResult[0].total;

        res.json({
            tickets,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get tickets error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get ticket by ID
router.get('/:id', authenticateToken, async(req, res) => {
    try {
        const { id } = req.params;

        const [tickets] = await pool.execute(`
      SELECT 
        t.*,
        tc.name as category_name,
        tc.color as category_color,
        tp.name as priority_name,
        tp.level as priority_level,
        tp.color as priority_color,
        ts.name as status_name,
        ts.color as status_color,
        ts.is_final as status_is_final,
        u1.username as requester_name,
        u1.email as requester_email,
        u2.username as assignee_name,
        u2.email as assignee_email,
        st.name as team_name,
        d.name as department_name,
        CASE 
          WHEN t.sla_due_date < NOW() AND ts.is_final = FALSE THEN TRUE 
          ELSE FALSE 
        END as is_overdue
      FROM tickets t
      LEFT JOIN ticket_categories tc ON t.category_id = tc.id
      LEFT JOIN ticket_priorities tp ON t.priority_id = tp.id
      LEFT JOIN ticket_statuses ts ON t.status_id = ts.id
      LEFT JOIN users u1 ON t.requester_id = u1.id
      LEFT JOIN users u2 ON t.assignee_id = u2.id
      LEFT JOIN support_teams st ON t.team_id = st.id
      LEFT JOIN departments d ON t.department_id = d.id
      WHERE t.id = ?
    `, [id]);

        if (tickets.length === 0) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        const ticket = tickets[0];

        // Check permissions
        if (req.user.role === 'employee' && ticket.requester_id !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Get ticket comments
        const [comments] = await pool.execute(`
      SELECT 
        tc.*,
        u.username,
        u.email
      FROM ticket_comments tc
      LEFT JOIN users u ON tc.user_id = u.id
      WHERE tc.ticket_id = ?
      ORDER BY tc.created_at ASC
    `, [id]);

        // Get ticket attachments
        const [attachments] = await pool.execute(`
      SELECT 
        ta.*,
        u.username as uploaded_by_name
      FROM ticket_attachments ta
      LEFT JOIN users u ON ta.uploaded_by = u.id
      WHERE ta.ticket_id = ?
      ORDER BY ta.created_at ASC
    `, [id]);

        // Get ticket history
        const [history] = await pool.execute(`
      SELECT 
        th.*,
        u.username
      FROM ticket_history th
      LEFT JOIN users u ON th.user_id = u.id
      WHERE th.ticket_id = ?
      ORDER BY th.created_at ASC
    `, [id]);

        res.json({
            ticket,
            comments,
            attachments,
            history
        });
    } catch (error) {
        console.error('Get ticket error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Create new ticket
router.post('/', [
    authenticateToken,
    body('title').notEmpty().withMessage('Title is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('category_id').isInt().withMessage('Category ID must be a number'),
    body('priority_id').isInt().withMessage('Priority ID must be a number'),
    body('tags').optional().isArray()
], async(req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            title,
            description,
            category_id,
            priority_id,
            tags,
            assignee_id,
            team_id
        } = req.body;

        // Generate ticket number
        const ticket_number = await generateTicketNumber();

        // Get SLA due date based on priority
        const [priority] = await pool.execute(
            'SELECT sla_hours FROM ticket_priorities WHERE id = ?', [priority_id]
        );

        const sla_hours = priority[0] ? priority[0].sla_hours || 72 : 72;
        const sla_due_date = new Date(Date.now() + sla_hours * 60 * 60 * 1000);

        // Get user's department
        const [userDept] = await pool.execute(
            'SELECT department_id FROM employees WHERE user_id = ?', [req.user.id]
        );

        const [result] = await pool.execute(`
      INSERT INTO tickets (
        ticket_number, title, description, category_id, priority_id, 
        status_id, requester_id, assignee_id, team_id, department_id,
        sla_due_date, tags, source
      ) VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, 'web')
    `, [
            ticket_number, title, description, category_id, priority_id,
            req.user.id, assignee_id || null, team_id || null, userDept[0] ? userDept[0].department_id || null : null,
            sla_due_date, JSON.stringify(tags || [])
        ]);

        const ticketId = result.insertId;

        // Add to history
        await pool.execute(`
      INSERT INTO ticket_history (ticket_id, user_id, action, new_value, description)
      VALUES (?, ?, 'created', ?, 'Ticket created')
    `, [ticketId, req.user.id, ticket_number]);

        res.status(201).json({
            message: 'Ticket created successfully',
            ticketId,
            ticket_number
        });
    } catch (error) {
        console.error('Create ticket error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Update ticket
router.put('/:id', [
    authenticateToken,
    body('title').optional().notEmpty(),
    body('description').optional().notEmpty(),
    body('category_id').optional().isInt(),
    body('priority_id').optional().isInt(),
    body('status_id').optional().isInt(),
    body('assignee_id').optional().isInt(),
    body('team_id').optional().isInt()
], async(req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const updates = req.body;

        // Check if ticket exists
        const [existingTickets] = await pool.execute(
            'SELECT * FROM tickets WHERE id = ?', [id]
        );

        if (existingTickets.length === 0) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        const ticket = existingTickets[0];

        // Check permissions
        if (req.user.role === 'employee' && ticket.requester_id !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Build update query
        const updateFields = [];
        const updateValues = [];

        Object.keys(updates).forEach(key => {
            if (updates[key] !== undefined) {
                updateFields.push(`${key} = ?`);
                updateValues.push(updates[key]);
            }
        });

        if (updateFields.length === 0) {
            return res.status(400).json({ message: 'No fields to update' });
        }

        updateFields.push('updated_at = CURRENT_TIMESTAMP');
        updateValues.push(id);

        await pool.execute(
            `UPDATE tickets SET ${updateFields.join(', ')} WHERE id = ?`,
            updateValues
        );

        // Add to history
        await pool.execute(`
      INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, description)
      VALUES (?, ?, 'updated', ?, ?, 'Ticket updated')
    `, [id, req.user.id, JSON.stringify(ticket), JSON.stringify(updates)]);

        res.json({ message: 'Ticket updated successfully' });
    } catch (error) {
        console.error('Update ticket error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Add comment to ticket
router.post('/:id/comments', [
    authenticateToken,
    body('comment').notEmpty().withMessage('Comment is required'),
    body('is_internal').optional().isBoolean()
], async(req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const { comment, is_internal = false } = req.body;

        // Check if ticket exists
        const [tickets] = await pool.execute(
            'SELECT * FROM tickets WHERE id = ?', [id]
        );

        if (tickets.length === 0) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        const ticket = tickets[0];

        // Check permissions for internal comments
        if (is_internal && req.user.role === 'employee') {
            return res.status(403).json({ message: 'Employees cannot add internal comments' });
        }

        // Check permissions for public comments
        if (!is_internal && req.user.role === 'employee' && ticket.requester_id !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const [result] = await pool.execute(`
      INSERT INTO ticket_comments (ticket_id, user_id, comment, is_internal)
      VALUES (?, ?, ?, ?)
    `, [id, req.user.id, comment, is_internal]);

        // Add to history
        await pool.execute(`
      INSERT INTO ticket_history (ticket_id, user_id, action, new_value, description)
      VALUES (?, ?, 'commented', ?, 'Comment added')
    `, [id, req.user.id, comment]);

        res.status(201).json({
            message: 'Comment added successfully',
            commentId: result.insertId
        });
    } catch (error) {
        console.error('Add comment error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get ticket statistics
router.get('/stats/overview', authenticateToken, async(req, res) => {
    try {
        const { period = '30' } = req.query; // days

        // Base query for date filtering
        const dateFilter = `AND t.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`;
        const dateParam = [parseInt(period)];

        // Total tickets
        const [totalTickets] = await pool.execute(
            `SELECT COUNT(*) as total FROM tickets t WHERE 1=1 ${dateFilter}`,
            dateParam
        );

        // Open tickets
        const [openTickets] = await pool.execute(`
      SELECT COUNT(*) as open FROM tickets t 
      LEFT JOIN ticket_statuses ts ON t.status_id = ts.id 
      WHERE ts.is_final = FALSE ${dateFilter}
    `, dateParam);

        // Overdue tickets
        const [overdueTickets] = await pool.execute(`
      SELECT COUNT(*) as overdue FROM tickets t 
      LEFT JOIN ticket_statuses ts ON t.status_id = ts.id 
      WHERE t.sla_due_date < NOW() AND ts.is_final = FALSE ${dateFilter}
    `, dateParam);

        // Tickets by status
        const [statusStats] = await pool.execute(`
      SELECT 
        ts.name as status_name,
        ts.color as status_color,
        COUNT(*) as count
      FROM tickets t
      LEFT JOIN ticket_statuses ts ON t.status_id = ts.id
      WHERE 1=1 ${dateFilter}
      GROUP BY ts.id, ts.name, ts.color
      ORDER BY count DESC
    `, dateParam);

        // Tickets by priority
        const [priorityStats] = await pool.execute(`
      SELECT 
        tp.name as priority_name,
        tp.color as priority_color,
        COUNT(*) as count
      FROM tickets t
      LEFT JOIN ticket_priorities tp ON t.priority_id = tp.id
      WHERE 1=1 ${dateFilter}
      GROUP BY tp.id, tp.name, tp.color
      ORDER BY tp.level DESC
    `, dateParam);

        // Tickets by category
        const [categoryStats] = await pool.execute(`
      SELECT 
        tc.name as category_name,
        tc.color as category_color,
        COUNT(*) as count
      FROM tickets t
      LEFT JOIN ticket_categories tc ON t.category_id = tc.id
      WHERE 1=1 ${dateFilter}
      GROUP BY tc.id, tc.name, tc.color
      ORDER BY count DESC
    `, dateParam);

        // Average resolution time
        const [avgResolution] = await pool.execute(`
      SELECT 
        AVG(TIMESTAMPDIFF(HOUR, t.created_at, t.resolution_date)) as avg_hours
      FROM tickets t
      WHERE t.resolution_date IS NOT NULL ${dateFilter}
    `, dateParam);

        res.json({
            total: totalTickets[0].total,
            open: openTickets[0].open,
            overdue: overdueTickets[0].overdue,
            statusStats,
            priorityStats,
            categoryStats,
            avgResolutionHours: avgResolution[0].avg_hours || 0
        });
    } catch (error) {
        console.error('Get ticket stats error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get ticket categories
router.get('/meta/categories', authenticateToken, async(req, res) => {
    try {
        const [categories] = await pool.execute(
            'SELECT * FROM ticket_categories WHERE is_active = TRUE ORDER BY name'
        );
        res.json(categories);
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get ticket priorities
router.get('/meta/priorities', authenticateToken, async(req, res) => {
    try {
        const [priorities] = await pool.execute(
            'SELECT * FROM ticket_priorities WHERE is_active = TRUE ORDER BY level'
        );
        res.json(priorities);
    } catch (error) {
        console.error('Get priorities error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get ticket statuses
router.get('/meta/statuses', authenticateToken, async(req, res) => {
    try {
        const [statuses] = await pool.execute(
            'SELECT * FROM ticket_statuses WHERE is_active = TRUE ORDER BY id'
        );
        res.json(statuses);
    } catch (error) {
        console.error('Get statuses error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get support teams
router.get('/meta/teams', authenticateToken, async(req, res) => {
    try {
        const [teams] = await pool.execute(
            'SELECT * FROM support_teams WHERE is_active = TRUE ORDER BY name'
        );
        res.json(teams);
    } catch (error) {
        console.error('Get teams error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;