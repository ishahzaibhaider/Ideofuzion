# --- Stage 1: Build Stage ---
# This stage builds your client and server code into a 'dist' folder.
FROM node:18-alpine AS builder

WORKDIR /app

# Copy the single root package.json file
COPY package*.json ./

# Install all dependencies for the entire project from the root
RUN npm install

# Copy the rest of the source code
COPY . .

# Run the build script that creates the final /dist folder
RUN npm run build


# --- Stage 2: Final Production Stage ---
# This stage creates the final, lightweight image for production.
FROM node:18-alpine

WORKDIR /app

# Copy only the production server dependencies manifest
COPY package*.json ./

# Install ONLY production dependencies for the server
RUN npm ci --only=production

# Copy the built application artifacts from the 'builder' stage
COPY --from=builder /app/dist ./dist

# Expose the port your server listens on (e.g., 3000)
EXPOSE 3000

# The command to run your production server
# NOTE: Adjust this if your server entry point is different
CMD [ "node", "dist/server/index.js" ]
