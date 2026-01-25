const Notification = require('../models/Notification');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
    try {
        const { unreadOnly } = req.query;

        const query = { user: req.user._id };
        if (unreadOnly === 'true') {
            query.read = false;
        }

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(50); // Limit to last 50 notifications

        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        notification.read = true;
        notification.readAt = new Date();
        await notification.save();

        res.json(notification);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/read-all
// @access  Private
const markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { user: req.user._id, read: false },
            { read: true, readAt: new Date() }
        );

        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get unread count
// @route   GET /api/notifications/unread-count
// @access  Private
const getUnreadCount = async (req, res) => {
    try {
        const count = await Notification.countDocuments({
            user: req.user._id,
            read: false
        });

        res.json({ count });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        await notification.deleteOne();
        res.json({ message: 'Notification deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Helper function to create notifications (used by other controllers)
const createNotification = async (userId, type, title, message, relatedId = null, relatedModel = null, params = {}) => {
    try {
        await Notification.create({
            user: userId,
            type,
            title, // Can be translation key
            message, // Can be translation key
            relatedId,
            relatedModel,
            params
        });
    } catch (error) {
        console.error('Error creating notification:', error);
    }
};

// Helper to create notifications for multiple users
const createNotificationsForUsers = async (userIds, type, title, message, relatedId = null, relatedModel = null, params = {}) => {
    try {
        console.log('createNotificationsForUsers called with:', { userIds, type, title, message, params });
        const notifications = userIds.map(userId => ({
            user: userId,
            type,
            title,
            message,
            relatedId,
            relatedModel,
            params
        }));

        await Notification.insertMany(notifications);
    } catch (error) {
        console.error('Error creating notifications:', error);
    }
};

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead,
    getUnreadCount,
    deleteNotification,
    createNotification,
    createNotificationsForUsers
};
