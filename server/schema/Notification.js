import mongoose, { Schema } from "mongoose";

const notificationSchema = mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["like", "comment", "reply"],
      required: true,
    },
    blog: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "blogs",
    },
    notificationFor: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "users",
    },
    user: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "users",
    },
    comment: {
      type: Schema.Types.ObjectId,
      ref: "comments",
    },
    reply: {
      type: Schema.Types.ObjectId,
      ref: "comments",
    },
    repliedOnComment: {
      type: Schema.Types.ObjectId,
      ref: "comments",
    },
    seen: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("notification", notificationSchema);
