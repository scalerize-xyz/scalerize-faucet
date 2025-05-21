FROM node:19-alpine

# Set the working directory in the container
WORKDIR /app

COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN npm install -g pnpm
RUN pnpm install --no-frozen-lockfile

COPY . .

# Build the Next app
RUN pnpm build