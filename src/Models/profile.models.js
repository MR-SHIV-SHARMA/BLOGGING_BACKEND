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
      required: true,
    },
    location: String,
    hobbies: String,
    bio: String,
    link: String,
    socialMedia: String,
    avatar: String,
    coverImage: String,
    savedPost: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
    follower: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

const Profile = mongoose.model("Profile", profileSchema);

export { Profile };
