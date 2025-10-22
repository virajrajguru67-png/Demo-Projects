const { authenticateToken } = require('./auth');

// Define role-based permissions
const PERMISSIONS = {
  admin: [
    'users.create',
    'users.read',
    'users.update',
    'users.delete',
    'employees.create',
    'employees.read',
    'employees.update',
    'employees.delete',
    'projects.create',
    'projects.read',
    'projects.update',
    'projects.delete',
    'assets.create',
    'assets.read',
    'assets.update',
    'assets.delete',
    'reports.read',
    'dashboard.read'
  ],
  employee: [
    'employees.read.own',
    'projects.read.assigned',
    'assets.read.assigned',
    'dashboard.read'
  ]
};

// Check if user has specific permission
const hasPermission = (userRole, permission) => {
  const rolePermissions = PERMISSIONS[userRole] || [];
  return rolePermissions.includes(permission);
};

// Middleware to check permissions
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!hasPermission(req.user.role, permission)) {
      return res.status(403).json({ 
        message: 'Insufficient permissions',
        required: permission,
        userRole: req.user.role
      });
    }

    next();
  };
};

// Middleware to check multiple permissions (user needs at least one)
const requireAnyPermission = (permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const hasAnyPermission = permissions.some(permission => 
      hasPermission(req.user.role, permission)
    );

    if (!hasAnyPermission) {
      return res.status(403).json({ 
        message: 'Insufficient permissions',
        required: permissions,
        userRole: req.user.role
      });
    }

    next();
  };
};

// Middleware to check if user can access resource (own or all)
const requireResourceAccess = (resourceType) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Admin can access all resources
    if (req.user.role === 'admin') {
      return next();
    }

    // Employee can only access their own resources
    if (req.user.role === 'employee') {
      const resourceId = req.params.id;
      const userId = req.user.id;

      // Check if the resource belongs to the user
      // This will be implemented in the specific route handlers
      req.userResourceId = userId;
      return next();
    }

    return res.status(403).json({ 
      message: 'Insufficient permissions',
      userRole: req.user.role
    });
  };
};

module.exports = {
  PERMISSIONS,
  hasPermission,
  requirePermission,
  requireAnyPermission,
  requireResourceAccess
};
