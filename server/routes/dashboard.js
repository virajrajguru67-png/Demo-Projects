const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get dashboard statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    // Get total employees
    const [employeeCount] = await pool.execute(
      'SELECT COUNT(*) as total FROM employees WHERE status = "active"'
    );

    // Get total projects
    const [projectCount] = await pool.execute(
      'SELECT COUNT(*) as total FROM projects WHERE status IN ("planning", "active")'
    );

    // Get total assets
    const [assetCount] = await pool.execute(
      'SELECT COUNT(*) as total FROM assets'
    );

    // Get available assets
    const [availableAssets] = await pool.execute(
      'SELECT COUNT(*) as total FROM assets WHERE status = "available"'
    );

    // Get assigned assets
    const [assignedAssets] = await pool.execute(
      'SELECT COUNT(*) as total FROM assets WHERE status = "assigned"'
    );

    // Get employees by department
    const [employeesByDept] = await pool.execute(`
      SELECT d.name as department, COUNT(e.id) as count
      FROM departments d
      LEFT JOIN employees e ON d.id = e.department_id AND e.status = 'active'
      GROUP BY d.id, d.name
      ORDER BY count DESC
    `);

    // Get projects by status
    const [projectsByStatus] = await pool.execute(`
      SELECT status, COUNT(*) as count
      FROM projects
      GROUP BY status
      ORDER BY count DESC
    `);

    // Get assets by category
    const [assetsByCategory] = await pool.execute(`
      SELECT ac.name as category, COUNT(a.id) as count
      FROM asset_categories ac
      LEFT JOIN assets a ON ac.id = a.category_id
      GROUP BY ac.id, ac.name
      ORDER BY count DESC
    `);

    // Get recent activities (last 30 days)
    const [recentActivities] = await pool.execute(`
      SELECT 'employee' as type, CONCAT('New employee: ', first_name, ' ', last_name) as description, created_at
      FROM employees
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      UNION ALL
      SELECT 'project' as type, CONCAT('New project: ', name) as description, created_at
      FROM projects
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      UNION ALL
      SELECT 'asset' as type, CONCAT('New asset: ', name) as description, created_at
      FROM assets
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      ORDER BY created_at DESC
      LIMIT 10
    `);

    // Get project progress (if user is employee, show only their projects)
    let projectProgressQuery = `
      SELECT p.name, p.status, p.start_date, p.end_date,
             COUNT(pa.employee_id) as assigned_employees,
             CASE 
               WHEN p.end_date IS NULL THEN NULL
               WHEN p.end_date < CURDATE() AND p.status != 'completed' THEN 'overdue'
               WHEN p.end_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY) AND p.status != 'completed' THEN 'due_soon'
               ELSE 'on_track'
             END as timeline_status
      FROM projects p
      LEFT JOIN project_assignments pa ON p.id = pa.project_id AND (pa.end_date IS NULL OR pa.end_date > CURDATE())
      WHERE p.status IN ('planning', 'active')
    `;

    if (req.user.role === 'employee') {
      // Get employee ID for the logged-in user
      const [employees] = await pool.execute(
        'SELECT id FROM employees WHERE user_id = ?',
        [req.user.id]
      );

      if (employees.length > 0) {
        const employeeId = employees[0].id;
        projectProgressQuery += ` AND p.id IN (
          SELECT project_id FROM project_assignments WHERE employee_id = ?
        )`;
        var projectProgressParams = [employeeId];
      } else {
        var projectProgressParams = [];
      }
    } else {
      var projectProgressParams = [];
    }

    projectProgressQuery += ` GROUP BY p.id ORDER BY p.created_at DESC LIMIT 10`;

    const [projectProgress] = await pool.execute(projectProgressQuery, projectProgressParams);

    res.json({
      overview: {
        totalEmployees: employeeCount[0].total,
        totalProjects: projectCount[0].total,
        totalAssets: assetCount[0].total,
        availableAssets: availableAssets[0].total,
        assignedAssets: assignedAssets[0].total
      },
      charts: {
        employeesByDepartment: employeesByDept,
        projectsByStatus: projectsByStatus,
        assetsByCategory: assetsByCategory
      },
      recentActivities,
      projectProgress
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get employee dashboard (for employee role)
router.get('/employee', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'employee') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get employee details
    const [employees] = await pool.execute(`
      SELECT e.*, d.name as department_name
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE e.user_id = ?
    `, [req.user.id]);

    if (employees.length === 0) {
      return res.status(404).json({ message: 'Employee record not found' });
    }

    const employee = employees[0];

    // Get assigned projects
    const [projects] = await pool.execute(`
      SELECT p.*, pa.role as project_role, pa.allocation_percentage, pa.start_date as assignment_start, pa.end_date as assignment_end
      FROM projects p
      JOIN project_assignments pa ON p.id = pa.project_id
      WHERE pa.employee_id = ? AND (pa.end_date IS NULL OR pa.end_date > CURDATE())
      ORDER BY p.created_at DESC
    `, [employee.id]);

    // Get assigned assets
    const [assets] = await pool.execute(`
      SELECT a.*, aa.assigned_date, aa.notes as assignment_notes
      FROM assets a
      JOIN asset_assignments aa ON a.id = aa.asset_id
      WHERE aa.employee_id = ? AND aa.status = 'active'
      ORDER BY aa.assigned_date DESC
    `, [employee.id]);

    // Get project deadlines (next 30 days)
    const [upcomingDeadlines] = await pool.execute(`
      SELECT p.name, p.end_date, pa.role
      FROM projects p
      JOIN project_assignments pa ON p.id = pa.project_id
      WHERE pa.employee_id = ? AND p.end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
      AND p.status IN ('planning', 'active')
      ORDER BY p.end_date ASC
    `, [employee.id]);

    res.json({
      employee,
      projects,
      assets,
      upcomingDeadlines
    });
  } catch (error) {
    console.error('Employee dashboard error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
