/**
 * Notifications Controller
 */

const { query } = require('../config/db');

async function getNotifications(req, res) {
  try {
    const [rows] = await query(
      `SELECT n.id, n.title, n.message, n.type, n.incident_id, n.is_read, n.created_at
       FROM notifications n
       WHERE n.user_id = ?
       ORDER BY n.created_at DESC
       LIMIT 30`,
      [req.user.id]
    );

    const [unreadCountRows] = await query(
      'SELECT COUNT(*) as unread FROM notifications WHERE user_id = ? AND is_read = 0',
      [req.user.id]
    );

    return res.json({
      success: true,
      unreadCount: unreadCountRows[0]?.unread || 0,
      notifications: rows
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve notifications.', error: err.message });
  }
}

async function markAsRead(req, res) {
  try {
    const notifId = parseInt(req.params.id, 10);
    await query('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [notifId, req.user.id]);
    return res.json({ success: true, message: 'Notification marked as read.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update notification.', error: err.message });
  }
}

async function markAllAsRead(req, res) {
  try {
    await query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.user.id]);
    return res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update notifications.', error: err.message });
  }
}

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead
};
