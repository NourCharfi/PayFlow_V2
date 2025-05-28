# Build stage
FROM node:18-alpine as builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --quiet

# Copy source code
COPY . .

# Build the application
RUN npm run build --configuration=production

# Create output directory if it doesn't exist
RUN mkdir -p dist/my-frontend

# Production stage
FROM nginx:alpine

# Copy build output
COPY --from=builder /app/dist/my-frontend /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
