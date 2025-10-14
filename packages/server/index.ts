import dotenv from 'dotenv';
import express from 'express';
import router from './routes';

// Load environment variables from .env file
dotenv.config();


const app = express();
app.use(express.json());
app.use(router);

const port = process.env.PORT || 3000;

app.listen(port, () => {
   console.log(`Server is running on http://localhost:${port}`);
});
