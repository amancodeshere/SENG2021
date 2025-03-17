# Use official Node.js image
FROM node:18

# Install Java (Required for xsd-schema-validator)
RUN apt-get update && apt-get install -y default-jre default-jdk && rm -rf /var/lib/apt/lists/*

# Set environment variables for Java
ENV JAVA_HOME=/usr/lib/jvm/default-java
ENV PATH=$JAVA_HOME/bin:$PATH

# Set the correct working directory (Root of the Project)
WORKDIR /app

# Copy package.json and package-lock.json first for caching
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install --omit=dev --verbose || npm install --verbose

# Copy all files into the container
COPY . .

# Set the correct working directory to `/app/src`
WORKDIR /app/src

# Expose the application port
EXPOSE 3000

# Start the application from `src/server.js`
CMD ["node", "server.js"]