import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
  path: "./env",
});

connectDB()
  .then(() => {
    app.on("error", (err) => {
      console.error("Server error:", err.message);
      console.debug(err.stack);
    });
  })
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.info(
        `🚀 Server is up and running on port ${process.env.PORT || 8000}`
      );
    });
  })
  .catch((err) => {
    console.error(
      "Error while connecting to the database. Please check your MongoDB settings. Error Details:",
      err.message
    );
  });
