import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Please enter a username"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: [true, "Please enter your email"],
      lowercase: true,
      unique: true,
      trim: true,
    },
    fullname: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    avatar: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
    },
    coverImage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
    },
    role: {
      type: String,
      enum: ["admin", "reader", "author"],
      default: "reader",
    },
    password: {
      type: String,
      required: [true, "Please enter your password"],
    },
    refreshToken: {
      type: String,
    },
    verifyToken: {
      type: String,
    },
    verifyTokenExpiry: {
      type: Date,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

userSchema.methods.generateVerificationToken = function () {
  return jwt.sign({ _id: this._id }, process.env.VERIFICATION_TOKEN_SECRET, {
    expiresIn: "1h",
  });
};

export const User = mongoose.model("User", userSchema);
