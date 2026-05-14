#!/bin/sh
set -e

echo "▶ Executando migrações do banco..."
npx prisma migrate deploy

echo "▶ Iniciando servidor..."
exec node dist/src/main.js
