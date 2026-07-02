# ══════════════════════════════════════════════════════════════════════════════
# Stage 1 — Builder: TypeScript derle, frontend ve backend oluştur
# ══════════════════════════════════════════════════════════════════════════════
FROM node:24-slim AS builder

ENV DEBIAN_FRONTEND=noninteractive

WORKDIR /app

# corepack ile pnpm kur (npm install -g OOM yaşatır)
RUN corepack enable && corepack prepare pnpm@10.26.1 --activate

# Workspace konfigürasyonu önce kopyala (bağımlılık önbellekleme için)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc \
     tsconfig.base.json tsconfig.json ./

# Lib ve artifact paketlerinin package.json dosyaları
COPY lib/db/package.json                             ./lib/db/
COPY lib/api-spec/package.json                       ./lib/api-spec/
COPY lib/api-zod/package.json                        ./lib/api-zod/
COPY lib/api-client-react/package.json               ./lib/api-client-react/
COPY lib/integrations-openai-ai-react/package.json   ./lib/integrations-openai-ai-react/
COPY lib/integrations-openai-ai-server/package.json  ./lib/integrations-openai-ai-server/
COPY artifacts/api-server/package.json               ./artifacts/api-server/
COPY artifacts/bw-salon/package.json                 ./artifacts/bw-salon/
COPY scripts/package.json                            ./scripts/

# puppeteer'in kendi Chrome'unu indirmesini engelle — sistem Chromium kullanacağız
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Tüm bağımlılıkları kur (frozen, CI güvenli)
RUN pnpm install --frozen-lockfile

# Kaynak kodları kopyala
COPY lib/       ./lib/
COPY artifacts/ ./artifacts/
COPY scripts/   ./scripts/

# Üretim build: lib + frontend + backend
RUN pnpm run build:production

# ══════════════════════════════════════════════════════════════════════════════
# Stage 2 — Runner: Chromium dahil hafif üretim imajı
# ══════════════════════════════════════════════════════════════════════════════
FROM node:24-slim AS runner

ENV DEBIAN_FRONTEND=noninteractive

# APT güvenilirlik: 5 retry, 60s timeout
RUN printf 'Acquire::Retries "5";\nAcquire::http::Timeout "60";\nAcquire::https::Timeout "60";\n' \
      > /etc/apt/apt.conf.d/99-retries

# Chromium ve whatsapp-web.js gereksinimleri — TEK apt-get çağrısı
# NOT: chromium-sandbox Debian bookworm'da AYRI PAKET DEĞİL, chromium içine dahil
# NOT: libasound2 → libasound2t64 (Debian bookworm yeniden adlandırdı)
RUN apt-get update -y && \
    apt-get install -y --no-install-recommends \
        ca-certificates \
        chromium \
        fonts-freefont-ttf \
        libnss3 \
        libatk-bridge2.0-0 \
        libcups2 \
        libdrm2 \
        libxcomposite1 \
        libxdamage1 \
        libxfixes3 \
        libxrandr2 \
        libgbm1 \
        libxkbcommon0 \
        libpango-1.0-0 \
        libcairo2 \
        libasound2t64 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# corepack ile pnpm kur
RUN corepack enable && corepack prepare pnpm@10.26.1 --activate

# puppeteer sistem Chromium'u kullansın
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Workspace konfigürasyonu
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc \
     tsconfig.base.json tsconfig.json ./

# Paket tanımları
COPY lib/db/package.json                             ./lib/db/
COPY lib/api-spec/package.json                       ./lib/api-spec/
COPY lib/api-zod/package.json                        ./lib/api-zod/
COPY lib/api-client-react/package.json               ./lib/api-client-react/
COPY lib/integrations-openai-ai-react/package.json   ./lib/integrations-openai-ai-react/
COPY lib/integrations-openai-ai-server/package.json  ./lib/integrations-openai-ai-server/
COPY artifacts/api-server/package.json               ./artifacts/api-server/
COPY artifacts/bw-salon/package.json                 ./artifacts/bw-salon/
COPY scripts/package.json                            ./scripts/

# Sadece production bağımlılıklarını kur
RUN pnpm install --frozen-lockfile --prod

# Builder'dan derlenmiş dosyaları al
COPY --from=builder /app/artifacts/api-server/dist/  ./artifacts/api-server/dist/
COPY --from=builder /app/artifacts/bw-salon/dist/    ./artifacts/bw-salon/dist/

# WhatsApp oturum verisi için klasör
RUN mkdir -p .wwebjs_auth

ENV PORT=8080
ENV NODE_ENV=production

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + process.env.PORT + '/api/healthz', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "artifacts/api-server/dist/index.mjs"]
