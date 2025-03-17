# Use official Node.js image
FROM node:18


# Install system dependencies required by some npm packages
RUN apt-get update && apt-get install -y openjdk-17-jre ca-certificates && rm -rf /var/lib/apt/lists/*


# Set working directory inside the container
WORKDIR /app


# Copy only package files first (optimizes Docker layer caching)
COPY package.json package-lock.json ./


# Force a clean npm cache (prevents conflicts)
RUN npm cache clean --force


# Install dependencies without optional packages
RUN npm install --omit=optional --omit=dev --verbose || npm install --verbose


# Copy the rest of the project files
COPY . .


# Ensure permissions are set correctly
RUN chmod -R 777 /app


# Expose the port your application uses
EXPOSE 3000


# Start the server
CMD ["node", "server.js"]