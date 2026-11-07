import { connectDatabase } from '../config/db.js';
import { env } from '../config/env.js';
import { User } from '../models/User.js';

if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
  throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD in server/.env before seeding.');
}

await connectDatabase();
const email = env.ADMIN_EMAIL.toLowerCase();
const existing = await User.findOne({ email });
if (existing) {
  console.info(`Admin account ${email} already exists; no changes made.`);
} else {
  await User.create({
    name: env.ADMIN_NAME,
    email,
    password: env.ADMIN_PASSWORD,
    role: 'admin'
  });
  console.info(`Created admin account ${email}.`);
}
await User.db.close();
