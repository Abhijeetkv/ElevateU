import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './configs/mongodb.js';
import { clerkWebhooks } from './controllers/webhooks.js';

const app = express();

// Await the database connection initialization
await connectDB();

// Global Middleware for CORS
app.use(cors());

// Webhook Route (MUST come before the global express.json() middleware)
// We use express.raw() to get the raw request body buffer for Svix signature verification.
app.post('/clerk', express.raw({ type: 'application/json' }), clerkWebhooks);

// Global Middleware for all other routes that need parsed JSON bodies
app.use(express.json());

// Standard Health Check Route
app.get('/', (req, res) => {
    res.send('Welcome to the ElevateU Backend!');
});


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
