# Docker Setup Guide

This guide provides step-by-step instructions for running the Learning Management System using Docker.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- All required API keys (Clerk, Stripe, Cloudinary)

## Architecture Overview

The Docker setup includes three services:

| Service | Container Name | Port  | Description           |
| ------- | -------------- | ----- | --------------------- |
| MongoDB | lms-mongo      | 27017 | Database              |
| Server  | lms-server     | 8000  | Backend API (Express) |
| Client  | lms-client     | 3000  | Frontend (Next.js)    |

## Step 1: Create Environment File

In the project root directory, create a `.env` file from the example:

```bash
cp .env.example .env
```

Edit the `.env` file with your actual values:

```env
# ================================
# MongoDB (Docker)
# ================================
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=your_secure_password_here

# ================================
# Clerk Authentication
# ================================
# Get these from: https://dashboard.clerk.com
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxx
CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxx

# ================================
# Stripe Payments
# ================================
# Get these from: https://dashboard.stripe.com
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxx

# ================================
# Cloudinary (Image/Video Uploads)
# ================================
# Get these from: https://cloudinary.com/console
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Step 2: Build Docker Images

Build all containers:

```bash
docker-compose build
```

To build a specific service:

```bash
docker-compose build client
docker-compose build server
```

## Step 3: Start Services

Start all services in detached mode:

```bash
docker-compose up -d
```

This will:

1. Start MongoDB and wait for it to be healthy
2. Start the backend server (depends on MongoDB)
3. Start the frontend client (depends on server)

## Step 4: Verify Services

Check that all containers are running:

```bash
docker-compose ps
```

Expected output:

```
NAME          STATUS                   PORTS
lms-mongo     Up (healthy)             0.0.0.0:27017->27017/tcp
lms-server    Up                       0.0.0.0:8000->8000/tcp
lms-client    Up                       0.0.0.0:3000->3000/tcp
```

View logs to ensure services started correctly:

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f server
docker-compose logs -f client
docker-compose logs -f mongo
```

## Step 5: Access the Application

| Service     | URL                       |
| ----------- | ------------------------- |
| Frontend    | http://localhost:3000     |
| Backend API | http://localhost:8000     |
| MongoDB     | mongodb://localhost:27017 |

## Step 6: Seed Database (Optional)

To populate the database with sample data:

```bash
docker-compose exec server npm run seed
```

## Common Commands

### Stop Services

```bash
# Stop all services (containers remain)
docker-compose stop

# Stop and remove containers
docker-compose down

# Stop, remove containers, AND delete volumes (clears database)
docker-compose down -v
```

### Restart Services

```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart server
docker-compose restart client
```

### View Logs

```bash
# Follow all logs
docker-compose logs -f

# View last 100 lines of a service
docker-compose logs --tail=100 server
```

### Execute Commands in Container

```bash
# Open shell in server container
docker-compose exec server sh

# Run npm commands in server
docker-compose exec server npm run migrate

# Open MongoDB shell
docker-compose exec mongo mongosh -u admin -p your_password
```

### Rebuild After Code Changes

```bash
# Rebuild and restart a specific service
docker-compose up -d --build server

# Rebuild all services
docker-compose up -d --build
```

## Troubleshooting

### Container Won't Start

1. Check logs for errors:

   ```bash
   docker-compose logs server
   ```

2. Verify environment variables are set:

   ```bash
   docker-compose config
   ```

3. Ensure ports aren't in use:

   ```bash
   # Windows
   netstat -ano | findstr :3000
   netstat -ano | findstr :8000

   # Linux/Mac
   lsof -i :3000
   lsof -i :8000
   ```

### MongoDB Connection Issues

1. Check MongoDB is healthy:

   ```bash
   docker-compose ps mongo
   ```

2. Verify credentials in `.env` match what MongoDB was initialized with

3. If changing credentials, remove the volume first:
   ```bash
   docker-compose down -v
   docker-compose up -d
   ```

### Build Failures

1. Clear Docker cache and rebuild:

   ```bash
   docker-compose build --no-cache
   ```

2. Ensure you have enough disk space:

   ```bash
   docker system df
   ```

3. Prune unused images/containers:
   ```bash
   docker system prune -a
   ```

### Hot Reload Not Working

The Docker setup is configured for **production builds**. For development with hot reload, use:

```bash
npm run dev
```

## Production Deployment

For production deployment, ensure:

1. **Strong passwords** - Use secure values for `MONGO_ROOT_PASSWORD`
2. **Production API keys** - Use live keys instead of test keys
3. **HTTPS** - Put a reverse proxy (nginx, Traefik) in front
4. **Resource limits** - Add memory/CPU limits in docker-compose.yml
5. **Logging** - Configure log aggregation

Example production additions to `docker-compose.yml`:

```yaml
services:
  server:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
    logging:
      driver: json-file
      options:
        max-size: '10m'
        max-file: '3'
```

## Development vs Docker

| Scenario                          | Command                                           |
| --------------------------------- | ------------------------------------------------- |
| Local development with hot reload | `npm run dev`                                     |
| Test production build locally     | `docker-compose up`                               |
| CI/CD testing                     | `docker-compose up -d`                            |
| Production deployment             | `docker-compose -f docker-compose.prod.yml up -d` |
