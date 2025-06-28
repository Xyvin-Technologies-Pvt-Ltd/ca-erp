# syntax=docker/dockerfile:1
ARG NODE_VERSION=22.11.0
FROM node:${NODE_VERSION}-alpine

ENV NODE_ENV=production

WORKDIR /usr/src/app

# Pre-create logs directory and set permissions BEFORE switching users
RUN mkdir -p /usr/src/app/logs \
    && chown -R node:node /usr/src/app

# Download dependencies
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev

# Switch to non-root user after setting permissions
USER node

# Copy source files after user switch (safe since ownership is set)
COPY . .

EXPOSE 5001

CMD ["npm", "start"]
