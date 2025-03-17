# Use official Node.js image
FROM node:18


# Install Java (Required for xsd-schema-validator)
RUN apt-get update && apt-get install -y openjdk-17-jre


# Set working directory
WORKDIR /app


# Copy package.json and install dependencies
COPY package.json package-lock.json ./


# Ensure clean build by forcing a full install
RUN npm ci --omit=dev


# Copy the entire project
COPY . .


# Expose the port the app runs on
EXPOSE 3000


# Start the server
CMD ["node", "server.js"]
