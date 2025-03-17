# Use official Node.js image
FROM node:18


# Install Java (Required for xsd-schema-validator)
RUN apt-get update && apt-get install -y openjdk-17-jre


# Set working directory
WORKDIR /app


# Copy package.json and package-lock.json first (for better Docker caching)
COPY package.json package-lock.json ./


# Ensure clean install with logs enabled (fallback to `npm install` if needed)
RUN npm install --omit=dev || npm install


# Copy the entire project after dependencies are installed
COPY . .


# Fix file permissions if needed
RUN chmod -R 777 /app


# Expose the port the app runs on
EXPOSE 3000


# Start the server
CMD ["node", "server.js"]