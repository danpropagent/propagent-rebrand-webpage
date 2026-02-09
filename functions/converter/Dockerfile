FROM node:24-slim

# Install LibreOffice and fonts
RUN apt-get update && apt-get install -y \
    libreoffice \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

# Set up Node.js app
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .

EXPOSE 8080
CMD ["node", "server.js"]
