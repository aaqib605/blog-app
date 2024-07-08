import express, { query } from "express";
import "dotenv/config";
import bcrypt from "bcrypt";
import { nanoid } from "nanoid";
import jwt from "jsonwebtoken";
import cors from "cors";
import admin from "firebase-admin";
import { getAuth } from "firebase-admin/auth";
import aws from "aws-sdk";
import User from "./schema/User.js";
import connectDB from "./config/db.js";
import serviceAccountKey from "./blog-app-firebase-adminsdk.json" with { type: "json" };
import Blog from "./schema/Blog.js";

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

app.get("/get-upload-image-url", async (req, res) => {
  try {
    const uploadImageURL = await generateUploadImageURL();
    res.status(200).json({ uploadImageURL });
  } catch (error) {
    console.log(error.message);
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

  let { title, description, tags, banner, content, draft } = req.body;

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

  const blogId =
    title
      .replace(/[^a-zA-Z0-9]/g, " ")
      .replace(/\s+/g, "-")
      .trim() + nanoid();

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
});

app.post("/search-blogs", async (req, res) => {
  const maxLimit = 5;
  const {tag, page, query} = req.body;
  let findQuery;
  
  try {
    if (tag) {
      findQuery = {tags: tag, draft: false};
    } else if (query) {
      findQuery = {draft: false, title: new RegExp(query, "i")};
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
  const { tag, query } = req.body;
  let findQuery;

  try {
    if (tag) {
      findQuery = {tags: tag, draft: false};
    } else if (query) {
      findQuery = {draft: false, title: new RegExp(query, "i")};
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

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
