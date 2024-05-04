import express from "express";
import "dotenv/config";
import bcrypt from "bcrypt";
import { nanoid } from "nanoid";
import jwt from "jsonwebtoken";
import User from "./schema/User.js";
import connectDB from "./config/db.js";

connectDB();

const PORT = process.env.PORT || 8000;
const app = express();

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
  const { fullname, email, password } = req.body;

  if (!fullname || !email || !password) {
    return res.status(403).json({ error: "Please add all required fields" });
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

  user
    .save()
    .then((u) => {
      return res.status(201).json(formatUserData(u));
    })
    .catch((err) => {
      if (err.code === 11000) {
        return res.status(400).json({ error: "User already exists" });
      }

      return res.status(500).json({ error: err.message });
    });
});

app.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ "personalInfo.email": email });

    if (user && (await bcrypt.compare(password, user.personalInfo.password))) {
      return res.json(formatUserData(user));
    } else {
      return res.status(400).json({ error: "Invalid credentials" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
