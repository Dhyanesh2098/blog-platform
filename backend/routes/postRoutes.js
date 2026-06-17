const express = require("express");
const multer = require("multer");
const path = require("path");

const Post = require("../models/Post");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

/* ---------- Content Filters ---------- */

const bannedWords = [
  "porn",
  "sex",
  "nude",
  "xxx",
  "adult",
  "18+"
];

function containsBannedContent(text) {
  const lowerText = text.toLowerCase();

  return bannedWords.some((word) =>
    lowerText.includes(word)
  );
}

/* ---------- Multer Setup ---------- */

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    cb(
      null,
      Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage,
});

/* ---------- Get Posts ---------- */

router.get("/", async (req, res) => {
  try {
    const posts = await Post.find()

      .populate("author", "name email")

      .populate("comments.user", "name")

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

      if (
        containsBannedContent(title) ||
        containsBannedContent(content)
      ) {

        return res.status(400).json({
          message:
            "Adult or inappropriate content is not allowed.",
        });

      }

      let media = "";
      let mediaType = "";

      if (req.file) {

        media = req.file.filename;

        if (
          req.file.mimetype.startsWith("image")
        ) {

          mediaType = "image";

        }

        if (
          req.file.mimetype.startsWith("video")
        ) {

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

router.put(
  "/:id",

  authMiddleware,

  async (req, res) => {

    try {

      const post = await Post.findById(
        req.params.id
      );

      if (!post) {

        return res.status(404).json({
          message: "Post not found",
        });

      }

      if (
        post.author.toString() !== req.user.id
      ) {

        return res.status(403).json({
          message: "Unauthorized",
        });

      }

      if (
        containsBannedContent(req.body.title || "") ||
        containsBannedContent(req.body.content || "")
      ) {

        return res.status(400).json({
          message:
            "Adult or inappropriate content is not allowed.",
        });

      }

      post.title =
        req.body.title || post.title;

      post.content =
        req.body.content || post.content;

      await post.save();

      res.json(post);

    } catch (error) {

      res.status(500).json({
        message: error.message,
      });

    }
  }
);

/* ---------- Delete Post ---------- */

router.delete(
  "/:id",

  authMiddleware,

  async (req, res) => {

    try {

      const post = await Post.findById(
        req.params.id
      );

      if (!post) {

        return res.status(404).json({
          message: "Post not found",
        });

      }

      if (
        post.author.toString() !== req.user.id
      ) {

        return res.status(403).json({
          message: "Unauthorized",
        });

      }

      await post.deleteOne();

      res.json({
        message:
          "Post deleted successfully",
      });

    } catch (error) {

      res.status(500).json({
        message: error.message,
      });

    }
  }
);

/* ---------- Add Comment ---------- */

router.post(
  "/:id/comment",

  authMiddleware,

  async (req, res) => {

    try {

      const { text } = req.body;

      if (!text) {

        return res.status(400).json({
          message:
            "Comment cannot be empty",
        });

      }

      if (
        containsBannedContent(text)
      ) {

        return res.status(400).json({
          message:
            "Inappropriate comment is not allowed.",
        });

      }

      const post = await Post.findById(
        req.params.id
      );

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
  }
);

module.exports = router;