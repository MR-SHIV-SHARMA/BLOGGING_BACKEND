import mongoose from "mongoose";

const mediaSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["image", "video", "audio"],
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.types.objectId,
      ref: "User",
      required: true,
    },
    postId: {
      type: mongoose.Schema.types.objectId,
      ref: "Post",
      default: null,
    },
    commentId: {
      type: mongoose.Schema.types.objectId,
      ref: "Comment",
      default: null,
    },
  },
  { timestamps: true }
);

export const Media = mongoose.model("Media", mediaSchema);
