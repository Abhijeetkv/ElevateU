import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './configs/mongodb.js';
import User from './models/User.js'
import { clerkWebhooks } from './controllers/webhooks.js';


const app = express();

await connectDB()

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Welcome to the ElevateU Backend!');
});

app.post('/clerk', express.json(), clerkWebhooks)

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});