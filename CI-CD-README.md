# InsightFlow Backend CI/CD Process

This document outlines the complete CI/CD setup for the InsightFlow backend application, following a hybrid approach combining GitHub Actions for build validation and AWS CodeBuild for deployment.

## Overview

The CI/CD process ensures reliable, automated deployments with proper build validation, containerization, and cloud-native deployment practices using AWS services.

## 1. GitHub Actions - Build Check Pipeline

### Configuration
- **File**: `.github/workflows/build-check.yml`
- **Trigger**: Pull requests to `main` or `prod` branches
- **Runtime**: Ubuntu Latest with Node.js 20

### Process Flow
1. **Code Checkout** - Uses `actions/checkout@v4`
2. **Node.js Setup** - Installs Node.js 20 with Yarn caching
3. **Dependency Installation** - Runs `yarn install --frozen-lockfile`
4. **Prisma Generation** - Generates Prisma client
5. **Build Validation** - Executes `yarn build`
6. **Linting** - Runs ESLint checks
7. **Testing** - Executes unit and e2e tests

### Purpose
Ensures code compiles and builds successfully before merging to main branches.

## 2. AWS CodeBuild - Production Deployment Pipeline

### Configuration
- **File**: `buildspec.yml`
- **Target**: AWS ECS deployment via ECR
- **Region**: ap-southeast-2

### Detailed Process

#### Pre-Build Phase
- Authenticates with Docker Hub using stored credentials
- Logs into Amazon ECR (ap-southeast-2 region)
- Sets up repository variables:
  - ECR Base: `337909774854.dkr.ecr.ap-southeast-2.amazonaws.com`
  - Repository: `insightflow-backend`
  - Generates commit hash-based image tags

#### Build Phase
- Builds Docker image using the multi-stage Dockerfile
- Tags image with both `latest` and commit hash

#### Post-Build Phase
- Pushes both latest and commit-tagged images to ECR
- Creates `imagedefinitions.json` for ECS deployment
- Artifacts include the image definitions file

## 3. Docker Container Strategy

### Multi-Stage Dockerfile

#### Stage 1 (Builder)
- **Base**: Node.js 20 Alpine
- **Process**: Install dependencies → Build TypeScript
- **Output**: Compiled application and Prisma client

#### Stage 2 (Runtime)
- **Base**: Node.js 20 Alpine
- **Features**:
  - Prisma CLI for database migrations
  - Migration script (`migrate-and-start.sh`)
  - Memory optimization (`NODE_OPTIONS=--max-old-space-size=4096`)
  - Port exposure (8000, 80)
  - Health check endpoint

### Startup Process
1. Runs database migrations (`prisma migrate deploy`)
2. Starts the NestJS application (`node ./dist/main.js`)

## 4. Application Architecture

### Technology Stack
- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT (configurable)
- **Cloud Services**: AWS (S3, SES, SQS, ECR, ECS)
- **Caching**: Redis (optional)
- **Documentation**: Swagger (non-production only)

### Key Features
- Global API prefix: `/api`
- Swagger documentation (non-production only)
- Health checks endpoint (`/api/health`)
- CORS enabled
- Request validation with class-validator
- Structured logging

## 5. Environment Configuration

### Development
```bash
# Local development with hot reload
yarn dev

# Docker development environment
yarn docker:dev
```

### Production
- Containerized with automatic migrations
- Optimized memory settings
- Health check monitoring

## 6. Database Management

### Migrations
- Handled automatically during container startup
- Schema managed through Prisma with version-controlled migration files
- Generation: Prisma client generated during build process

### Commands
```bash
# Generate Prisma client
yarn prisma generate

# Create new migration
yarn prisma:migrate

# Deploy migrations (production)
yarn prisma:deploy

# Open Prisma Studio
yarn db:studio
```

## 7. Security & Monitoring

### Secrets Management
- Docker Hub and AWS credentials stored in CodeBuild environment variables
- Environment variables managed through AWS Systems Manager

### Monitoring
- Health check endpoint: `GET /api/health`
- Structured logging with configurable log levels
- Container health checks with Docker

### Security Features
- CORS configuration
- Environment-based Swagger documentation
- Input validation with class-validator

## 8. Local Development Setup

### Prerequisites
- Node.js 20+
- Yarn package manager
- Docker and Docker Compose
- PostgreSQL (or use Docker)

### Quick Start
```bash
# Install dependencies
yarn install

# Set up environment variables
cp env.example .env
# Edit .env with your configuration

# Start development environment
yarn docker:dev

# Or run locally
yarn dev
```

### Available Scripts
```bash
# Development
yarn dev                 # Start with hot reload
yarn start:debug         # Start with debugging

# Building
yarn build               # Build for production
yarn ci:build           # CI build process

# Testing
yarn test               # Run unit tests
yarn test:e2e           # Run e2e tests
yarn test:cov           # Run with coverage
yarn ci:test            # CI test process

# Linting
yarn lint               # Fix linting issues
yarn lint:check         # Check linting without fixing

# Docker
yarn docker:build       # Build Docker image
yarn docker:run         # Run Docker container
yarn docker:dev         # Start development environment
yarn docker:down        # Stop development environment

# Database
yarn prisma:migrate     # Create migration
yarn prisma:deploy      # Deploy migrations
yarn db:studio          # Open Prisma Studio
```

## 9. Deployment Flow Summary

1. **Code Push** → GitHub Actions validates build
2. **Merge to Main** → Triggers AWS CodeBuild
3. **Build & Push** → Docker image pushed to ECR
4. **Deploy** → ECS service updated with new image
5. **Health Check** → Application health verified

## 10. Troubleshooting

### Common Issues
- **Build Failures**: Check GitHub Actions logs for specific errors
- **Database Connection**: Verify DATABASE_URL in environment variables
- **Docker Issues**: Ensure Docker is running and has sufficient resources
- **Migration Errors**: Check Prisma schema and migration files

### Health Check
```bash
# Check application health
curl http://localhost:8000/api/health

# Expected response
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456
}
```

This CI/CD setup ensures reliable, automated deployments with proper build validation, containerization, and cloud-native deployment practices.
