import { Notification } from "../../Models/notification.models.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { apiError } from "../../utils/apiError.js";
import { apiResponse } from "../../utils/apiResponse.js";

// Create a notification
const createNotification = asyncHandler(async (req, res) => {
  const { userId, actionUserId, message, type } = req.body;

  if (!userId || !actionUserId || !message || !type) {
    throw new apiError(
      422,
      "User ID, actionUserId, message, and type are required."
    );
  }

  const notification = await Notification.create({
    userId,
    actionUserId,
    message,
    type,
  });

  return res
    .status(201)
    .json(
      new apiResponse(201, notification, "Notification created successfully.")
    );
});

// Get all notifications for a user
const getNotificationsByUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    throw new apiError(400, "User ID is required.");
  }

  const notifications = await Notification.find({ userId })
    .populate("actionUserId", "username") // Populate actionUserId to get the user details
    .sort({ createdAt: -1 });

  if (!notifications.length) {
    throw new apiError(404, "No notifications found for the user.");
  }

  return res
    .status(200)
    .json(
      new apiResponse(200, notifications, "Notifications fetched successfully.")
    );
});

// Mark a notification as read
const markAsRead = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;

  if (!notificationId) {
    throw new apiError(400, "Notification ID is required.");
  }

  const notification = await Notification.findByIdAndUpdate(
    notificationId,
    { isRead: true },
    { new: true }
  );

  if (!notification) {
    throw new apiError(404, "Notification not found.");
  }

  return res
    .status(200)
    .json(new apiResponse(200, notification, "Notification marked as read."));
});

// Mark all notifications as read for a user
const markAllAsRead = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    throw new apiError(400, "User ID is required.");
  }

  const result = await Notification.updateMany(
    { userId, isRead: false },
    { isRead: true }
  );

  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        result,
        "All notifications marked as read successfully."
      )
    );
});

// Delete a notification
const deleteNotification = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;

  if (!notificationId) {
    throw new apiError(400, "Notification ID is required.");
  }

  const notification = await Notification.findByIdAndDelete(notificationId);

  if (!notification) {
    throw new apiError(404, "Notification not found.");
  }

  return res
    .status(200)
    .json(new apiResponse(200, null, "Notification deleted successfully."));
});

// Delete all notifications for a user
const deleteAllNotifications = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    throw new apiError(400, "User ID is required.");
  }

  const result = await Notification.deleteMany({ userId });

  return res
    .status(200)
    .json(
      new apiResponse(200, result, "All notifications deleted successfully.")
    );
});

// Function to send notification
const sendNotification = async (userId, actionUserId, message, type) => {
  console.log("sendNotification called with:", {
    userId,
    actionUserId,
    message,
    type,
  });

  if (!userId || !actionUserId || !message || !type) {
    throw new apiError(
      422,
      "User ID, actionUserId, message, and type are required."
    );
  }

  const notification = await Notification.create({
    userId,
    actionUserId,
    message,
    type,
  });

  console.log("Notification created:", notification);

  return notification;
};

export {
  createNotification,
  getNotificationsByUser,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  sendNotification,
};
