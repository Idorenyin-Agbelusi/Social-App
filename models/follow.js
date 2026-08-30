import mongoose from "mongoose";

const { Schema, model } = mongoose;

const followSchema = new Schema(
  {
    followerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    followingId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

// Prevent duplicate follows at the database level
followSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

// Optimize lookups for followers list and following list
followSchema.index({ followerId: 1 });
followSchema.index({ followingId: 1 });

export default model("Follow", followSchema);