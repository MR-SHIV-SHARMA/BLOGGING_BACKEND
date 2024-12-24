import mongoose from "mongoose";

const likeSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.types.ObjectId,
      ref: "Post",
      required: true,
    },
    comment: {
      type: mongoose.Schema.types.objectId,
      ref: "Comment",
    },
    tweet: {
      type: mongoose.Schema.types.objectId,
      ref: "Tweet",
    },
    userId: {
      type: mongoose.Schema.types.objectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export const Like = mongoose.model("Like", likeSchema);
