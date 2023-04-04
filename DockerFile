# Use the official Node.js image as the base image
FROM node:16

# Set the working directory in the container
WORKDIR /nasanft-be

# Copy the application files into the working directory
COPY . /nasanft-be

# Install the application dependencies
RUN npm install

# Expose port 3000
EXPOSE 3000

# Define the entry point for the container
CMD ["npm", "start"]