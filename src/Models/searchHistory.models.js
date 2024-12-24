import mongoose, { Schema } from "mongoose";

const searchHistorySchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    query: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export const SearchHistory = mongoose.model(
  "SearchHistory",
  searchHistorySchema
);
