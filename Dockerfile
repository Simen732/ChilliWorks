FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package.json files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Bundle app source
COPY . .

# Expose port 
EXPOSE 3000

# Define command to run the app
CMD ["node", "app.js"]
