# Use official Node.js image
FROM node:18

# Install Java (Required for xsd-schema-validator)
RUN apt-get update && apt-get install -y default-jre default-jdk && rm -rf /var/lib/apt/lists/*

# Set environment variable for Java
ENV JAVA_HOME=/usr/lib/jvm/default-java
ENV PATH=$JAVA_HOME/bin:$PATH

# Set the correct working directory
WORKDIR /src

# Copy only package.json and package-lock.json first for caching
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install --omit=dev --verbose || npm install --verbose

# Copy the entire project (Ensures server.js is included)
COPY . .

# Expose the application port
EXPOSE 3000

# Set the correct CMD to start the server
CMD ["node", "server.js"]
