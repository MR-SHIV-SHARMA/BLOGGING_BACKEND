import mongoose from "mongoose";

const profileSchema = new mongoose.Schema(
  {
    username: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    fullName: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    email: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    avatar: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    coverImage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    savedPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },
    follower: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Follow",
    },
    following: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Follow",
    },
    totalView: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },
    location: {
      type: "String",
    },
    hobise: {
      type: "String",
    },
    bio: {
      type: "String",
    },
    link: {
      type: "String",
    },
    socialmidiya: [
      {
        type: "String",
      },
    ],
  },
  { timestamps: true }
);

export const Profile = mongoose.model("Profile", profileSchema);
