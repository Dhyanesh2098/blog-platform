const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

const authRoutes = require("./routes/authRoutes");
const postRoutes = require("./routes/postRoutes");
const adminRoutes = require("./routes/adminRoutes");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Serve uploaded images/videos
app.use("/uploads", express.static("uploads"));

app.get("/", (req, res) => {
  res.send("Blog Platform API Running...");
});

// Routes
app.use("/api/auth", authRoutes);

app.use("/api/posts", postRoutes);

app.use("/api/admin", adminRoutes);

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((error) =>
    console.log(
      "MongoDB Error:",
      error.message
    )
  );

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  );
});