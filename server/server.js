import express from "express";
import "dotenv/config";
import bcrypt from "bcrypt";
import { nanoid } from "nanoid";
import jwt from "jsonwebtoken";
import cors from "cors";
import admin from "firebase-admin";
import { getAuth } from "firebase-admin/auth";
import aws from "aws-sdk"
import User from "./schema/User.js";
import connectDB from "./config/db.js";
import serviceAccountKey from "./blog-app-firebase-adminsdk.json" with { type: "json" };

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
})

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
  })

  return uploadImageURL;
}

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
      return res.status(400).json({error: "Invalid credentials"});
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
    res.status(200).json({uploadImageURL});
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({error: error.message})
  }
})

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
