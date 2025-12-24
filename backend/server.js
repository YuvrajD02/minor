import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

// Import Routes
import authRoutes from "./routes/auth.js";
import googleAuthRoutes from "./routes/google.js";
import predictRoutes from "./routes/predict.js";
import doctorsRoutes from "./routes/doctors.js";
import historyRoutes from "./routes/history.js";

dotenv.config();

const app = express();

// Middlewares
app.use(cors({
 origin: [
    "http://localhost:5173",
    "https://healthchecka.netlify.app"
  ], 
  // React (Vite) frontend URL
  credentials: true
}));
app.use(express.json());

// Default Test Route
app.get("/", (req, res) => {
  res.status(200).json({ message: "HealthCheck AI Backend is running..." });
});

// Database Connection + Start Server
const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: "healthcheck",
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("MongoDB Connected");

    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () =>
      console.log(`🚀 Server running on port ${PORT}`)
    );

  } catch (error) {
    console.error("❌ MongoDB Error:", error);
  }
};

// Attach Routes After DB Connects
app.use("/api/auth", authRoutes);            // email/password signup & login
app.use("/api/auth/google", googleAuthRoutes); // google login
app.use("/api/predict", predictRoutes);      // AI prediction
app.use("/api/doctors", doctorsRoutes);      // doctors list API
app.use("/api/history", historyRoutes);      // diagnosis history

startServer();
