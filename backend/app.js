import express from "express";
import deviceRoutes from "./routes/deviceRoutes.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();

app.use(express.json());

app.use('/v1/devices', deviceRoutes)

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the API' });
});
   
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});
app.use(errorHandler)

export default app