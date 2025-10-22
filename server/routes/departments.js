const express = require("express");
const { body, validationResult } = require("express-validator");
const pool = require("../config/database");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Get all departments
router.get("/", authenticateToken, async (req, res) => {
  try {
    const [departments] = await pool.execute(
      "SELECT id, name, description, created_at FROM departments ORDER BY name"
    );

    res.json({
      departments,
      total: departments.length,
    });
  } catch (error) {
    console.error("Get departments error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get department by ID
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [departments] = await pool.execute(
      "SELECT * FROM departments WHERE id = ?",
      [id]
    );

    if (departments.length === 0) {
      return res.status(404).json({ message: "Department not found" });
    }

    res.json({ department: departments[0] });
  } catch (error) {
    console.error("Get department error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Create new department
router.post(
  "/",
  [
    authenticateToken,
    body("name").notEmpty().withMessage("Department name is required"),
    body("description").optional(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, description } = req.body;

      // Check if department already exists
      const [existingDepartments] = await pool.execute(
        "SELECT id FROM departments WHERE name = ?",
        [name]
      );

      if (existingDepartments.length > 0) {
        return res
          .status(400)
          .json({ message: "Department name already exists" });
      }

      const [result] = await pool.execute(
        "INSERT INTO departments (name, description) VALUES (?, ?)",
        [name, description]
      );

      res.status(201).json({
        message: "Department created successfully",
        departmentId: result.insertId,
      });
    } catch (error) {
      console.error("Create department error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Update department
router.put(
  "/:id",
  [
    authenticateToken,
    body("name").notEmpty().withMessage("Department name is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { name, description } = req.body;

      // Check if department exists
      const [existingDepartments] = await pool.execute(
        "SELECT id FROM departments WHERE id = ?",
        [id]
      );

      if (existingDepartments.length === 0) {
        return res.status(404).json({ message: "Department not found" });
      }

      await pool.execute(
        "UPDATE departments SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [name, description, id]
      );

      res.json({ message: "Department updated successfully" });
    } catch (error) {
      console.error("Update department error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Delete department
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if department exists
    const [existingDepartments] = await pool.execute(
      "SELECT id FROM departments WHERE id = ?",
      [id]
    );

    if (existingDepartments.length === 0) {
      return res.status(404).json({ message: "Department not found" });
    }

    // Check if department has employees
    const [employees] = await pool.execute(
      "SELECT COUNT(*) as count FROM employees WHERE department_id = ?",
      [id]
    );

    if (employees[0].count > 0) {
      return res.status(400).json({
        message:
          "Cannot delete department with employees. Please reassign employees first.",
      });
    }

    await pool.execute("DELETE FROM departments WHERE id = ?", [id]);

    res.json({ message: "Department deleted successfully" });
  } catch (error) {
    console.error("Delete department error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
