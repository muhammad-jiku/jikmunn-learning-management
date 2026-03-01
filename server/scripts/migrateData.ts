/**
 * Migration Script: DynamoDB to MongoDB
 *
 * This script migrates data from AWS DynamoDB to MongoDB Atlas.
 * Run this script once after setting up MongoDB to transfer existing data.
 *
 * Prerequisites:
 * - AWS credentials configured (for DynamoDB access)
 * - MongoDB connection string set in environment
 *
 * Usage:
 *   npx ts-node scripts/migrateData.ts
 *
 * Note: This script is for one-time migration only.
 * Install required packages first:
 *   npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  ScanCommand,
  ScanCommandOutput,
} from '@aws-sdk/lib-dynamodb';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load environment variables
dotenv.config();

// Initialize DynamoDB client
const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || '';

// DynamoDB table names (adjust if different)
const TABLES = {
  COURSES: 'Courses',
  TRANSACTIONS: 'Transactions',
  USER_COURSE_PROGRESS: 'UserCourseProgress',
};

// MongoDB schemas for migration
const courseSchema = new mongoose.Schema(
  {
    courseId: { type: String, required: true, unique: true, index: true },
    teacherId: { type: String, required: true, index: true },
    teacherName: { type: String, required: true },
    title: { type: String, required: true },
    description: String,
    category: { type: String, index: true },
    image: String,
    price: Number,
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
    },
    status: {
      type: String,
      enum: ['Draft', 'Published'],
      default: 'Draft',
    },
    sections: [
      {
        sectionId: { type: String, required: true },
        sectionTitle: { type: String, required: true },
        sectionDescription: String,
        chapters: [
          {
            chapterId: { type: String, required: true },
            title: { type: String, required: true },
            content: String,
            video: String,
            youtubeVideoId: String,
            freePreview: { type: Boolean, default: false },
            type: {
              type: String,
              enum: ['Video', 'Text', 'Quiz'],
            },
          },
        ],
      },
    ],
    enrollments: [
      {
        odUserId: { type: String, required: true },
      },
    ],
  },
  { timestamps: true }
);

const transactionSchema = new mongoose.Schema(
  {
    transactionId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    dateTime: { type: String, required: true },
    courseId: { type: String, required: true, index: true },
    paymentProvider: {
      type: String,
      enum: ['stripe'],
      default: 'stripe',
    },
    amount: Number,
  },
  { timestamps: true }
);

const userCourseProgressSchema = new mongoose.Schema(
  {
    odUserId: { type: String, required: true },
    odCourseId: { type: String, required: true },
    enrollmentDate: { type: String, required: true },
    overallProgress: { type: Number, default: 0 },
    sections: [
      {
        sectionId: { type: String, required: true },
        chapters: [
          {
            chapterId: { type: String, required: true },
            completed: { type: Boolean, default: false },
          },
        ],
      },
    ],
    lastAccessedTimestamp: { type: String, required: true },
  },
  { timestamps: true }
);

// Create indexes
userCourseProgressSchema.index(
  { odUserId: 1, odCourseId: 1 },
  { unique: true }
);
userCourseProgressSchema.index({ odUserId: 1 });

// Models
const Course = mongoose.model('Course', courseSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);
const UserCourseProgress = mongoose.model(
  'UserCourseProgress',
  userCourseProgressSchema
);

// Helper to scan all items from a DynamoDB table
async function scanAllItems(tableName: string): Promise<any[]> {
  const items: any[] = [];
  let lastEvaluatedKey: Record<string, any> | undefined;

  console.log(`Scanning DynamoDB table: ${tableName}...`);

  do {
    const command = new ScanCommand({
      TableName: tableName,
      ExclusiveStartKey: lastEvaluatedKey,
    });

    const response: ScanCommandOutput = await docClient.send(command);

    if (response.Items) {
      items.push(...response.Items);
    }

    lastEvaluatedKey = response.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  console.log(`  Found ${items.length} items in ${tableName}`);
  return items;
}

// Migrate courses
async function migrateCourses(): Promise<void> {
  console.log('\n📚 Migrating Courses...');

  try {
    const items = await scanAllItems(TABLES.COURSES);

    if (items.length === 0) {
      console.log('  No courses to migrate.');
      return;
    }

    // Transform data if needed (DynamoDB might have different field structures)
    const courses = items.map((item) => ({
      ...item,
      // Map video URLs to youtubeVideoId if they contain YouTube links
      sections: item.sections?.map((section: any) => ({
        ...section,
        chapters: section.chapters?.map((chapter: any) => {
          // Extract YouTube video ID from existing video URL if applicable
          let youtubeVideoId = chapter.youtubeVideoId;
          if (!youtubeVideoId && chapter.video) {
            const match = chapter.video.match(
              /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
            );
            if (match) {
              youtubeVideoId = match[1];
            }
          }
          return {
            ...chapter,
            youtubeVideoId,
          };
        }),
      })),
    }));

    // Insert into MongoDB
    const result = await Course.insertMany(courses, { ordered: false });
    console.log(`  ✅ Migrated ${result.length} courses successfully.`);
  } catch (error: any) {
    if (error.code === 11000) {
      console.log('  ⚠️ Some courses already exist (duplicate keys).');
    } else {
      console.error('  ❌ Error migrating courses:', error.message);
    }
  }
}

// Migrate transactions
async function migrateTransactions(): Promise<void> {
  console.log('\n💳 Migrating Transactions...');

  try {
    const items = await scanAllItems(TABLES.TRANSACTIONS);

    if (items.length === 0) {
      console.log('  No transactions to migrate.');
      return;
    }

    const result = await Transaction.insertMany(items, { ordered: false });
    console.log(`  ✅ Migrated ${result.length} transactions successfully.`);
  } catch (error: any) {
    if (error.code === 11000) {
      console.log('  ⚠️ Some transactions already exist (duplicate keys).');
    } else {
      console.error('  ❌ Error migrating transactions:', error.message);
    }
  }
}

// Migrate user progress
async function migrateUserProgress(): Promise<void> {
  console.log('\n📈 Migrating User Course Progress...');

  try {
    const items = await scanAllItems(TABLES.USER_COURSE_PROGRESS);

    if (items.length === 0) {
      console.log('  No user progress records to migrate.');
      return;
    }

    const result = await UserCourseProgress.insertMany(items, {
      ordered: false,
    });
    console.log(
      `  ✅ Migrated ${result.length} progress records successfully.`
    );
  } catch (error: any) {
    if (error.code === 11000) {
      console.log('  ⚠️ Some progress records already exist (duplicate keys).');
    } else {
      console.error('  ❌ Error migrating user progress:', error.message);
    }
  }
}

// Main migration function
async function migrate(): Promise<void> {
  console.log('🚀 Starting DynamoDB to MongoDB Migration');
  console.log('=========================================\n');

  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI environment variable is not set!');
    process.exit(1);
  }

  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully.\n');

    // Run migrations
    await migrateCourses();
    await migrateTransactions();
    await migrateUserProgress();

    console.log('\n=========================================');
    console.log('✅ Migration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Verify data in MongoDB Atlas');
    console.log('2. Update your environment variables');
    console.log('3. Remove AWS SDK dependencies if no longer needed');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB.');
  }
}

// Run migration
migrate();
