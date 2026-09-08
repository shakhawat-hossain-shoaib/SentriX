/**
 * User Management Controller
 */

const { query, logAuditEvent } = require('../config/db');

async function listUsers(req, res) {
  try {
    const { role_id, status, search } = req.query;
    let sql = `
      SELECT u.id, u.name, u.email, u.role_id, r.name as role_name, u.department, u.status, u.created_at,
             (SELECT COUNT(*) FROM incidents WHERE reporter_id = u.id) as reported_count,
             (SELECT COUNT(*) FROM incidents WHERE assigned_to = u.id) as assigned_count
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE 1=1
    `;
    const params = [];

    if (role_id) {
      sql += ' AND u.role_id = ?';
      params.push(parseInt(role_id, 10));
    }

    if (status) {
      sql += ' AND u.status = ?';
      params.push(status.toUpperCase());
    }

    if (search && search.trim()) {
      sql += ' AND (u.name LIKE ? OR u.email LIKE ? OR u.department LIKE ?)';
      const s = `%${search.trim()}%`;
      params.push(s, s, s);
    }

    sql += ' ORDER BY u.created_at DESC';

    const [users] = await query(sql, params);
    return res.json({ success: true, count: users.length, users });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve users.', error: err.message });
  }
}

async function getUserById(req, res) {
  try {
    const userId = parseInt(req.params.id, 10);
    const [rows] = await query(
      `SELECT u.id, u.name, u.email, u.role_id, r.name as role_name, u.department, u.status, u.created_at
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`,
      [userId]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.json({ success: true, user: rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve user.', error: err.message });
  }
}

async function updateUserStatus(req, res) {
  try {
    const userId = parseInt(req.params.id, 10);
    const { status } = req.body;

    const valid = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];
    if (!valid.includes((status || '').toUpperCase())) {
      return res.status(400).json({ success: false, message: `Status must be one of [${valid.join(', ')}]` });
    }

    const newStatus = status.toUpperCase();
    await query('UPDATE users SET status = ? WHERE id = ?', [newStatus, userId]);

    await logAuditEvent({
      userId: req.user.id,
      action: 'UPDATE_USER_STATUS',
      entity: 'users',
      entityId: userId,
      details: { status: newStatus },
      ipAddress: req.ip
    });

    return res.json({ success: true, message: `User status updated to ${newStatus}.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update user status.', error: err.message });
  }
}

async function updateUserRole(req, res) {
  try {
    const userId = parseInt(req.params.id, 10);
    const { role_id } = req.body;

    const roleId = parseInt(role_id, 10);
    if (![1, 2, 3].includes(roleId)) {
      return res.status(400).json({ success: false, message: 'Invalid role ID. 1=USER, 2=ANALYST, 3=ADMIN' });
    }

    await query('UPDATE users SET role_id = ? WHERE id = ?', [roleId, userId]);

    await logAuditEvent({
      userId: req.user.id,
      action: 'UPDATE_USER_ROLE',
      entity: 'users',
      entityId: userId,
      details: { newRoleId: roleId },
      ipAddress: req.ip
    });

    return res.json({ success: true, message: 'User role updated successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update user role.', error: err.message });
  }
}

async function updateProfile(req, res) {
  try {
    const { name, department } = req.body;
    await query('UPDATE users SET name = COALESCE(?, name), department = COALESCE(?, department) WHERE id = ?', [
      name || null,
      department || null,
      req.user.id
    ]);

    const [rows] = await query(
      `SELECT u.id, u.name, u.email, u.role_id, r.name as role_name, u.department, u.status
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`,
      [req.user.id]
    );

    return res.json({ success: true, message: 'Profile updated.', user: rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update profile.', error: err.message });
  }
}

module.exports = {
  listUsers,
  getUserById,
  updateUserStatus,
  updateUserRole,
  updateProfile
};
