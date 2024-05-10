import express from "express";
import "dotenv/config";
import bcrypt from "bcrypt";
import { nanoid } from "nanoid";
import jwt from "jsonwebtoken";
import cors from "cors";
import admin from "firebase-admin";
import { getAuth } from "firebase-admin/auth";
import User from "./schema/User.js";
import connectDB from "./config/db.js";
import serviceAccountKey from "./blog-app-14cf6-firebase-adminsdk-7nurl-daa6c39582.json" assert { type: "json" };

connectDB();

admin.initializeApp({
  credential: admin.credential.cert(serviceAccountKey),
});

const PORT = process.env.PORT || 8000;
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const formatUserData = (user) => {
  const accessToken = jwt.sign({ id: user._id }, process.env.SECRET_KEY);

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
          "Account was created using Google Auth. Please continue with the same.",
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
            "Please log in using the email and password you used for signing up.",
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
    return res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
