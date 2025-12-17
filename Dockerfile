# ===== Base image =====
FROM node:20-alpine

WORKDIR /app

# ===== System deps =====
RUN apk add --no-cache curl bash

# ===== Copy package files =====
COPY package*.json ./

# ===== Install prod deps only =====
RUN npm ci --omit=dev && npm cache clean --force

# ===== Copy source =====
COPY . .

# ===== Writable dirs (runtime only) =====
RUN mkdir -p /tmp/uploads /tmp/logs \
    && chown -R node:node /tmp

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["npm", "start"]
