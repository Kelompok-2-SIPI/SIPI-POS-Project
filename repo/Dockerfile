FROM node:22-alpine

WORKDIR /app

# Install openssl for Prisma
RUN apk add --no-cache openssl

COPY package*.json ./

RUN npm install

COPY prisma ./prisma/

# Generate Prisma client
RUN npx prisma generate

COPY . .

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Command to push schema, seed, and run development server
CMD ["sh", "-c", "npx prisma db push && npx tsx prisma/seed.ts && npm run dev"]
