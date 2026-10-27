import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDatabase } from './config/database.js';
import Issue from './models/Issue.js';
import User from './models/User.js';

const demoIssues = [
  { title: 'Lights flickering in east stairwell', description: 'The lights on the second-floor landing flicker throughout the day.', category: 'Electrical', location: 'East Hall, stairwell B', priority: 'High', status: 'Open' },
  { title: 'Water fountain has low pressure', description: 'The fountain sprays very slowly and the drain is backing up.', category: 'Plumbing', location: 'Library, first floor', priority: 'Medium', status: 'In Progress' },
  { title: 'Wireless network drops in study room', description: 'Devices disconnect every few minutes in the west study area.', category: 'Network', location: 'Learning Commons, room 204', priority: 'High', status: 'Open' },
  { title: 'Bench slat is loose near quad', description: 'One of the wooden slats has come loose and shifts when someone sits.', category: 'Furniture', location: 'North campus quad', priority: 'Low', status: 'Resolved' },
  { title: 'Overflowing recycling bin', description: 'The recycling bin is full and paper is collecting beside it.', category: 'Cleanliness', location: 'Science Building, lobby', priority: 'Low', status: 'Open' },
];

async function seed() {
  const { SEED_ADMIN_EMAIL: email, SEED_ADMIN_PASSWORD: password } = process.env;
  if (!process.env.MONGODB_URI || !email || !password || password.length < 12) {
    throw new Error('Set MONGODB_URI, SEED_ADMIN_EMAIL, and a SEED_ADMIN_PASSWORD of at least 12 characters');
  }

  await connectDatabase();
  const hashedPassword = await bcrypt.hash(password, 12);
  let admin = await User.findOne({ email: email.toLowerCase() });
  if (admin) {
    admin.name = process.env.SEED_ADMIN_NAME || 'CampusFix Admin';
    admin.password = hashedPassword;
    admin.role = 'admin';
    await admin.save();
  } else {
    admin = await User.create({
      name: process.env.SEED_ADMIN_NAME || 'CampusFix Admin',
      email,
      password: hashedPassword,
      role: 'admin',
    });
  }

  const demoTitles = demoIssues.map(({ title }) => title);
  const existingTitles = await Issue.distinct('title', { reportedBy: admin._id, title: { $in: demoTitles } });
  const missingIssues = demoIssues.filter(({ title }) => !existingTitles.includes(title));
  if (missingIssues.length) {
    await Issue.insertMany(missingIssues.map((issue) => ({ ...issue, reportedBy: admin._id })));
  }
  console.log(`Seeded admin ${admin.email}; added ${missingIssues.length} demo issue(s).`);
}

try {
  await seed();
} catch (error) {
  console.error(`Seed failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}