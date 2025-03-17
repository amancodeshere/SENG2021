# Use official Node.js image
FROM node:18

# Install Java (Required for xsd-schema-validator)
RUN apt-get update && apt-get install -y default-jre default-jdk && rm -rf /var/lib/apt/lists/*

# Set environment variable for Java
ENV JAVA_HOME=/usr/lib/jvm/default-java
ENV PATH=$JAVA_HOME/bin:$PATH

# Set working directory
WORKDIR /src

# Copy package.json and package-lock.json first (for better caching)
COPY package.json package-lock.json ./

# Install dependencies (Ensuring xsd-schema-validator works)
RUN npm install --omit=dev --verbose || npm install --verbose

# Copy the entire project
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Start the server
CMD ["node", "server.js"]