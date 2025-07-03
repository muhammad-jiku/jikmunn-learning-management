import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import * as dynamoose from 'dynamoose';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import serverless from 'serverless-http';
import courseRoutes from './routes/courseRoutes';
import transactionRoutes from './routes/transactionRoutes';
import userCourseProgressRoutes from './routes/userCourseProgressRoutes';
import seed from './seed/seedDynamoDB';

/* CONFIGURATIONS */
dotenv.config();
const isProduction = process.env.NODE_ENV === 'production';
if (!isProduction) {
  dynamoose.aws.ddb.local();
}

const app = express();
app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }));
app.use(morgan('common'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

/* ROUTES */
app.get('/', (req, res) => {
  res.send('Hello World');
});

app.use('/courses', courseRoutes);
app.use('/transactions', transactionRoutes);
app.use('/users/course-progress', userCourseProgressRoutes);

/* SERVER */
const port = process.env.PORT || 3000;
if (!isProduction) {
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

// aws production environment
const serverlessApp = serverless(app);
export const handler = async (event: any, context: any) => {
  if (event.action === 'seed') {
    await seed();
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Data seeded successfully' }),
    };
  } else {
    return serverlessApp(event, context);
  }
};
