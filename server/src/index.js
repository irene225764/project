import 'dotenv/config';
import app from './app.js';
import { connectDatabase } from './config/database.js';

const port = process.env.PORT || 5000;

try {
  await connectDatabase();
  app.listen(port, () => console.log(`CampusFix API listening on ${port}`));
} catch (error) {
  console.error(`Unable to start server: ${error.message}`);
  process.exitCode = 1;
}