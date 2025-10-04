import {
  DeleteTableCommand,
  ListTablesCommand,
} from '@aws-sdk/client-dynamodb';
import dotenv from 'dotenv';
import dynamoose from 'dynamoose';
import fs from 'fs';
import path from 'path';
import pluralize from 'pluralize';
import Course from '../models/courseModel';
import Transaction from '../models/transactionModel';
import UserCourseProgress from '../models/userCourseProgressModel';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

// 1️⃣ Create a V2‑style DynamoDB instance via Dynamoose’s own constructor:
const customDdb = new dynamoose.aws.ddb.DynamoDB({
  region: process.env.AWS_REGION!,
  credentials: isProduction
    ? undefined
    : {
        accessKeyId: 'dummy',
        secretAccessKey: 'dummy',
      },
  // Only set `endpoint` if you really need a custom URL in prod;
  // for local, you can omit this and call `.local()` instead.
  endpoint: isProduction ? undefined : 'http://localhost:8000',
});

// 2️⃣ Tell Dynamoose to use *that* client:
dynamoose.aws.ddb.set(customDdb);

type JsonItem = Record<string, any>;

async function deleteAllTables() {
  const { TableNames } = await customDdb.send(new ListTablesCommand({}));
  if (TableNames) {
    for (const name of TableNames) {
      await customDdb.send(new DeleteTableCommand({ TableName: name }));
      console.log(`Deleted table: ${name}`);
    }
  }
}

async function createTables() {
  const models = [Transaction, UserCourseProgress, Course];
  for (const model of models) {
    const tableName = model.name;
    console.log(`Ensuring table: ${tableName}`);
    try {
      await new dynamoose.Table(tableName, [model], {
        create: true,
        update: true,
        waitForActive: true,
        throughput: { read: 5, write: 5 },
      });
      console.log(`✔ Table is active: ${tableName}`);
    } catch (err: any) {
      console.log(`Error ensuring table ${tableName}:`, err.message);
    }
  }
}

async function seedData(tableName: string, filePath: string) {
  const items: JsonItem[] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const modelName = pluralize.singular(
    tableName.charAt(0).toUpperCase() + tableName.slice(1)
  );
  console.log(`Seeding data to table: ${modelName}`);
  for (const item of items) {
    try {
      await dynamoose.model(modelName).create(item);
    } catch (err) {
      console.log(`Failed to add item to ${modelName}:`, err);
    }
  }
  console.log(`✔ Seeded ${modelName}`);
}

export default async function seed() {
  await deleteAllTables();
  await createTables();

  const seedDir = path.join(__dirname, './data');
  const files = fs.readdirSync(seedDir).filter((f) => f.endsWith('.json'));
  for (const file of files) {
    const table = path.basename(file, '.json');
    const filePath = path.join(seedDir, file);
    await seedData(table, filePath);
  }
}

if (require.main === module) {
  seed().catch((error) => {
    console.log('Failed to run seed script:', error);
    process.exit(1);
  });
}
