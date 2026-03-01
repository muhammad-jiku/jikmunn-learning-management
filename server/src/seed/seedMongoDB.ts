/* eslint-disable @typescript-eslint/no-explicit-any */
import dotenv from 'dotenv';
import fs from 'fs';
import mongoose from 'mongoose';
import path from 'path';
import Course from '../models/courseModel';
import Transaction from '../models/transactionModel';
import UserCourseProgress from '../models/userCourseProgressModel';

dotenv.config();

type JsonItem = Record<string, any>;

const models: Record<string, mongoose.Model<any>> = {
  courses: Course,
  transactions: Transaction,
  userCourseProgress: UserCourseProgress,
};

async function clearCollections() {
  for (const [name, model] of Object.entries(models)) {
    await model.deleteMany({});
    console.log(`Cleared collection: ${name}`);
  }
}

async function seedData(collectionName: string, filePath: string) {
  const items: JsonItem[] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const model = models[collectionName];

  if (!model) {
    console.log(`No model found for collection: ${collectionName}, skipping`);
    return;
  }

  console.log(`Seeding data to collection: ${collectionName}`);
  try {
    await model.insertMany(items, { ordered: false });
    console.log(`✔ Seeded ${items.length} items to ${collectionName}`);
  } catch (err: any) {
    if (err.code === 11000) {
      console.log(
        `⚠ Some items in ${collectionName} already exist (duplicates skipped)`
      );
    } else {
      console.log(`Failed to seed ${collectionName}:`, err.message);
    }
  }
}

export default async function seed() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  await clearCollections();

  const seedDir = path.join(__dirname, './data');
  const files = fs.readdirSync(seedDir).filter((f) => f.endsWith('.json'));
  for (const file of files) {
    const collectionName = path.basename(file, '.json');
    const filePath = path.join(seedDir, file);
    await seedData(collectionName, filePath);
  }

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
}

if (require.main === module) {
  seed().catch((error) => {
    console.log('Failed to run seed script:', error);
    process.exit(1);
  });
}
