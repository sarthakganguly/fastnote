# Step 1: Base Image
# Use the latest Long-Term Support (LTS) version of Node.js on an Alpine base.
# This provides a great balance of modern features and a small, secure footprint.
FROM node:lts-alpine

# Step 2: Set Working Directory
WORKDIR /app

# Step 3: Copy package files and Install Dependencies
# Using the wildcard copies both package.json and package-lock.json.
# This step is cached by Docker and only re-runs if these files change.
COPY package*.json ./
RUN npm install

# Step 4: Copy Application Source Code
COPY . .

# Step 5: Expose Port
# Expose the port the React dev server runs on.
EXPOSE 3000

# Step 6: Define Startup Command
# The command to run when the container starts.
CMD ["npm", "start"]