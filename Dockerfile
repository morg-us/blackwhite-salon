# ══════════════════════════════════════════════════════════════════════════════
# Stage 1 — Builder: TypeScript derle, frontend ve backend oluştur
# ══════════════════════════════════════════════════════════════════════════════
FROM node:24-slim AS builder

WORKDIR /app

# pnpm kur
RUN npm install -g pnpm@10

# Workspace konfigürasyonu önce kopyala (bağımlılık önbellekleme için)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc \
     tsconfig.base.json tsconfig.json ./

# Lib ve artifact paketlerinin package.json dosyaları
COPY lib/db/package.json            ./lib/db/
COPY lib/api-spec/package.json      ./lib/api-spec/
COPY lib/api-zod/package.json       ./lib/api-zod/
COPY lib/api-client-react/package.json ./lib/api-client-react/
COPY lib/integrations/package.json  ./lib/integrations/
COPY artifacts/api-server/package.json  ./artifacts/api-server/
COPY artifacts/bw-salon/package.json    ./artifacts/bw-salon/
COPY scripts/package.json               ./scripts/

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

# ── APT güvenilirlik ayarları ─────────────────────────────────────────────────
# Acquire::Retries=5  → ağ hatasında 5 kez tekrar dener
# Acquire::http::Timeout=60 → zaman aşımını uzatır (büyük paketler için)
# ─────────────────────────────────────────────────────────────────────────────
RUN printf 'Acquire::Retries "5";\nAcquire::http::Timeout "60";\nAcquire::https::Timeout "60";\n' \
      > /etc/apt/apt.conf.d/99-retrys

# Temel sistem araçları ve CA sertifikaları (küçük, hızlı)
RUN apt-get update -y && \
    apt-get install -y --no-install-recommends ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Chromium ve whatsapp-web.js için gerekli sistem bağımlılıkları
# Not: node:24-slim → Debian bookworm → libasound2 → libasound2t64 olarak yeniden adlandırıldı
RUN apt-get update -y && \
    apt-get install -y --no-install-recommends \
        chromium \
        chromium-sandbox \
        fonts-freefont-ttf \
        fonts-noto-color-emoji \
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

# pnpm kur
RUN npm install -g pnpm@10

# puppeteer sistem Chromium'u kullansın
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Workspace konfigürasyonu
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc \
     tsconfig.base.json tsconfig.json ./

# Paket tanımları (sadece runtime için gerekenler)
COPY lib/db/package.json                ./lib/db/
COPY lib/api-spec/package.json          ./lib/api-spec/
COPY lib/api-zod/package.json           ./lib/api-zod/
COPY lib/api-client-react/package.json  ./lib/api-client-react/
COPY lib/integrations/package.json      ./lib/integrations/
COPY artifacts/api-server/package.json  ./artifacts/api-server/
COPY artifacts/bw-salon/package.json    ./artifacts/bw-salon/
COPY scripts/package.json               ./scripts/

# Sadece production bağımlılıklarını kur
RUN pnpm install --frozen-lockfile --prod

# Builder'dan derlenmiş dosyaları al
COPY --from=builder /app/artifacts/api-server/dist/  ./artifacts/api-server/dist/
COPY --from=builder /app/artifacts/bw-salon/dist/    ./artifacts/bw-salon/dist/

# WhatsApp oturum verisi için klasör oluştur
# (Railway/Koyeb'de kalıcı volume olarak mount edilmeli: /app/.wwebjs_auth)
RUN mkdir -p .wwebjs_auth

# Uygulama portu (Railway/Koyeb PORT env ile override eder)
ENV PORT=8080
ENV NODE_ENV=production

EXPOSE 8080

# Sağlık kontrolü
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + process.env.PORT + '/api/healthz', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "artifacts/api-server/dist/index.mjs"]
