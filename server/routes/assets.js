const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all assets
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', category = '', status = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT a.*, ac.name as category_name,
             CONCAT(e.first_name, ' ', e.last_name) as assigned_to_name,
             aa.assigned_date, aa.notes as assignment_notes
      FROM assets a
      LEFT JOIN asset_categories ac ON a.category_id = ac.id
      LEFT JOIN asset_assignments aa ON a.id = aa.asset_id AND aa.status = 'active'
      LEFT JOIN employees e ON aa.employee_id = e.id
      WHERE 1=1
    `;
    const queryParams = [];

    if (search) {
      query += ` AND (a.name LIKE ? OR a.asset_tag LIKE ? OR a.serial_number LIKE ?)`;
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }

    if (category) {
      query += ` AND a.category_id = ?`;
      queryParams.push(category);
    }

    if (status) {
      query += ` AND a.status = ?`;
      queryParams.push(status);
    }

    query += ` ORDER BY a.created_at DESC LIMIT ? OFFSET ?`;
    queryParams.push(parseInt(limit), parseInt(offset));

    const [assets] = await pool.execute(query, queryParams);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM assets a
      WHERE 1=1
    `;
    const countParams = [];

    if (search) {
      countQuery += ` AND (a.name LIKE ? OR a.asset_tag LIKE ? OR a.serial_number LIKE ?)`;
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }

    if (category) {
      countQuery += ` AND a.category_id = ?`;
      countParams.push(category);
    }

    if (status) {
      countQuery += ` AND a.status = ?`;
      countParams.push(status);
    }

    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      assets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get assets error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get asset by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [assets] = await pool.execute(`
      SELECT a.*, ac.name as category_name
      FROM assets a
      LEFT JOIN asset_categories ac ON a.category_id = ac.id
      WHERE a.id = ?
    `, [id]);

    if (assets.length === 0) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    // Get assignment history
    const [assignments] = await pool.execute(`
      SELECT aa.*, 
             CONCAT(e.first_name, ' ', e.last_name) as employee_name,
             e.email as employee_email
      FROM asset_assignments aa
      JOIN employees e ON aa.employee_id = e.id
      WHERE aa.asset_id = ?
      ORDER BY aa.assigned_date DESC
    `, [id]);

    res.json({
      asset: assets[0],
      assignments
    });
  } catch (error) {
    console.error('Get asset error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create new asset
router.post('/', [
  authenticateToken,
  requireRole(['admin']),
  body('asset_tag').notEmpty().withMessage('Asset tag is required'),
  body('name').notEmpty().withMessage('Asset name is required'),
  body('category_id').isInt().withMessage('Category ID is required'),
  body('status').isIn(['available', 'assigned', 'maintenance', 'retired']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      asset_tag,
      name,
      category_id,
      brand,
      model,
      serial_number,
      purchase_date,
      purchase_price,
      status,
      location,
      notes
    } = req.body;

    // Check if asset tag already exists
    const [existingAssets] = await pool.execute(
      'SELECT id FROM assets WHERE asset_tag = ?',
      [asset_tag]
    );

    if (existingAssets.length > 0) {
      return res.status(400).json({ message: 'Asset tag already exists' });
    }

    const [result] = await pool.execute(`
      INSERT INTO assets (
        asset_tag, name, category_id, brand, model, serial_number,
        purchase_date, purchase_price, status, location, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      asset_tag, name, category_id, brand, model, serial_number,
      purchase_date, purchase_price, status, location, notes
    ]);

    res.status(201).json({
      message: 'Asset created successfully',
      assetId: result.insertId
    });
  } catch (error) {
    console.error('Create asset error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update asset
router.put('/:id', [
  authenticateToken,
  requireRole(['admin']),
  body('name').notEmpty().withMessage('Asset name is required'),
  body('status').isIn(['available', 'assigned', 'maintenance', 'retired']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const {
      name,
      category_id,
      brand,
      model,
      serial_number,
      purchase_date,
      purchase_price,
      status,
      location,
      notes
    } = req.body;

    // Check if asset exists
    const [existingAssets] = await pool.execute(
      'SELECT id FROM assets WHERE id = ?',
      [id]
    );

    if (existingAssets.length === 0) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    await pool.execute(`
      UPDATE assets SET
        name = ?, category_id = ?, brand = ?, model = ?, serial_number = ?,
        purchase_date = ?, purchase_price = ?, status = ?, location = ?, notes = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [name, category_id, brand, model, serial_number, purchase_date, purchase_price, status, location, notes, id]);

    res.json({ message: 'Asset updated successfully' });
  } catch (error) {
    console.error('Update asset error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete asset
router.delete('/:id', [
  authenticateToken,
  requireRole(['admin'])
], async (req, res) => {
  try {
    const { id } = req.params;

    // Check if asset exists
    const [existingAssets] = await pool.execute(
      'SELECT id FROM assets WHERE id = ?',
      [id]
    );

    if (existingAssets.length === 0) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    // Check if asset is currently assigned
    const [assignments] = await pool.execute(
      'SELECT id FROM asset_assignments WHERE asset_id = ? AND status = "active"',
      [id]
    );

    if (assignments.length > 0) {
      return res.status(400).json({ message: 'Cannot delete asset that is currently assigned' });
    }

    // Delete asset assignments first
    await pool.execute('DELETE FROM asset_assignments WHERE asset_id = ?', [id]);

    // Delete asset
    await pool.execute('DELETE FROM assets WHERE id = ?', [id]);

    res.json({ message: 'Asset deleted successfully' });
  } catch (error) {
    console.error('Delete asset error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Assign asset to employee
router.post('/:id/assign', [
  authenticateToken,
  requireRole(['admin']),
  body('employee_id').isInt().withMessage('Employee ID is required'),
  body('notes').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { employee_id, notes } = req.body;

    // Check if asset exists and is available
    const [assets] = await pool.execute(
      'SELECT id, status FROM assets WHERE id = ?',
      [id]
    );

    if (assets.length === 0) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    if (assets[0].status !== 'available') {
      return res.status(400).json({ message: 'Asset is not available for assignment' });
    }

    // Check if employee exists
    const [employees] = await pool.execute(
      'SELECT id FROM employees WHERE id = ? AND status = "active"',
      [employee_id]
    );

    if (employees.length === 0) {
      return res.status(404).json({ message: 'Employee not found or inactive' });
    }

    // Create assignment
    await pool.execute(`
      INSERT INTO asset_assignments (asset_id, employee_id, assigned_date, notes)
      VALUES (?, ?, CURDATE(), ?)
    `, [id, employee_id, notes]);

    // Update asset status
    await pool.execute(
      'UPDATE assets SET status = "assigned" WHERE id = ?',
      [id]
    );

    res.json({ message: 'Asset assigned successfully' });
  } catch (error) {
    console.error('Assign asset error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Return asset from employee
router.post('/:id/return', [
  authenticateToken,
  requireRole(['admin']),
  body('assignment_id').isInt().withMessage('Assignment ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { assignment_id } = req.body;

    // Check if assignment exists and is active
    const [assignments] = await pool.execute(
      'SELECT id FROM asset_assignments WHERE id = ? AND asset_id = ? AND status = "active"',
      [assignment_id, id]
    );

    if (assignments.length === 0) {
      return res.status(404).json({ message: 'Active assignment not found' });
    }

    // Update assignment
    await pool.execute(
      'UPDATE asset_assignments SET status = "returned", return_date = CURDATE() WHERE id = ?',
      [assignment_id]
    );

    // Update asset status
    await pool.execute(
      'UPDATE assets SET status = "available" WHERE id = ?',
      [id]
    );

    res.json({ message: 'Asset returned successfully' });
  } catch (error) {
    console.error('Return asset error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get asset categories
router.get('/categories/list', authenticateToken, async (req, res) => {
  try {
    const [categories] = await pool.execute(
      'SELECT id, name, description FROM asset_categories ORDER BY name'
    );

    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
