require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/database");
const studentRoutes = require("./routes/studentRoutes");

const app = express();
connectDB();

app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*", // restrict to Netlify URL after deployment
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

app.get("/", (req, res) => res.send("Student API is running"));
app.use("/api/students", studentRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));