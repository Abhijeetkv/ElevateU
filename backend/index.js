import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./configs/mongodb.js";
import connectCloudinary from "./configs/cloudinary.js";
import { clerkWebhooks, stripeWebhooks } from "./controllers/webhooks.js";
import educatorRouter from "./routes/educatorRoutes.js";
import { clerkMiddleware } from "@clerk/express";
import courseRouter from "./routes/courseRoutes.js";
import userRouter from "./routes/userRoutes.js";

const app = express();

// ✅ Initialize DB and Cloudinary before routes
await connectDB();
await connectCloudinary();

app.use(cors());

// ---------------------------
// ✅ 1. RAW webhook routes (must come BEFORE json middleware)
// ---------------------------
app.post(
  "/api/webhooks/clerk",
  express.raw({ type: "application/json" }),
  clerkWebhooks
);
app.post(
  "/api/webhooks/stripe",
  express.raw({ type: "application/json" }),
  stripeWebhooks
);

// ---------------------------
// ✅ 2. Normal JSON middleware for all other routes
// ---------------------------
app.use(express.json());

// ---------------------------
// ✅ 3. Clerk middleware (AFTER webhooks)
// ---------------------------
app.use(clerkMiddleware());

// ---------------------------
// ✅ 4. App routes
// ---------------------------
app.use("/api/educator", educatorRouter);
app.use("/api/course", courseRouter);
app.use("/api/user", userRouter);

// Health Check
app.get("/", (req, res) => {
  res.send("🚀 Welcome to ElevateU Backend!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
