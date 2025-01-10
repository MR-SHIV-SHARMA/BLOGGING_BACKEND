import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorHandler } from "./admin/middleware/errorHandler.js";
import { initCronJobs } from "./utils/cronJobs.js";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));

app.use(express.urlencoded({ extended: true, limit: "16kb" }));

app.use(express.static("public"));

app.use(cookieParser());

// admin block
import authRoutes from "./admin/routes/auth.routes.js";
import adminRoutes from "./admin/routes/admin.routes.js";
import contentRoutes from "./admin/routes/content.routes.js";
import activityRoutes from "./admin/routes/activity.routes.js";
import superAdminRoutes from "./admin/routes/superAdmin.routes.js";

// user block
import accountRouter from "./routes/user/account/account.routes.js";

import authRouter from "./routes/user/auth/auth.routes.js";
import passwordRouter from "./routes/user/auth/password.routes.js";

import viewRouter from "./routes/user/profile/view.routes.js";
import mediaRouter from "./routes/user/profile/media.routes.js";

// content block
import tagRouter from "./routes/content/tag.routes.js";
import postRouter from "./routes/content/post.routes.js";
import commentRouter from "./routes/content/comment.routes.js";

// interaction block
import likeRouter from "./routes/interaction/like.routes.js";
import followRouter from "./routes/interaction/follow.routes.js";
import bookmarkRouter from "./routes/interaction/bookmark.routes.js";
import notificationRouter from "./routes/interaction/notification.routes.js";

// common block
import searchHistoryRouter from "./routes/common/search/searchHistory.routes.js";

import manageCategoryRouter from "./routes/common/category/manage.routes.js";
import postCategoryRouter from "./routes/common/category/postCategory.routes.js";

// admin block
app.use("/auth", authRoutes, errorHandler);
app.use("/admin", adminRoutes, errorHandler);
app.use("/content", contentRoutes, errorHandler);
app.use("/activity", activityRoutes, errorHandler);
app.use("/super-admin", superAdminRoutes, errorHandler);

// User Account & Authentication Routes
// -> routes/user/account/
app.use("/api/v1/user/account", accountRouter);

// -> routes/user/auth/
app.use("/api/v1/auth/auth", authRouter);
app.use("/api/v1/auth/password", passwordRouter);

// User Profile Management Routes
// -> routes/user/profile/
app.use("/api/v1/user/profile/view", viewRouter);
app.use("/api/v1/user/profile/media", mediaRouter);

// Content Management Routes
// -> routes/content/
app.use("/api/v1/content/tags", tagRouter);
app.use("/api/v1/content/posts", postRouter);
app.use("/api/v1/content/comments", commentRouter);

// User Interaction Routes
// -> routes/interaction/
app.use("/api/v1/interactions/likes", likeRouter);
app.use("/api/v1/interactions/follows", followRouter);
app.use("/api/v1/interactions/bookmarks", bookmarkRouter);
app.use("/api/v1/interactions/notifications", notificationRouter);

// Common Functionality Routes
// -> routes/common/search/
app.use("/api/v1/common/search/search-history", searchHistoryRouter);

// Category Management Routes
// -> routes/common/category/
app.use("/api/v1/common/categories/posts", postCategoryRouter);
app.use("/api/v1/common/categories/manage", manageCategoryRouter);

// Initialize cron jobs
initCronJobs();

export { app };
