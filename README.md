# Jikmunn Learning Management

_An intuitive full-stack learning management platform built with Next.js, Express, Clerk, DynamoDB, Docker, and AWS._

**Learn Now** is an online learning platform under the Jikmunn Learning Management project. It lets users sign in, find and purchase courses, and enroll seamlessly. Teachers can upload videos, quizzes, and resources to create and manage courses efficiently.

[![Banner](https://jikmunn-learning-management-s3.s3.ap-southeast-1.amazonaws.com/banner.png)](https://main.dyzx1mm2ql9zq.amplifyapp.com/)
👉 Click the image to visit the site.

---

## 🎉 Roadmap

This project is currently available, with the following features:

- Responsive web UI for students and teachers 🌐
- Integration with payment gateways 💳
- Student dashboard to browse, filter, and enroll in courses 📚
- Teacher dashboard to manage chapters, sections, courses, and payments 🧑‍🏫
- Secure authentication & role-based access control 🔐
- Advanced search with filters 🔎

_Planned features (coming soon):_

- Notifications for actions (daily, weekly, immediate) 🔔
- In-video notes and quiz-taking features ✍️
- Multi-language and multi-currency support 🌍
- Mobile apps for iOS and Android 📱

---

## 🛠️ Tech Stack

- **Frontend:** Next.js + TailwindCSS ⚡ — fast, responsive UI
- **Backend:** Express.js (containerized with Docker) 🐳 — scalable API layer
- **Database:** DynamoDB — serverless NoSQL database ⚡️
- **Storage:** Amazon S3 ☁️ — file & media storage
- **Deployment:** AWS (ECR, Lambda, S3, Amplify, API Gateway) + Vercel 🚀 — cloud-native hosting

---

## 👨‍🚀 Getting Started

> 🚧 You will need [Node.js](https://nodejs.org/en/) installed.

### 1. Clone the repository

```bash
git clone https://github.com/muhammad-jiku/jikmunn-learning-management.git
```

---

### 2. Frontend Setup

```bash
cd client
yarn
```

Create an `.env` file inside the `client` folder:

```bash
NEXT_PUBLIC_LOCAL_URL= # Your localhost (e.g. http://localhost:3000)
NEXT_PUBLIC_AMPLIFY_URL= # Your Amplify URL (if deployed on AWS Amplify)
NEXT_PUBLIC_VERCEL_URL= # Your Vercel URL (if deployed on Vercel)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY= # Your Stripe Publishable Key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY= # Your Clerk Publishable Key
NEXT_PUBLIC_API_BASE_URL= # Your API Base URL
```

Run the development server:

```bash
yarn dev
```

---

### 3. Backend Setup

```bash
cd server
yarn
```

Create an `.env` file inside the `server` folder:

```bash
PORT= # Your PORT (for localhost, e.g. 4000)
NODE_ENV= # development or production
AWS_REGION= # Your AWS Region (e.g. us-east-1)
S3_BUCKET_NAME= # Your S3 Bucket Name
AWS_ACCESS_KEY_ID= # Your AWS IAM Access Key ID
AWS_SECRET_ACCESS_KEY= # Your AWS IAM Secret Access Key
CLOUDFRONT_DOMAIN= # Your CloudFront domain
STRIPE_SECRET_KEY= # Your Stripe Secret Key
CLERK_PUBLISHABLE_KEY= # Your Clerk Publishable Key
CLERK_SECRET_KEY= # Your Clerk Secret Key
```

Run the backend server:

```bash
yarn dev
```

---

✅ You’re all set! The frontend will run on `http://localhost:3000` and the backend on your configured API base URL.
