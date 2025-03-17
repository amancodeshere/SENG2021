# Use official Node.js image
FROM node:18


# Install Java (Required for xsd-schema-validator)
RUN apt-get update && apt-get install -y openjdk-17-jre


# Set working directory
WORKDIR /src


# Copy package files first (better caching)
COPY package.json package-lock.json ./


# Clear npm cache to prevent install issues
RUN npm cache clean --force


# Run npm install safely (with verbose output for debugging)
RUN npm install --omit=dev --verbose || npm install --verbose


# Copy the entire project
COPY . .


# Fix permissions if needed
RUN chmod -R 777 /src


# Expose the port
EXPOSE 3000


# Start the server
CMD ["node", "server.js"]
