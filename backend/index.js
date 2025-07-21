import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './configs/mongodb.js';

const app = express();

await connectDB()

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Welcome to the ElevateU Backend!');
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});