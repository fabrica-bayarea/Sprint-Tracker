# Rodando o Sprint Tracker via Docker

Stack de **desenvolvimento** self-contained: Postgres + back NestJS + front Next.js, com hot reload via volumes.

## Pré-requisitos

- Docker Desktop (Mac/Windows) ou Docker Engine (Linux)
- Portas livres: **3000** (back), **3001** (front), **5433** (Postgres exposto pro host)

> Se você já tem `npm run start:dev` (back) ou `npm run dev` (front) rodando nativamente, pare antes de subir o compose, senão dá colisão de porta.

## Subir tudo

```bash
docker compose up --build
```

Primeira vez puxa as imagens, faz `npm install` em cada container e aplica todas as migrations do Prisma. Pode levar de 3 a 8 minutos dependendo da rede. Próximas execuções sobem em segundos.

Em segundo plano (sem prender o terminal):

```bash
docker compose up -d --build
docker compose logs -f back front   # ver logs
```

## Acessar

- **Front:** http://localhost:3001 (Next.js 16)
- **Back:** http://localhost:3000 (Swagger em `/api/docs`)
- **Postgres:** `localhost:5433` (user `postgres` / senha `postgres` / db `sprinttacker`)

A porta exposta do Postgres é `5433` (não 5432) pra não colidir com Postgres local que você possa ter. Dentro do compose os containers acessam via service name (`postgres:5432`).

## Hot reload

Volumes bind em `back-end/src`, `back-end/prisma` e `front-end/` inteiro. Mudar código no host = `nest --watch` e Turbopack recompilam dentro do container automaticamente.

## Parar

```bash
docker compose down            # para os containers, mantém o banco
docker compose down -v         # para + apaga volumes (banco zerado)
```

## Operações comuns

```bash
# Nova migration depois de mexer no schema
docker compose exec back npx prisma migrate dev --name <descricao>

# Inspecionar dados do banco no Prisma Studio
docker compose exec back npx prisma studio
# (abre em http://localhost:5555)

# Resetar o banco do zero (apaga tudo + reaplica migrations)
docker compose exec back npx prisma migrate reset --force

# Entrar no shell do container
docker compose exec back sh
docker compose exec front sh

# Ver só logs de um serviço
docker compose logs -f back
```

## Criar primeiro usuário

O banco sobe vazio. Cria conta normal em http://localhost:3001/auth/register ou via psql/Prisma Studio.

## Notas

- `JWT_SECRET` no compose é hardcoded como placeholder de dev. **Não use em prod** — o Dockerfile multi-stage de produção (`back-end/Dockerfile`) lê de env vars do orquestrador.
- LDAP/Google/Microsoft OAuth estão desligados por padrão. Pra ligar, sobrescreva via `.env` ou edite o compose.
- Mac: bind mounts usam `:delegated` pra performance melhor (escrita do container fica em cache local antes de sincronizar pro host).
- iCloud Drive: o `.dockerignore` já filtra os arquivos `* N.ext` que o iCloud cria. Se aparecer build error sobre `backlog.service 2.ts` ou similar, rode o limpa-iCloud da raiz do projeto.
