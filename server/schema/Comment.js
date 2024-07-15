import mongoose, { Schema } from "mongoose";

const commentSchema = mongoose.Schema(
  {
    blogId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "blogs",
    },
    blogAuthor: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "blogs",
    },
    comment: {
      type: String,
      required: true,
    },
    children: {
      type: [Schema.Types.ObjectId],
      ref: "comments",
    },
    commentedBy: {
      type: Schema.Types.ObjectId,
      require: true,
      ref: "users",
    },
    isReply: {
      type: Boolean,
      default: false,
    },
    parent: {
      type: Schema.Types.ObjectId,
      ref: "comments",
    },
  },
  {
    timestamps: {
      createdAt: "commentedAt",
    },
  }
);

export default mongoose.model("comments", commentSchema);
