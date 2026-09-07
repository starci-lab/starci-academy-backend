FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/tsconfig.json ./apps/api/
COPY apps/web/package.json apps/web/tsconfig.json ./apps/web/
COPY packages/contracts/package.json packages/contracts/tsconfig.json ./packages/contracts/
RUN npm ci
COPY apps/api/src ./apps/api/src
COPY apps/api/data ./apps/api/data
COPY apps/web/src ./apps/web/src
COPY apps/web/public ./apps/web/public
COPY apps/web/index.html apps/web/vite.config.ts ./apps/web/
COPY packages/contracts/src ./packages/contracts/src
RUN npm run check
RUN npm prune --omit=dev

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production FORM_COPILOT_HOST=0.0.0.0 FORM_COPILOT_PORT=4317 PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
RUN node node_modules/playwright-core/cli.js install --with-deps chromium && chmod -R a+rX /ms-playwright
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/data ./apps/api/data
COPY --from=build /app/apps/web/dist ./apps/web/dist
COPY --from=build /app/packages/contracts/package.json ./packages/contracts/package.json
COPY --from=build /app/packages/contracts/dist ./packages/contracts/dist
COPY scripts/smoke-browser.mjs ./scripts/smoke-browser.mjs
USER node
EXPOSE 4317
CMD ["node", "apps/api/dist/main.js"]
