const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const aiRoutes = require("./routes/aiRoutes");

// Load environment variables
dotenv.config();

// Resolve environment variables for compatibility with older/newer config names
const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
const groqApiKey = process.env.GROQ_API_KEY || process.env.AI_API_KEY;

if (mongoUri) {
  process.env.MONGODB_URI = mongoUri;
} else {
  process.env.MONGODB_URI = "";
}

if (groqApiKey) {
  process.env.GROQ_API_KEY = groqApiKey;
} else {
  process.env.GROQ_API_KEY = "";
}

// Validate required environment variables
const requiredEnvVars = ["MONGODB_URI", "JWT_SECRET", "GROQ_API_KEY"];
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(
    `Missing required environment variables: ${missingEnvVars.join(", ")}`,
  );
  process.exit(1);
}

// Connect to MongoDB
connectDB();

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URL_PROD,
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/ai", aiRoutes);

// Absolute path to client build folder
const __dirnamePath = path.resolve();
const clientBuildPath = path.join(__dirnamePath, "..", "client", "dist");

// Serve static files
app.use(express.static(clientBuildPath));

// For any route not starting with /api, send index.html
app.get("*", (req, res) => {
  if (!req.path.startsWith("/api")) {
    res.sendFile(path.join(clientBuildPath, "index.html"));
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Server Error", error: err.message });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
