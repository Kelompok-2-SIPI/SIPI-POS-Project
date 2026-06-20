FROM node:20-alpine

WORKDIR /app

# Install openssl for Prisma compatibility
RUN apk add --no-cache openssl

# Install dependencies terlebih dahulu (layer cache-friendly)
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Generate Prisma client
RUN npx prisma generate

EXPOSE 4000

# Entrypoint: jalankan migrasi kemudian server
CMD ["sh", "entrypoint.sh"]
