# -------------------------
# Etapa inicial: Construção
# --------------------------
FROM node:22-slim AS build

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Copia os arquivos de dependências (package.json e package-lock.json) para o container
COPY package*.json ./

# Instala as dependências de forma limpa
RUN npm install --quiet --no-fund --loglevel=error

# Copia apenas os arquivos necessários para build e execução
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY prisma ./prisma
COPY src ./src

# Gera os arquivos necessários para o prisma e otimiza o código
RUN npx prisma generate && \
    npm run build && \
    npm prune --production

# ----------------------
# Etapa final: produção
# ----------------------
FROM node:22-slim AS production

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Instala pacotes necessario para o prisma e check health
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Comando para criar usuário
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

# Copia os arquivos necessários da etapa de build
COPY --from=build --chown=appuser:appgroup /app/dist /app/dist
COPY --from=build --chown=appuser:appgroup /app/node_modules /app/node_modules
COPY --from=build --chown=appuser:appgroup /app/prisma /app/prisma

# Define o usuário para executar a aplicação
USER appuser

# Configura o ambiente como produção
ENV NODE_ENV=production

# Expõe a porta do container
EXPOSE 3000

CMD ["node", "dist/main.js"]