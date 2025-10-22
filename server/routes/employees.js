const express = require("express");
const { body, validationResult } = require("express-validator");
const pool = require("../config/database");
const { authenticateToken, requireRole } = require("../middleware/auth");
const {
  requirePermission,
  requireResourceAccess,
} = require("../middleware/permissions");

const router = express.Router();

// Get all employees
router.get("/", authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      department = "",
      status = "",
    } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT e.*, d.name as department_name, u.username, u.email as user_email
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN users u ON e.user_id = u.id
      WHERE 1=1
    `;
    const queryParams = [];

    if (search) {
      query += ` AND (e.first_name LIKE ? OR e.last_name LIKE ? OR e.employee_id LIKE ? OR e.email LIKE ?)`;
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (department) {
      query += ` AND e.department_id = ?`;
      queryParams.push(department);
    }

    if (status) {
      query += ` AND e.status = ?`;
      queryParams.push(status);
    }

    query += ` ORDER BY e.created_at DESC LIMIT ? OFFSET ?`;
    queryParams.push(parseInt(limit), parseInt(offset));

    const [employees] = await pool.execute(query, queryParams);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM employees e
      WHERE 1=1
    `;
    const countParams = [];

    if (search) {
      countQuery += ` AND (e.first_name LIKE ? OR e.last_name LIKE ? OR e.employee_id LIKE ? OR e.email LIKE ?)`;
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (department) {
      countQuery += ` AND e.department_id = ?`;
      countParams.push(department);
    }

    if (status) {
      countQuery += ` AND e.status = ?`;
      countParams.push(status);
    }

    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      employees,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get employees error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get employee by ID
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [employees] = await pool.execute(
      `
      SELECT e.*, d.name as department_name, u.username, u.email as user_email
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN users u ON e.user_id = u.id
      WHERE e.id = ?
    `,
      [id]
    );

    if (employees.length === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Get assigned projects
    const [projects] = await pool.execute(
      `
      SELECT p.*, pa.role as project_role, pa.allocation_percentage, pa.start_date as assignment_start, pa.end_date as assignment_end
      FROM projects p
      JOIN project_assignments pa ON p.id = pa.project_id
      WHERE pa.employee_id = ? AND pa.end_date IS NULL OR pa.end_date > CURDATE()
    `,
      [id]
    );

    // Get assigned assets
    const [assets] = await pool.execute(
      `
      SELECT a.*, aa.assigned_date, aa.notes as assignment_notes
      FROM assets a
      JOIN asset_assignments aa ON a.id = aa.asset_id
      WHERE aa.employee_id = ? AND aa.status = 'active'
    `,
      [id]
    );

    res.json({
      employee: employees[0],
      projects,
      assets,
    });
  } catch (error) {
    console.error("Get employee error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Create new employee
router.post(
  "/",
  [
    authenticateToken,
    body("first_name").notEmpty().withMessage("First name is required"),
    body("last_name").notEmpty().withMessage("Last name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("department_id").isInt().withMessage("Department ID must be a number"),
    body("position").notEmpty().withMessage("Position is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        first_name,
        last_name,
        email,
        phone,
        department_id,
        position,
        hire_date,
        salary,
        user_id,
      } = req.body;

      // Check if email already exists
      const [existingEmployees] = await pool.execute(
        "SELECT id FROM employees WHERE email = ?",
        [email]
      );

      if (existingEmployees.length > 0) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const [result] = await pool.execute(
        `
      INSERT INTO employees (
        first_name, last_name, email, phone, department_id,
        position, hire_date, salary, user_id, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `,
        [
          first_name,
          last_name,
          email,
          phone,
          department_id,
          position,
          hire_date,
          salary,
          user_id,
        ]
      );

      res.status(201).json({
        message: "Employee created successfully",
        employeeId: result.insertId,
      });
    } catch (error) {
      console.error("Create employee error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Update employee
router.put(
  "/:id",
  [
    authenticateToken,
    body("first_name").notEmpty().withMessage("First name is required"),
    body("last_name").notEmpty().withMessage("Last name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const {
        first_name,
        last_name,
        email,
        phone,
        department_id,
        position,
        hire_date,
        salary,
        status,
      } = req.body;

      // Check if employee exists
      const [existingEmployees] = await pool.execute(
        "SELECT id FROM employees WHERE id = ?",
        [id]
      );

      if (existingEmployees.length === 0) {
        return res.status(404).json({ message: "Employee not found" });
      }

      await pool.execute(
        `
      UPDATE employees SET
        first_name = ?, last_name = ?, email = ?, phone = ?, department_id = ?,
        position = ?, hire_date = ?, salary = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
        [
          first_name,
          last_name,
          email,
          phone,
          department_id,
          position,
          hire_date,
          salary,
          status,
          id,
        ]
      );

      res.json({ message: "Employee updated successfully" });
    } catch (error) {
      console.error("Update employee error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Delete employee
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if employee exists
    const [existingEmployees] = await pool.execute(
      "SELECT id FROM employees WHERE id = ?",
      [id]
    );

    if (existingEmployees.length === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Soft delete - update status to terminated
    await pool.execute(
      'UPDATE employees SET status = "terminated", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );

    res.json({ message: "Employee deleted successfully" });
  } catch (error) {
    console.error("Delete employee error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
