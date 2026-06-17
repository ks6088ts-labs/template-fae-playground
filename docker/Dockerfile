# syntax=docker/dockerfile:1

# ---- build stage ----
FROM node:24.10.0-alpine AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# ---- runtime stage ----
FROM nginx:alpine AS runtime
ARG GIT_REVISION="0000000"
ARG GIT_TAG="x.x.x"
LABEL org.opencontainers.image.revision="${GIT_REVISION}" \
      org.opencontainers.image.version="${GIT_TAG}" \
      org.opencontainers.image.source="https://github.com/ks6088ts-labs/template-fae-playground"
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
