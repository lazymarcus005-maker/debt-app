FROM node:20-alpine

WORKDIR /app

# Build arguments
ARG SUPABASE_URL=https://dummy.supabase.co
ARG SUPABASE_SERVICE_ROLE_KEY=dummy-key
ARG JWT_SECRET=dummy-secret
ARG NEXT_PUBLIC_APP_URL=https://debt.codingholiday.com

# Set build-time environment variables
ENV SUPABASE_URL=${SUPABASE_URL}
ENV SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
ENV JWT_SECRET=${JWT_SECRET}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV PORT=3030

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy app files
COPY . .

# Build Next.js
RUN npm run build

EXPOSE 3030

CMD ["npm", "start"]
