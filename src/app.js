import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorHandler } from "./admin/middleware/errorHandler.js";

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

import tagRouter from "./routes/tag.routes.js";
import userRouter from "./routes/user.routes.js";
import likeRouter from "./routes/like.routes.js";
import postRouter from "./routes/post.routes.js";
import followRouter from "./routes/follow.routes.js";
import commentRouter from "./routes/comment.routes.js";
import profileRouter from "./routes/profile.routes.js";
import bookmarkRouter from "./routes/bookmark.routes.js";
import categoryRouter from "./routes/category.routes.js";
import notificationRouter from "./routes/notification.routes.js";
import searchHistoryRouter from "./routes/searchHistory.routes.js";
import adminRoutes from "./admin/routes/admin.routes.js";

app.use("/admin", adminRoutes, errorHandler);
app.use("/api/v1/tag", tagRouter);
app.use("/api/v1/post", postRouter);
app.use("/api/v1/like", likeRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/follow", followRouter);
app.use("/api/v1/profile", profileRouter);
app.use("/api/v1/comment", commentRouter);
app.use("/api/v1/category", categoryRouter);
app.use("/api/v1/bookmark", bookmarkRouter);
app.use("/api/v1/notification", notificationRouter);
app.use("/api/v1/searchHistory", searchHistoryRouter);

export { app };
