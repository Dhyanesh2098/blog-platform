const express = require("express");
const multer = require("multer");
const path = require("path");

const Post = require("../models/Post");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

/* ---------- Content Safety Filter ---------- */

const blockedWords = [
  "porn",
  "xxx",
  "sex",
  "nude",
  "naked",
  "adult",
  "18+",
  "abuse",
  "rape",
  "kill",
  "drugs",
  "fuck",
  "shit",
  "bitch",
  "bastard",
  "asshole",
  "madarchod",
  "bhenchod",
  "chutiya",
  "lund",
  "gandu",
  "lanja",
  "puka",
  "boothu",
  "deng",
  "dengey",
  "thevidiya",
  "punda",
  "munda",
];

function checkContentSafety(text) {
  const lowerText = text.toLowerCase();

  return blockedWords.some((word) =>
    lowerText.includes(word)
  );
}

/* ---------- Multer Setup ---------- */

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "video/mp4",
    "video/webm",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only images and videos are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
});

/* ---------- Get Posts ---------- */

router.get("/", async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("author", "name email role")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

/* ---------- Create Post ---------- */

router.post(
  "/",
  authMiddleware,
  upload.single("media"),
  async (req, res) => {
    try {
      const { title, content } = req.body;

      if (checkContentSafety(title) || checkContentSafety(content)) {
        return res.status(400).json({
          message:
            "This blog violates BlogVerse community guidelines. Please remove adult, abusive, or inappropriate content.",
        });
      }

      let media = "";
      let mediaType = "";

      if (req.file) {
        media = req.file.filename;

        if (req.file.mimetype.startsWith("image")) {
          mediaType = "image";
        }

        if (req.file.mimetype.startsWith("video")) {
          mediaType = "video";
        }
      }

      const post = await Post.create({
        title,
        content,
        media,
        mediaType,
        author: req.user.id,
      });

      res.status(201).json(post);
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }
);

/* ---------- Update Post ---------- */

router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    const user = await User.findById(req.user.id);

    const isOwner = post.author.toString() === req.user.id;
    const isAdmin = user && user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        message: "Unauthorized",
      });
    }

    const newTitle = req.body.title || post.title;
    const newContent = req.body.content || post.content;

    if (checkContentSafety(newTitle) || checkContentSafety(newContent)) {
      return res.status(400).json({
        message:
          "This update violates BlogVerse community guidelines. Please remove adult, abusive, or inappropriate content.",
      });
    }

    post.title = newTitle;
    post.content = newContent;

    await post.save();

    res.json(post);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

/* ---------- Delete Post ---------- */

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    const user = await User.findById(req.user.id);

    const isOwner = post.author.toString() === req.user.id;
    const isAdmin = user && user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        message: "Unauthorized",
      });
    }

    await post.deleteOne();

    res.json({
      message: isAdmin
        ? "Post deleted by admin"
        : "Post deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

/* ---------- Add Comment ---------- */

router.post("/:id/comment", authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;

    if (checkContentSafety(text)) {
      return res.status(400).json({
        message:
          "Your comment contains inappropriate language. Please follow BlogVerse community guidelines.",
      });
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    post.comments.push({
      user: req.user.id,
      text,
    });

    await post.save();

    res.json(post);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

module.exports = router;