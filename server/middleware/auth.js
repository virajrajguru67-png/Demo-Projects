const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const authenticateToken = async(req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Verify user still exists and is active
        const [users] = await pool.execute(
            'SELECT id, username, role, is_active FROM users WHERE id = ? AND is_active = 1', [decoded.userId]
        );

        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid token or user not found' });
        }

        req.user = users[0];
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
};

const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Insufficient permissions' });
        }

        next();
    };
};

module.exports = {
    authenticateToken,
    requireRole
};