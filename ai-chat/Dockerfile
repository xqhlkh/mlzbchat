FROM node:20-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY server/ ./
COPY --from=client-builder /app/client/dist ./client/dist
RUN npm ci --production
RUN mkdir -p /tmp/ai-chat-uploads

EXPOSE 3000
ENV HOST=0.0.0.0
ENV PORT=3000
ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
