# Stage 1: Build the application
FROM node:20-alpine3.19 AS builder

WORKDIR /usr/src/app

# Copy package.json and yarn.lock first to leverage Docker cache
COPY package.json yarn.lock ./

# Install dependencies using Yarn
RUN yarn install --frozen-lockfile && yarn global add typescript

# Copy the rest of the application files
COPY . .

# Build the TypeScript code
RUN yarn build

# Stage 2: Create the final image
FROM node:20-alpine3.19

WORKDIR /usr/src/app

# Install Prisma CLI in the final image
RUN yarn global add prisma

# Copy the built files from the builder stage
COPY --from=builder /usr/src/app .

# Copy the Prisma migration files
COPY prisma ./prisma

# Copy the migration and start script
COPY migrate-and-start.sh ./

# Set Node.js options to increase memory limit
ENV NODE_OPTIONS=--max-old-space-size=4096

# Expose the port your app runs on
EXPOSE 8000
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Command to run the migration script and then start the application
CMD ["./migrate-and-start.sh"]
