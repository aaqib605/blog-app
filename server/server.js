import express from "express";
import "dotenv/config";
import bcrypt from "bcrypt";
import { nanoid } from "nanoid";
import jwt from "jsonwebtoken";
import cors from "cors";
import admin from "firebase-admin";
import { getAuth } from "firebase-admin/auth";
import aws from "aws-sdk";
import connectDB from "./config/db.js";
import serviceAccountKey from "./blog-app-firebase-adminsdk.json" with { type: "json" };

import User from "./schema/User.js";
import Blog from "./schema/Blog.js";
import Notification from "./schema/Notification.js";
import Comment from "./schema/Comment.js";

connectDB();

// Firebase Google Authentication
admin.initializeApp({
  credential: admin.credential.cert(serviceAccountKey),
});

// AWS S3 Bucket
const s3 = new aws.S3({
  region: "eu-north-1",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const PORT = process.env.PORT || 8000;
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/;

const generateUploadImageURL = async () => {
  const date = new Date();
  const imgName = `${nanoid()}-${date.getTime()}.jpeg}`;

  const uploadImageURL = await s3.getSignedUrlPromise("putObject", {
    Bucket: "medium-blog-app",
    Key: imgName,
    Expires: 1000,
    ContentType: "image/jpeg",
  });

  return uploadImageURL;
};

const formatUserData = (user) => {
  const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

  return {
    jwtToken: accessToken,
    username: user.personalInfo.username,
    fullname: user.personalInfo.fullname,
    profileImg: user.personalInfo.profileImg,
  };
};

const generateUsername = async (email) => {
  let username = email.split("@")[0];

  let usernameExists = await User.exists({ "personalInfo.username": username });

  Boolean(usernameExists) ? (username += nanoid().substring(0, 5)) : "";

  return username;
};

const verifyJWT = (req, res, next) => {
  const authHeader = req.headers["authorization"]; 
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No access token found." });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid access token." });
    }

    req.user = user.id;
    next();
  });
};

app.post("/signup", async (req, res) => {
  try {
    const { fullname, email, password } = req.body;

    if (!fullname || !email || !password) {
      return res
        .status(403)
        .json({ error: "Please provide all required fields" });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let username = await generateUsername(email);

    const user = new User({
      personalInfo: {
        fullname,
        email,
        password: hashedPassword,
        username,
      },
    });

    const u = await user.save();
    return res.status(201).json(formatUserData(u));
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: "User already exists" });
    }

    return res.status(500).json({ error: error.message });
  }
});

app.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ "personalInfo.email": email });

    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    if (!user.googleAuth) {
      if (
        user &&
        (await bcrypt.compare(password, user.personalInfo.password))
      ) {
        return res.json(formatUserData(user));
      } else {
        return res.status(400).json({ error: "Invalid credentials" });
      }
    } else {
      return res.status(403).json({
        error:
          "This email was used with Google Auth. Please continue with the same.",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
});

app.post("/google-auth", async (req, res) => {
  try {
    const { accessToken } = req.body;

    const { email, name, picture } = await getAuth().verifyIdToken(accessToken);

    let user = await User.findOne({ "personalInfo.email": email }).select(
      "personalInfo.fullname personalInfo.username personalInfo.profileImg googleAuth"
    );

    if (user) {
      if (!user.googleAuth) {
        return res.status(403).json({
          error:
            "This email was used with a password for signing up. Please continue with the same.",
        });
      }
    } else {
      let username = await generateUsername(email);

      user = new User({
        personalInfo: {
          fullname: name,
          email,
          profileImg: picture,
          username,
        },
        googleAuth: true,
      });

      user = await user.save();
    }

    return res.status(200).json(formatUserData(user));
  } catch (error) {
    return res.status(500).json({
      error:
        "Failed to authenticate you with Google. Try again with another Google Account.",
    });
  }
});

app.post("/change-password", verifyJWT, async (req, res) => {
  const _id = req.user;
  const { currentPassword, newPassword } = req.body;

  if (
    !passwordRegex.test(currentPassword) ||
    !passwordRegex.test(newPassword)
  ) {
    return res.status(403).json({
      error:
        "The password must be 6 to 20 characters in length and include a number, one lowercase letter, and one uppercase letter.",
    });
  }

  try {
    const user = await User.findOne({ _id });

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    if (user.googleAuth) {
      return res.status(403).json({
        error:
          "You can't change the account password since you logged in using Google.",
      });
    }

    const isMatch = await bcrypt.compare(
      currentPassword,
      user.personalInfo.password
    );

    if (!isMatch) {
      return res.status(403).json({
        error: "Incorrect current password. Please try again.",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await User.findOneAndUpdate(
      { _id },
      { "personalInfo.password": hashedPassword }
    );

    return res.status(200).json({ status: "Password changed." });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: "Error updating the password. Please try again.",
    });
  }
});
   
app.get("/get-upload-image-url", async (req, res) => {
  try {
    const uploadImageURL = await generateUploadImageURL();
    res.status(200).json({ uploadImageURL });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ error: error.message });
  }
});

app.post("/update-profile-img", verifyJWT, async (req, res) => {
  const _id = req.user;
  const { imgURL } = req.body;

  try {
    await User.findOneAndUpdate({ _id }, { "personalInfo.profileImg": imgURL });

    return res.status(201).json({ "profileImg": imgURL });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.post("/update-profile", verifyJWT, async (req, res) => {
  const _id = req.user;
  const { username, bio, socialLinks } = req.body;
  const bioCharactersLimit = 150;

  if (username.length < 3) {
    return res.status(403).json({ error: "Username must be at least 3 characters long."});
  }

  if (bio.length > bioCharactersLimit) {
    return res.status(403).json({ error: `Bio should not be more than ${bioCharactersLimit} characters long.`})
  }

  const socialLinksArr = Object.keys(socialLinks);

  try {
    for (const platform of socialLinksArr) {
      if (socialLinks[platform].length) {
        const hostname = new URL(socialLinks[platform]).hostname;

        if (!hostname.includes(`${platform}.com`) && platform !== "website") {
          return res.status(403).json({ error: `${platform} link is invalid.` });
        }
      }
    }
  } catch (error) {
    return res.status(403).json({ error: "You must provide full social links with http(s) included." });
  }

  const updateObj = {
    "personalInfo.username": username,
    "personalInfo.bio": bio,
    socialLinks
  };

  try {
    await User.findOneAndUpdate({ _id }, updateObj, { runValidators: true });

    return res.status(200).json({ username });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: "Username is already taken."});
    }

    return res.status(500).json({ error: error.message });
  }
});

app.post("/latest-blogs", async (req, res) => {
  const { page } = req.body;
  const maxLimit = 5;

  try {
    const blogs = await Blog.find({ draft: false })
      .populate("author", "personalInfo.profileImg personalInfo.username personalInfo.fullname -_id")
      .sort({ "publishedAt": -1 })
      .select("blogId title description banner activity tags publishedAt -_id")
      .skip((page - 1) * maxLimit)
      .limit(maxLimit);

    return res.status(200).json({ blogs });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.get("/trending-blogs", async (req, res) => {
  const maxLimit = 5;

  try {
    const blogs = await Blog.find({ draft: false })
      .populate("author", "personalInfo.profileImg personalInfo.username personalInfo.fullname -_id")
      .sort({ "activity.totalReads": -1, "activity.totalLikes": -1, "publishedAt": -1})
      .select("blogId title publishedAt -_id")
      .limit(maxLimit);

    return res.status(200).json({ blogs });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/create-blog", verifyJWT, (req, res) => {
  const authorId = req.user;

  let { title, description, tags, banner, content, draft, id } = req.body;

  if (!title.length) {
    return res
      .status(403)
      .json({ error: "You must provide a blog title to publish a blog." });
  }

  if (!draft) {
    if (!description.length || description.length > 200) {
        return res.status(403).json({
          error: "You must provide a blog description under 200 characters.",
        });
      }

      if (!banner.length) {
        return res
          .status(403)
          .json({ error: "You must provide a blog banner to publish a blog." });
      }

      if (!content.blocks.length) {
        return res
          .status(403)
          .json({ error: "You must provide blog content to publish a blog." });
      }

      if (!tags.length || tags.length > 10) {
        return res
          .status(403)
          .json({ error: "You must provide tags (max 10) to publish a blog." });
      }
  }      

  tags = tags.map((tag) => tag.toLowerCase());

  const blogId = id ||
    title
      .replace(/[^a-zA-Z0-9]/g, " ")
      .replace(/\s+/g, "-")
      .trim() + nanoid();

  if (id) {
    Blog.findOneAndUpdate({blogId}, {title, description, banner, content, tags, draft: Boolean(draft)})
      .then(() => {
        return res.status(200).json({id: blogId})
      }).catch(err => {
        return res.status(500).json({err: err.message});
      })
  } else {
    const blog = new Blog({
    title,
    description,
    banner,
    content,
    tags,
    author: authorId,
    blogId,
    draft: Boolean(draft),
  });

  blog
    .save()
    .then((blog) => {
      const incrementValue = draft ? 0 : 1;

      User.findOneAndUpdate(
        { _id: authorId },
        {
          $inc: { "accountInfo.totalPosts": incrementValue },
          $push: { blogs: blog._id },
        }
      )
        .then((user) => {
          return res.status(201).json({ id: blog.blogId });
        })
        .catch((err) => {
          return res
            .status(500)
            .json({ error: "Failed to update total number of posts." }); 
        });
    })
    .catch((err) => {
      return res.status(500).json({ error: err.message });
    });
  }
});

app.post("/search-blogs", async (req, res) => {
  const {tag, page, query, author, limit, eliminateBlog} = req.body;
  const maxLimit = limit ? limit : 5;
  let findQuery;
  
  try {
    if (tag) {
      findQuery = {tags: tag, draft: false, blogId: {$ne: eliminateBlog}};
    } else if (query) {
      findQuery = {draft: false, title: new RegExp(query, "i")};
    } else if (author) {
      findQuery = {draft: false, author}
    }

    const blogs = await Blog.find(findQuery)
      .populate("author", "personalInfo.profileImg personalInfo.username personalInfo.fullname -_id")
      .sort({ "publishedAt": -1 })
      .select("blogId title description banner activity tags publishedAt -_id")
      .skip((page - 1) * maxLimit)
      .limit(maxLimit);

    return res.status(200).json({ blogs });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/search-blogs-count", async (req, res) => {
  const { tag, query, author } = req.body;
  let findQuery;

  try {
    if (tag) {
      findQuery = {tags: tag, draft: false};
    } else if (query) {
      findQuery = {draft: false, title: new RegExp(query, "i")};
    } else if (author) {
      findQuery = {draft: false, author}
    }

    const documentCount = await Blog.countDocuments(findQuery);

    res.status(200).json({totalDocs: documentCount});
    
  } catch (err) {
    console.log(err.message);
    res.status(500).json({error: err.message});
  }
});

app.post("/all-latest-blogs-count", async(req, res) => {
  try {
    const documentCount = await Blog.countDocuments({draft: false});
    
    return res.status(200).json({totalDocs: documentCount});
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({error: error.message});
  }
});

app.post("/get-profile", async(req, res) => {
  const { username } = req.body;

  try {
    const user = await User.findOne({"personalInfo.username": username})
      .select("-personalInfo.password -googleAuth -updatedAt -blogs");

    return res.status(200).json(user);
  } catch (error) {
    console.log(error);
    return res.status(500).json({error: error.message});
  }
});

app.post("/search-users", async (req, res) => {
  const { query } = req.body;

  try {
    const users = await User.find({"personalInfo.username": new RegExp(query, "i")})
      .limit(50)
      .select("personalInfo.fullname personalInfo.username personalInfo.profileImg -_id")

    return res.status(200).json({users});
  } catch (err) {
    return res.status(500).json({error: err.message})
  }
});

app.post("/get-blog", async (req, res) => {
  const { blogId, draft, mode } = req.body;
  let incrementValue = mode !== "edit" ? 1 : 0;

  try {
    const blog = await Blog.findOneAndUpdate({blogId}, {$inc: {"activity.totalReads": incrementValue}})
      .populate("author", "personalInfo.fullname personalInfo.username personalInfo.profileImg")
      .select("title description content banner activity publishedAt blogId tags");

    const user = await User.findOneAndUpdate({"personalInfo.username": blog.author.personalInfo.username}, {$inc: {"accountInfo.totalReads": incrementValue}});
  
    return res.status(200).json({blog});
  } catch (error) {
    return res.status(500).json({error: error.message});
  }
});

app.post("/like-blog", verifyJWT, async (req, res) => {
  const userId = req.user;
  const { _id, isLikedByUser } = req.body;

  const incrementValue = !isLikedByUser  ? 1 : -1;

  try {
    const blog = await Blog.findOneAndUpdate({_id}, {$inc: {"activity.totalLikes": incrementValue}});

    if (!isLikedByUser) {
      const like = new Notification({
        type: "like",
        blog: _id,
        notificationFor: blog.author,
        user: userId
      })

      const notification = await like.save();

      return res.status(200).json({isLikedByUser: true});
    } else {
      const data = await Notification.findOneAndDelete({user: userId, blog: _id, type: "like"});

      return res.status(200).json({isLikedByUser: false})
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({error: error.message});
  }
});

app.post("/liked-by-user", verifyJWT, async (req, res) => {
  const userId = req.user;
  const { _id } = req.body;

  try {
    const result = await Notification.exists({user: userId, type: "like", blog: _id});

    return res.status(200).json({result});
  } catch (error) {
    console.log(error);
    return res.status(500).json({error: error.message});
  }
});

app.post("/add-comment", verifyJWT, async (req, res) => {
  const userId = req.user;
  const { _id, comment, blogAuthor, replyingTo } = req.body;

  if (!comment.length) {
    return res.status(404).json({error: "Please enter something to leave a comment"});
  }

  const commentObj = {
    blogId: _id, 
    blogAuthor, 
    comment, 
    commentedBy: userId
  };

  if (replyingTo) {
    commentObj.parent = replyingTo;
    commentObj.isReply = true;
  }

  try {
    const commentDoc = await new Comment(commentObj).save();
    const {comment, commentedAt, children} = commentDoc;

    const blog = await Blog.findOneAndUpdate(
      { _id }, 
      {
        $push: {"comments": commentDoc._id}, 
        $inc: {"activity.totalComments": 1, "activity.totalParentComments": replyingTo ? 0 : 1}, 
      }
    );

    const notificationObj = new Notification({
      type: replyingTo ? "reply" : "comment",
      blog: _id,
      notificationFor: blogAuthor,
      user: userId,
      comment: commentDoc._id
    });

    if (replyingTo) {
      notificationObj.repliedOnComment = replyingTo;

      const updatedCommentDoc = await Comment.findOneAndUpdate(
        { _id: replyingTo }, 
        { $push: {children: commentDoc._id} }
      );

      notificationObj.notificationFor = updatedCommentDoc.commentedBy;
    }

    const notification = await notificationObj.save();

    return res.status(200).json({
      comment, commentedAt, _id: commentDoc._id, userId, children
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({error: "Error commenting on a blog"});
  }
});

app.post("/get-blog-comments", async (req, res) => {
  const {blogId, skipCount} = req.body;
  const maxLimit = 5;

  try {
    const comments = await Comment.find({blogId, isReply: false})
      .populate("commentedBy", "personalInfo.username personalInfo.fullname personalInfo.profileImg")
      .skip(skipCount).limit(maxLimit)
      .sort({"commentedAt": -1});

    return res.status(200).json(comments);
  } catch (error) {
    console.log(err.message);
    return res.status(500).json({error: err.message});
  }
});

app.post("/get-replies", async (req, res) => {
  const { _id, skip } = req.body;
  const maxLimit = 5;

  try {
    const comment = await Comment.findOne({ _id })
      .populate({
        path: "children",
        options: {
          limit: maxLimit,
          skip: skip,
          sort: { "commentedAt": -1 }
        },
        populate: {
          path: "commentedBy",
          select: "personalInfo.profileImg personalInfo.fullname personalInfo.username"
        },
        select: "-blogId -updatedAt"
      })
      .select("children");

    return res.status(200).json({replies: comment.children});
  } catch (error) {
    return res.status(500).json({error: error.message});
  }
});

const deleteComments = async ( _id ) => {
  try {
    const deletedComment = await Comment.findOneAndDelete({ _id });

    if (deletedComment.parent) {
      const updatedComment = await Comment.findOneAndUpdate({ _id: deletedComment.parent }, { $pull: { children: _id}});
    }

    const deletedCommentNotification = await Notification.findOneAndDelete({ comment: _id });

    const deletedReplyNotification = await Notification.findOneAndDelete({ reply: _id });

    const updatedBlog = await Blog.findOneAndUpdate(
        { _id: deletedComment.blogId }, 
        { 
          $pull: { comments: _id }, 
          $inc: {
            "activity.totalComments": -1, 
            "activity.totalParentComments": deletedComment.parent ? 0 : -1
          }
        }
    );

    if (deletedComment.children.length) {
      deletedComment.children.map(replies => deleteComments(replies));
    } 

  } catch (error) {
    console.log(error.message);
    res.status(500).json({error: "Error deleting comment"});
  }
};

app.post("/delete-comment", verifyJWT, async (req, res) => {
  const userId = req.user;
  const { _id } = req.body; 

  try {
    const comment = await Comment.findOne({ _id });  
  
    if (userId === comment.commentedBy.toString() || userId === comment.blogAuthor.toStirng()) {
      deleteComments(_id);
  
      return res.status(200).json({status: "done"});
    }
  } catch (error) {
    return res.status(403).json({error: "You cannot delete this comment"});
  }
});

app.get("/new-notification", verifyJWT, async (req, res) => {
  const _id = req.user;

  try {
    const result = await Notification.exists({ notificationFor: _id , seen: false, user: { $ne: _id }});

    if (result) {
      return res.status(200).json({ newNotificationAvailable: true});
    } else {
      return res.status(200).json({ newNotificationAvailable: false });
    }
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
