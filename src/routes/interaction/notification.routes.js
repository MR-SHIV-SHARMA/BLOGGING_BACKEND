import express from "express";
import {
  createNotification,
  getNotificationsByUser,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
} from "../../controllers/interaction/notification.controllers.js";
import verifyJWT from "../../middlewares/auth.middlewares.js";

const router = express.Router();

router.use(verifyJWT); // Protect all routes

// Create a notification
router.route("/").post(createNotification);

// Get all notifications for a user
router.route("/:userId").get(getNotificationsByUser);

// Mark a notification as read
router.route("/read/:notificationId").patch(markAsRead);

// Mark all notifications as read for a user
router.route("/read/all/:userId").patch(markAllAsRead);

// Delete a notification
router.route("/:notificationId").delete(deleteNotification);

// Delete all notifications for a user
router.route("/all/:userId").delete(deleteAllNotifications);

export default router;
