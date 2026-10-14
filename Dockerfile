FROM node:20-alpine

WORKDIR /app

# Copy package definition
COPY package.json ./

# Copy frontend source files
COPY . .

# Generate config from environment during build
RUN npm run build

# Render sets PORT dynamically (defaults to 3000)
ENV PORT=3000
EXPOSE 3000

CMD ["node", "server.js"]
