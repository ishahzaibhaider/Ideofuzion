# --- Stage 1: Build Stage ---
FROM node:18-alpine AS builder
WORKDIR /app

# Copy package files and install all dependencies for building
COPY package*.json ./
RUN npm install

# Copy all source code
COPY . .

# Run the build script
RUN npm run build


# --- Stage 2: Final Production Stage ---
FROM node:18-alpine
WORKDIR /app

# Copy package files for production
COPY package*.json ./

# Install ONLY production dependencies
RUN npm ci --only=production

# Copy the entire 'dist' folder (with client and server code) from the builder stage
COPY --from=builder /app/dist ./dist

# Copy test scripts for debugging
COPY test-n8n-production.js ./
COPY simple-n8n-test.js ./
COPY test-signup-flow.js ./

# Expose the port the app runs on
EXPOSE 3000

# The command to run the production server
CMD [ "node", "dist/server/index.js" ]
