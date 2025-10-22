const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all projects
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '', priority = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT p.*, 
             CONCAT(e.first_name, ' ', e.last_name) as project_manager_name,
             COUNT(pa.employee_id) as assigned_employees
      FROM projects p
      LEFT JOIN employees e ON p.project_manager_id = e.id
      LEFT JOIN project_assignments pa ON p.id = pa.project_id AND (pa.end_date IS NULL OR pa.end_date > CURDATE())
      WHERE 1=1
    `;
    const queryParams = [];

    if (search) {
      query += ` AND (p.name LIKE ? OR p.description LIKE ?)`;
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm);
    }

    if (status) {
      query += ` AND p.status = ?`;
      queryParams.push(status);
    }

    if (priority) {
      query += ` AND p.priority = ?`;
      queryParams.push(priority);
    }

    query += ` GROUP BY p.id ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
    queryParams.push(parseInt(limit), parseInt(offset));

    const [projects] = await pool.execute(query, queryParams);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(DISTINCT p.id) as total
      FROM projects p
      WHERE 1=1
    `;
    const countParams = [];

    if (search) {
      countQuery += ` AND (p.name LIKE ? OR p.description LIKE ?)`;
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm);
    }

    if (status) {
      countQuery += ` AND p.status = ?`;
      countParams.push(status);
    }

    if (priority) {
      countQuery += ` AND p.priority = ?`;
      countParams.push(priority);
    }

    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      projects,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get project by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [projects] = await pool.execute(`
      SELECT p.*, 
             CONCAT(e.first_name, ' ', e.last_name) as project_manager_name,
             e.email as project_manager_email
      FROM projects p
      LEFT JOIN employees e ON p.project_manager_id = e.id
      WHERE p.id = ?
    `, [id]);

    if (projects.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Get assigned employees
    const [assignments] = await pool.execute(`
      SELECT pa.*, 
             CONCAT(e.first_name, ' ', e.last_name) as employee_name,
             e.email as employee_email,
             d.name as department_name
      FROM project_assignments pa
      JOIN employees e ON pa.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE pa.project_id = ? AND (pa.end_date IS NULL OR pa.end_date > CURDATE())
    `, [id]);

    res.json({
      project: projects[0],
      assignments
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create new project
router.post('/', [
  authenticateToken,
  requireRole(['admin']),
  body('name').notEmpty().withMessage('Project name is required'),
  body('description').notEmpty().withMessage('Project description is required'),
  body('status').isIn(['planning', 'active', 'on_hold', 'completed', 'cancelled']).withMessage('Invalid status'),
  body('priority').isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      description,
      status,
      priority,
      start_date,
      end_date,
      budget,
      project_manager_id
    } = req.body;

    const [result] = await pool.execute(`
      INSERT INTO projects (
        name, description, status, priority, start_date, end_date, budget, project_manager_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [name, description, status, priority, start_date, end_date, budget, project_manager_id]);

    res.status(201).json({
      message: 'Project created successfully',
      projectId: result.insertId
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update project
router.put('/:id', [
  authenticateToken,
  requireRole(['admin']),
  body('name').notEmpty().withMessage('Project name is required'),
  body('status').isIn(['planning', 'active', 'on_hold', 'completed', 'cancelled']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const {
      name,
      description,
      status,
      priority,
      start_date,
      end_date,
      budget,
      project_manager_id
    } = req.body;

    // Check if project exists
    const [existingProjects] = await pool.execute(
      'SELECT id FROM projects WHERE id = ?',
      [id]
    );

    if (existingProjects.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    await pool.execute(`
      UPDATE projects SET
        name = ?, description = ?, status = ?, priority = ?, start_date = ?,
        end_date = ?, budget = ?, project_manager_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [name, description, status, priority, start_date, end_date, budget, project_manager_id, id]);

    res.json({ message: 'Project updated successfully' });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete project
router.delete('/:id', [
  authenticateToken,
  requireRole(['admin'])
], async (req, res) => {
  try {
    const { id } = req.params;

    // Check if project exists
    const [existingProjects] = await pool.execute(
      'SELECT id FROM projects WHERE id = ?',
      [id]
    );

    if (existingProjects.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Delete project assignments first
    await pool.execute('DELETE FROM project_assignments WHERE project_id = ?', [id]);

    // Delete project
    await pool.execute('DELETE FROM projects WHERE id = ?', [id]);

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Assign employee to project
router.post('/:id/assign', [
  authenticateToken,
  requireRole(['admin']),
  body('employee_id').isInt().withMessage('Employee ID is required'),
  body('role').notEmpty().withMessage('Role is required'),
  body('allocation_percentage').isFloat({ min: 0, max: 100 }).withMessage('Allocation must be between 0 and 100')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { employee_id, role, allocation_percentage, start_date, end_date } = req.body;

    // Check if assignment already exists
    const [existingAssignments] = await pool.execute(
      'SELECT id FROM project_assignments WHERE project_id = ? AND employee_id = ?',
      [id, employee_id]
    );

    if (existingAssignments.length > 0) {
      return res.status(400).json({ message: 'Employee is already assigned to this project' });
    }

    await pool.execute(`
      INSERT INTO project_assignments (
        project_id, employee_id, role, allocation_percentage, start_date, end_date
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [id, employee_id, role, allocation_percentage, start_date, end_date]);

    res.json({ message: 'Employee assigned to project successfully' });
  } catch (error) {
    console.error('Assign employee error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Remove employee from project
router.delete('/:id/assign/:assignmentId', [
  authenticateToken,
  requireRole(['admin'])
], async (req, res) => {
  try {
    const { assignmentId } = req.params;

    // Check if assignment exists
    const [existingAssignments] = await pool.execute(
      'SELECT id FROM project_assignments WHERE id = ?',
      [assignmentId]
    );

    if (existingAssignments.length === 0) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Update assignment end date
    await pool.execute(
      'UPDATE project_assignments SET end_date = CURDATE() WHERE id = ?',
      [assignmentId]
    );

    res.json({ message: 'Employee removed from project successfully' });
  } catch (error) {
    console.error('Remove employee error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
