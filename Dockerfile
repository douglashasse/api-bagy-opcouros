FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev --ignore-scripts

COPY src ./src

ENV NODE_ENV=production
EXPOSE 3099

CMD ["npm", "start"]
