# ------------------------------
# Stage 1: Build Frontend (Vite)
# ------------------------------
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Accept Build Args for Vite (Required for Google Auth)
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_GOOGLE_CLIENT_ID=\$VITE_GOOGLE_CLIENT_ID

# Build the React app
RUN npm run build

# ------------------------------
# Stage 2: Production Server
# ------------------------------
FROM node:20-alpine
WORKDIR /app

# Install ONLY production dependencies (server.js, express, google-auth-library)
COPY package*.json ./
RUN npm install --omit=dev

# Copy the built frontend assets from Stage 1
COPY --from=builder /app/dist ./dist

# Copy the backend server file
COPY server.js .

# Expose the port (Cloud Run defaults to 8080)
EXPOSE 8080

# Start the Node.js server
CMD ["node", "server.js"]
EOF

