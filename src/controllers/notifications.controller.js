import Notification from "../models/Notification.js";
import { success, error } from "../utils/response.js";

/**
 * Get notifications for the current user
 * GET /api/notifications/me?unreadOnly=true|false&limit=20&page=1
 */
export const getMyNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { unreadOnly, limit = 20, page = 1 } = req.query;

    const query = { recipientUserId: userId };
    
    if (unreadOnly === "true") {
      query.readAt = null;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Notification.countDocuments(query)
    ]);

    const unreadCount = await Notification.countDocuments({ 
      recipientUserId: userId, 
      readAt: null 
    });

    return success(res, { 
      notifications, 
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      },
      unreadCount
    });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * Mark a notification as read
 * PATCH /api/notifications/:id/read
 */
export const markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const notification = await Notification.findOne({ 
      _id: id, 
      recipientUserId: userId 
    });

    if (!notification) {
      return error(res, "Notification not found", 404);
    }

    if (!notification.readAt) {
      notification.readAt = new Date();
      await notification.save();
    }

    return success(res, { notification }, "Notification marked as read");
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * Mark all notifications as read
 * PATCH /api/notifications/read-all
 */
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await Notification.updateMany(
      { recipientUserId: userId, readAt: null },
      { readAt: new Date() }
    );

    return success(res, { 
      modifiedCount: result.modifiedCount 
    }, "All notifications marked as read");
  } catch (err) {
    return error(res, err.message, 500);
  }
};
