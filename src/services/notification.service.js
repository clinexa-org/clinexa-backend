import Notification from "../models/Notification.js";
import DeviceToken from "../models/DeviceToken.js";
import { emitToUser } from "./socket.js";
import { getFirebaseAdmin, isFirebaseInitialized } from "../config/firebase.js";

/**
 * Create a notification in the database
 * @param {object} params
 * @param {string} params.recipientUserId - User ID to notify
 * @param {string} params.type - Notification type enum
 * @param {string} params.title - Notification title
 * @param {string} params.body - Notification body
 * @param {object} params.data - Optional data (appointmentId, prescriptionId)
 * @returns {Promise<Notification>}
 */
export const createNotification = async ({ recipientUserId, type, title, body, data = {} }) => {
  try {
    const notification = await Notification.create({
      recipientUserId,
      type,
      title,
      body,
      data
    });
    return notification;
  } catch (err) {
    console.error("[Notification] Failed to create:", err.message);
    return null;
  }
};

/**
 * Send push notification via FCM to all user devices
 * @param {string} recipientUserId - User ID
 * @param {object} params
 * @param {string} params.title - Push title
 * @param {string} params.body - Push body
 * @param {object} params.data - Optional data payload
 */
export const sendPushToUser = async (recipientUserId, { title, body, data = {} }) => {
  if (!isFirebaseInitialized()) {
    console.warn("[Push] Firebase not initialized, skipping push");
    return;
  }

  try {
    // Get all device tokens for this user
    const deviceTokens = await DeviceToken.find({ userId: recipientUserId });
    
    if (deviceTokens.length === 0) {
      console.log(`[Push] No device tokens for user ${recipientUserId}`);
      return;
    }

    const tokens = deviceTokens.map(dt => dt.token);
    const admin = getFirebaseAdmin();

    // Convert data values to strings (FCM requirement)
    const stringData = {};
    for (const [key, value] of Object.entries(data)) {
      stringData[key] = String(value);
    }

    const message = {
      notification: { title, body },
      data: stringData,
      tokens
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    
    console.log(`[Push] Sent to ${response.successCount}/${tokens.length} devices for user ${recipientUserId}`);

    // Clean up invalid tokens
    if (response.failureCount > 0) {
      const invalidTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const errorCode = resp.error?.code;
          if (errorCode === "messaging/invalid-registration-token" ||
              errorCode === "messaging/registration-token-not-registered") {
            invalidTokens.push(tokens[idx]);
          }
        }
      });

      if (invalidTokens.length > 0) {
        await DeviceToken.deleteMany({ token: { $in: invalidTokens } });
        console.log(`[Push] Cleaned up ${invalidTokens.length} invalid tokens`);
      }
    }
  } catch (err) {
    console.error("[Push] Failed to send:", err.message);
    // Don't throw - push failure should not fail the API
  }
};

/**
 * Emit real-time event to user via Socket.io
 * Wrapper around socket.emitToUser for consistency
 */
export { emitToUser };

/**
 * Full notification flow: Create DB notification + Send Push + Emit Socket
 * @param {object} params
 * @param {string} params.recipientUserId - User ID to notify
 * @param {string} params.type - Notification type enum
 * @param {string} params.title - Notification title
 * @param {string} params.body - Notification body
 * @param {object} params.data - Optional data (appointmentId, prescriptionId)
 * @param {string} params.socketEvent - Socket event name to emit
 * @param {object} params.socketPayload - Socket event payload (optional, defaults to { title, body, data })
 */
export const notifyUser = async ({ 
  recipientUserId, 
  type, 
  title, 
  body, 
  data = {}, 
  socketEvent = null,
  socketPayload = null 
}) => {
  // 1. Create DB notification
  const notification = await createNotification({ recipientUserId, type, title, body, data });

  // 2. Send push notification
  await sendPushToUser(recipientUserId, { title, body, data });

  // 3. Emit socket event (if specified)
  if (socketEvent) {
    const payload = socketPayload || { 
      notificationId: notification?._id,
      type,
      title, 
      body, 
      data,
      createdAt: notification?.createdAt || new Date()
    };
    emitToUser(recipientUserId, socketEvent, payload);
  }

  return notification;
};

export default { createNotification, sendPushToUser, emitToUser, notifyUser };
