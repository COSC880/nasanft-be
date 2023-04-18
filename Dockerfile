# Use the official Node.js image as the base image
FROM node:16

# Set the working directory in the container
WORKDIR /nasanft-be

# Copy the application files into the working directory
COPY . /nasanft-be

RUN ls src

RUN ls src/schemas

# Install the application dependencies
RUN npm ci

# Set build to production
ENV NODE_ENV=production

# Build the application
RUN npm run build

# Expose port 3000
EXPOSE 3000

# Define the entry point for the container
CMD ["npm", "run", "startServer"]