
FROM oven/bun:1.1.0

WORKDIR /app

COPY bun.lock package.json tsconfig.json ./
RUN bun install

COPY src ./src
COPY index.ts ./
CMD ["bun", "index.ts"]