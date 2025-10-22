const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all knowledge articles
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { search, category_id, published_only = true } = req.query;

    let query = `
      SELECT 
        ka.*,
        tc.name as category_name,
        tc.color as category_color,
        u.username as author_name
      FROM knowledge_articles ka
      LEFT JOIN ticket_categories tc ON ka.category_id = tc.id
      LEFT JOIN users u ON ka.author_id = u.id
      WHERE 1=1
    `;

    const queryParams = [];

    if (published_only === 'true') {
      query += ' AND ka.is_published = TRUE';
    }

    if (search) {
      query += ' AND (ka.title LIKE ? OR ka.content LIKE ?)';
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm);
    }

    if (category_id) {
      query += ' AND ka.category_id = ?';
      queryParams.push(category_id);
    }

    query += ' ORDER BY ka.updated_at DESC';

    const [articles] = await pool.execute(query, queryParams);

    res.json({ articles });
  } catch (error) {
    console.error('Get knowledge articles error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get knowledge article by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [articles] = await pool.execute(`
      SELECT 
        ka.*,
        tc.name as category_name,
        tc.color as category_color,
        u.username as author_name
      FROM knowledge_articles ka
      LEFT JOIN ticket_categories tc ON ka.category_id = tc.id
      LEFT JOIN users u ON ka.author_id = u.id
      WHERE ka.id = ?
    `, [id]);

    if (articles.length === 0) {
      return res.status(404).json({ message: 'Article not found' });
    }

    res.json({ article: articles[0] });
  } catch (error) {
    console.error('Get knowledge article error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create new knowledge article
router.post('/', [
  authenticateToken,
  body('title').notEmpty().withMessage('Title is required'),
  body('content').notEmpty().withMessage('Content is required'),
  body('category_id').isInt().withMessage('Category ID must be a number'),
  body('tags').optional().isArray(),
  body('is_published').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      content,
      category_id,
      tags = [],
      is_published = false
    } = req.body;

    const [result] = await pool.execute(`
      INSERT INTO knowledge_articles (
        title, content, category_id, tags, author_id, is_published
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      title, content, category_id, JSON.stringify(tags), req.user.id, is_published
    ]);

    res.status(201).json({
      message: 'Article created successfully',
      articleId: result.insertId
    });
  } catch (error) {
    console.error('Create knowledge article error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update knowledge article
router.put('/:id', [
  authenticateToken,
  body('title').optional().notEmpty(),
  body('content').optional().notEmpty(),
  body('category_id').optional().isInt(),
  body('tags').optional().isArray(),
  body('is_published').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const updates = req.body;

    // Check if article exists
    const [existingArticles] = await pool.execute(
      'SELECT * FROM knowledge_articles WHERE id = ?',
      [id]
    );

    if (existingArticles.length === 0) {
      return res.status(404).json({ message: 'Article not found' });
    }

    const article = existingArticles[0];

    // Check permissions (only author or admin can edit)
    if (req.user.role !== 'admin' && article.author_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Build update query
    const updateFields = [];
    const updateValues = [];

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        if (key === 'tags') {
          updateFields.push(`${key} = ?`);
          updateValues.push(JSON.stringify(updates[key]));
        } else {
          updateFields.push(`${key} = ?`);
          updateValues.push(updates[key]);
        }
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(id);

    await pool.execute(
      `UPDATE knowledge_articles SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    res.json({ message: 'Article updated successfully' });
  } catch (error) {
    console.error('Update knowledge article error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete knowledge article
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if article exists
    const [existingArticles] = await pool.execute(
      'SELECT * FROM knowledge_articles WHERE id = ?',
      [id]
    );

    if (existingArticles.length === 0) {
      return res.status(404).json({ message: 'Article not found' });
    }

    const article = existingArticles[0];

    // Check permissions (only author or admin can delete)
    if (req.user.role !== 'admin' && article.author_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await pool.execute('DELETE FROM knowledge_articles WHERE id = ?', [id]);

    res.json({ message: 'Article deleted successfully' });
  } catch (error) {
    console.error('Delete knowledge article error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Increment view count
router.post('/:id/view', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    await pool.execute(
      'UPDATE knowledge_articles SET view_count = view_count + 1 WHERE id = ?',
      [id]
    );

    res.json({ message: 'View count updated' });
  } catch (error) {
    console.error('Increment view count error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Submit feedback
router.post('/:id/feedback', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { helpful } = req.body;

    if (helpful === true) {
      await pool.execute(
        'UPDATE knowledge_articles SET helpful_count = helpful_count + 1 WHERE id = ?',
        [id]
      );
    } else if (helpful === false) {
      await pool.execute(
        'UPDATE knowledge_articles SET not_helpful_count = not_helpful_count + 1 WHERE id = ?',
        [id]
      );
    }

    res.json({ message: 'Feedback submitted' });
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
