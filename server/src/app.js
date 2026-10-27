import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN }));
app.use(express.json({ limit: '20kb' }));
app.get('/api/health', (_req, res) => res.status(200).json({ success: true, message: 'CampusFix API is ready' }));

export default app;