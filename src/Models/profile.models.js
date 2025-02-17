import mongoose from "mongoose";

const profileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
    },
    fullname: {
      type: String,
      default: "",
    },
    location: {
      type: String,
      default: "",
    },
    hobbies: {
      type: [String],
      default: [],
    },
    bio: {
      type: String,
      default: "",
    },
    link: {
      type: String,
      default: "",
    },
    socialMedia: {
      type: [String],
      default: [],
    },
    avatar: {
      type: String,
      default: "",
    },
    coverImage: {
      type: String,
      default: "",
    },
    savedPost: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
    follower: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

const Profile = mongoose.model("Profile", profileSchema);

export { Profile };
