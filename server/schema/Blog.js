import mongoose, { Schema } from "mongoose";

const blogSchema = mongoose.Schema(
  {
    blogId: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
    },
    banner: {
      type: String,
      // required: true,
    },
    description: {
      type: String,
      maxlength: 200,
      // required: true
    },
    content: {
      type: [],
      // required: true
    },
    tags: {
      type: [String],
      // required: true
    },
    author: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "users",
    },
    activity: {
      totalLikes: {
        type: Number,
        default: 0,
      },
      totalComments: {
        type: Number,
        default: 0,
      },
      totalReads: {
        type: Number,
        default: 0,
      },
      totalParentComments: {
        type: Number,
        default: 0,
      },
    },
    comments: {
      type: [Schema.Types.ObjectId],
      ref: "comments",
    },
    draft: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: {
      createdAt: "publishedAt",
    },
  }
);

export default mongoose.model("blogs", blogSchema);
