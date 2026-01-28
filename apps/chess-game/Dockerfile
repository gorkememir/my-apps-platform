FROM node:18-alpine

WORKDIR /app

# Copy workspace files
COPY package*.json ./
COPY packages ./packages
COPY apps/chess-game ./apps/chess-game

# Install dependencies
RUN npm install

WORKDIR /app/apps/chess-game

EXPOSE 3001

CMD ["node", "app.js"]
