/**
 * Authentication Controller
 */

const bcrypt = require('bcryptjs');
const { query, logAuditEvent } = require('../config/db');
const { signToken } = require('../middleware/auth');

async function register(req, res) {
  try {
    const { name, email, password, department, role_id } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check existing
    const [existing] = await query('SELECT id FROM users WHERE email = ?', [cleanEmail]);
    if (existing && existing.length > 0) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const assignedRoleId = role_id ? parseInt(role_id, 10) : 1; // Default to USER

    const [result] = await query(
      `INSERT INTO users (name, email, password_hash, role_id, status, department) VALUES (?, ?, ?, ?, 'ACTIVE', ?)`,
      [name.trim(), cleanEmail, passwordHash, assignedRoleId, department || 'General Campus']
    );

    const userId = result.insertId;

    // Fetch created user with role
    const [userRows] = await query(
      `SELECT u.id, u.name, u.email, u.role_id, r.name as role_name, u.department, u.status, u.created_at
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`,
      [userId]
    );

    const user = userRows[0];
    const token = signToken(user);

    await logAuditEvent({
      userId: user.id,
      action: 'REGISTER',
      entity: 'users',
      entityId: user.id,
      details: { email: user.email, role: user.role_name },
      ipAddress: req.ip
    });

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user
    });
  } catch (err) {
    console.error('[Register Error]:', err);
    return res.status(500).json({ success: false, message: 'Server error during registration.', error: err.message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    const [rows] = await query(
      `SELECT u.id, u.name, u.email, u.password_hash, u.role_id, r.name as role_name, u.department, u.status
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.email = ?`,
      [cleanEmail]
    );

    if (!rows || rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const user = rows[0];

    if (user.status === 'SUSPENDED' || user.status === 'INACTIVE') {
      return res.status(403).json({ success: false, message: `Your account is ${user.status}. Please contact an administrator.` });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = signToken(user);

    delete user.password_hash;

    await logAuditEvent({
      userId: user.id,
      action: 'LOGIN',
      entity: 'auth',
      entityId: user.id,
      details: { email: user.email, role: user.role_name },
      ipAddress: req.ip
    });

    return res.json({
      success: true,
      message: 'Login successful.',
      token,
      user
    });
  } catch (err) {
    console.error('[Login Error]:', err);
    return res.status(500).json({ success: false, message: 'Server error during login.', error: err.message });
  }
}

async function getMe(req, res) {
  try {
    const [rows] = await query(
      `SELECT u.id, u.name, u.email, u.role_id, r.name as role_name, u.department, u.status, u.created_at
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`,
      [req.user.id]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.json({ success: true, user: rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error retrieving profile.', error: err.message });
  }
}

async function logout(req, res) {
  if (req.user) {
    await logAuditEvent({
      userId: req.user.id,
      action: 'LOGOUT',
      entity: 'auth',
      entityId: req.user.id,
      details: { email: req.user.email },
      ipAddress: req.ip
    });
  }
  return res.json({ success: true, message: 'Logged out successfully.' });
}

module.exports = {
  register,
  login,
  getMe,
  logout
};

