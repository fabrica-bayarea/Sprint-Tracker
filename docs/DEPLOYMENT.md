# Sprint-Tracker — Guia de Deploy

Documento para equipe de DevOps responsável pela infraestrutura em AWS. Cobre arquitetura, containers, variáveis de ambiente, banco de dados, recomendações específicas pra AWS e checklist de primeiro deploy.

> **Resumo executivo:** aplicação web de gerenciamento de sprints (kanban + ciclo scrum). Tudo containerizado em **3 imagens de aplicação** (back NestJS, front Next.js, reverse proxy nginx) + **1 banco PostgreSQL gerenciado**. Migrações aplicam automaticamente no start do container do back.

---

## 1. Visão geral

| Camada | Tecnologia | Versão | Imagem base |
|---|---|---|---|
| **Frontend** | Next.js (App Router, modo standalone) + React + TypeScript | Next 16 / React 19 | `node:22-slim` |
| **Backend** | NestJS + Prisma ORM + TypeScript | Nest 11 | `node:22-slim` |
| **Banco** | PostgreSQL | 16 | `postgres:16-alpine` (dev) — em prod usar **RDS** |
| **Reverse Proxy** | Nginx | mainline | `nginx:alpine` (sugestão) |

**Comunicação real-time:** Socket.IO (`@nestjs/platform-socket.io`). O nginx já está configurado para `Upgrade: websocket` (e bloqueia H2C smuggling).

**Autenticação:** JWT em cookie HTTPOnly + Passport.js. OAuth (Google/Microsoft) e LDAP são opcionais via feature flags.

---

## 2. Arquitetura de containers

```
                                ┌─────────────────┐
                                │   ALB (HTTPS)   │
                                │  + ACM cert     │
                                └────────┬────────┘
                                         │ :80
                                ┌────────▼────────┐
                                │   nginx (80)    │  ← reverse proxy
                                │  - /api/* → api │     (configurável)
                                │  - /* → webui   │
                                └────┬──────┬─────┘
                                     │      │
                       :3000 (HTTP)  │      │  :3000 (HTTP)
                              ┌──────▼─┐  ┌─▼──────┐
                              │   api  │  │ webui  │
                              │ (Nest) │  │ (Next) │
                              └────┬───┘  └────────┘
                                   │
                                   │ :5432 (TCP)
                              ┌────▼──────┐
                              │ PostgreSQL│  ← RDS em prod
                              │  16       │
                              └───────────┘
```

### Dependências entre serviços

- `api` depende de `postgres` (healthy)
- `webui` chama `api` server-to-server (SSR/server actions)
- `nginx` é o único exposto externamente

### Service discovery interno

Em dev (compose) os containers se acham por **service name**:

| Origem | Destino | Hostname interno |
|---|---|---|
| api | postgres | `postgres:5432` |
| webui | api | `back:3000` (dev) ou `api:3000` (prod) |
| nginx | api | `sprinttacker-api:3000` ← **importante: nome esperado pelo nginx.conf** |
| nginx | webui | `sprinttacker-webui:3000` ← **importante: nome esperado pelo nginx.conf** |

> ⚠️ O `nginx/nginx.conf` no repo espera os upstreams nomeados `sprinttacker-api` e `sprinttacker-webui`. Em ECS isso vira o **service name** (Service Discovery do Cloud Map). Alternativa: editar o nginx.conf pra usar os nomes que você definir.

---

## 3. Imagens Docker

### 3.1 Backend (`back-end/Dockerfile`)

- Multi-stage (`build` → `production`)
- Node 22 slim como base
- Build: instala deps, gera Prisma Client, compila TS para `dist/`, prune dev deps
- Runtime: usuário não-root (`appuser`), porta `3000`
- Entrypoint: `start.sh` que roda `npx prisma migrate deploy && node dist/src/main.js`

```bash
docker build -t sprint-tracker/back:latest ./back-end
```

### 3.2 Frontend (`front-end/Dockerfile`)

- Multi-stage (`build` → `production`)
- Next.js modo **standalone** (`.next/standalone` autosuficiente)
- Usuário não-root, porta `3000`
- Entrypoint: `node server.js`

```bash
docker build -t sprint-tracker/front:latest ./front-end
```

### 3.3 Nginx

Não há Dockerfile dedicado — usa `nginx:alpine` direto montando o `nginx/nginx.conf`:

```yaml
nginx:
  image: nginx:alpine
  volumes:
    - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
  ports:
    - "80:80"
```

---

## 4. Variáveis de ambiente

### 4.1 Backend (`api`) — obrigatórias em produção

| Variável | Exemplo | Notas |
|---|---|---|
| `NODE_ENV` | `production` | |
| `PORT` | `3000` | Porta interna |
| `DATABASE_URL` | `postgresql://USER:PASS@rds-endpoint:5432/sprint_tracker?schema=public` | RDS connection string |
| `JWT_SECRET` | (gerar 32+ bytes random) | Crítico — secret pra assinar tokens |
| `JWT_RESET_SECRET` | (gerar 32+ bytes random) | Secret pro fluxo de reset de senha |
| `BASE_URL` | `https://sprinttracker.iesb.br` | URL pública (usado em emails) |
| `BASE_URL_UI` | `https://sprinttracker.iesb.br` | URL do front-end |
| `BASE_URL_API` | `https://sprinttracker.iesb.br/api` | URL do back (atrás do nginx) |
| `EMAIL` | `noreply@iesb.br` | SMTP user (SES?) |
| `PASS` | (secret) | SMTP password |

### 4.2 Backend — opcionais (feature flags)

| Variável | Default | Notas |
|---|---|---|
| `ENABLE_GOOGLE_OAUTH` | `false` | Se `true`, exige `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` |
| `ENABLE_MICROSOFT_OAUTH` | `false` | Se `true`, exige `MICROSOFT_CLIENT_ID` e `MICROSOFT_CLIENT_SECRET` |
| `ENABLE_LDAP_OAUTH` | `false` | Se `true`, exige todas as `LDAP_*` |
| `LDAP_URL` | — | `ldap://host:389` |
| `LDAP_ADMIN_DN` | — | |
| `LDAP_ADMIN_PASSWORD` | — | |
| `LDAP_USER_BASE_DN` | — | |
| `DEBUG` | `false` | Habilita logs verbosos |

> ⚠️ O módulo de LDAP usa `getOrThrow` no constructor mesmo quando `ENABLE_LDAP_OAUTH=false`. Em prod, ou habilite e configure direito, **ou** deixe valores placeholder não-vazios. Em dev usamos `ldap://disabled`.

### 4.3 Frontend (`webui`)

| Variável | Exemplo | Notas |
|---|---|---|
| `NODE_ENV` | `production` | |
| `BASE_URL_API` | `http://api:3000` (intra-rede) ou `https://sprinttracker.iesb.br/api` | Usado por server actions do Next |
| `BASE_URL_WS` | `http://api:3000` ou `wss://sprinttracker.iesb.br` | WebSocket endpoint |

---

## 5. Portas

| Container | Porta interna | Exposição |
|---|---|---|
| `postgres` | 5432 | Apenas dentro da VPC (não exponha publicamente) |
| `api` (back) | 3000 | Apenas para nginx e webui |
| `webui` (front) | 3000 | Apenas para nginx |
| `nginx` | 80 | Atrás do ALB (HTTPS terminado no ALB) |

---

## 6. Volumes e persistência

| Volume | Conteúdo | Persistência necessária? |
|---|---|---|
| `postgres-data` | Dados do PostgreSQL | **Sim** (em prod = RDS storage, automático) |
| `back-node-modules` | node_modules do back | Não (rebuild da imagem) |
| `front-node-modules` | node_modules do front | Não (rebuild da imagem) |
| `front-next` | Cache de build do Next em dev | Não (irrelevante em prod) |

**Imagens de produção são stateless.** A única persistência necessária é o banco de dados.

---

## 7. Health checks

| Serviço | Endpoint | Método | Resposta esperada |
|---|---|---|---|
| `api` (back) | `/health-check` | GET | 200 OK |
| `webui` (front) | `/` ou qualquer rota | GET | 200/307 (Next responde com redirect pro login se não-autenticado) |
| `postgres` | `pg_isready -U postgres -d sprint_tracker` | CLI | exit 0 |

Configuração sugerida no ALB Target Group:
- **api**: `HTTP:3000/health-check`, intervalo 30s, threshold 2/3
- **webui**: `HTTP:3000/`, intervalo 30s, aceitar 200,307

---

## 8. Banco de dados e migrations

- **Engine:** PostgreSQL 16 (recomendado para RDS)
- **Tamanho inicial:** baixíssimo (< 100MB). Cresce com tasks/comments/logs — projetar pra ~5GB no primeiro ano.
- **Backups:** habilitar snapshot diário no RDS (retention 7-30 dias)
- **Conexão:** o back usa connection pool nativo do Prisma (default 10 conns). Multiplicar pelo número de tasks ECS — não esquecer de ajustar `max_connections` se rodar muitas réplicas.

### Migrations

**Aplicação automática no startup.** O entrypoint `start.sh` do back roda `npx prisma migrate deploy` antes de subir a aplicação. Idempotente — se tudo já estiver aplicado, é no-op.

```sh
# start.sh do back
npx prisma migrate deploy
exec node dist/src/main.js
```

**Implicação operacional:** primeira task ECS a iniciar aplica as migrations. Se você tiver >1 task subindo simultaneamente no primeiro deploy, podem racear — o Prisma trata isso via lock no banco, mas o ideal é **fazer o primeiro deploy com 1 task só** e depois escalar.

### Schema

22 migrations atualmente (`back-end/prisma/migrations/`). Modelo de dados principal:

```
User ─┬─< BoardMember >─ Board ─┬─< List ─< Task ─┬─< TaskComment
      │                          │                 └─< TaskLabel >─ Label
      │                          └─< Sprint ─< Task (FK sprintId)
      │                          └─< Invite
      │                          └─< Notification
      └─< TaskLog (audit)
```

---

## 9. Reverse proxy (nginx)

Config em `nginx/nginx.conf`. Características:

- **Roteamento:** `/api/*` → backend, `/` → frontend
- **WebSocket:** allowlist apenas `Upgrade: websocket` (bloqueia H2C smuggling)
- **Hardening:** `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `server_tokens off`
- **Bloqueio:** nega acesso a `.env`, `.log`, `.bak`, `.sql`
- **Gzip:** habilitado para text/css/json/js/xml

**Em AWS:**
- Terminar TLS no ALB (não no nginx) — ALB recebe HTTPS, nginx recebe HTTP
- ACM cert no ALB
- Logs do nginx vão pra `stdout/stderr` → CloudWatch via driver awslogs
- Headers `X-Forwarded-*` já são setados pelo nginx, ALB também adiciona — verificar duplicação

---

## 10. Recomendações específicas para AWS

### Setup mínimo recomendado

| Componente | Serviço AWS | Notas |
|---|---|---|
| Registro de imagens | **ECR** | 3 repos: `sprint-tracker-api`, `sprint-tracker-webui`, opcional `sprint-tracker-nginx` |
| Orquestração | **ECS Fargate** | Mais simples que EKS. Cluster com 3 services (api, webui, nginx) |
| Banco | **RDS PostgreSQL 16** | `db.t4g.micro` é suficiente pra começar |
| Ingress | **ALB** + **ACM** | HTTPS, target groups apontando pro nginx |
| Secrets | **Secrets Manager** ou **SSM Parameter Store** | `JWT_SECRET`, `DATABASE_URL`, OAuth secrets |
| Logs | **CloudWatch Logs** | Driver `awslogs` em cada task definition |
| DNS | **Route 53** | A/AAAA pra ALB |
| Service discovery | **AWS Cloud Map** | Pra nginx achar `api` e `webui` por DNS interno |
| CDN (opcional) | **CloudFront** | Cache de assets estáticos do Next |

### Sugestão de task definitions

```
1. api-task     (sprint-tracker-api:latest)  — 0.5 vCPU / 1 GB
2. webui-task   (sprint-tracker-webui:latest) — 0.5 vCPU / 1 GB
3. nginx-task   (nginx:alpine + config)       — 0.25 vCPU / 0.5 GB
```

Em **Service Discovery (Cloud Map)**, registrar:
- `sprinttacker-api` → api-task IPs
- `sprinttacker-webui` → webui-task IPs

Assim o nginx.conf funciona sem modificação.

### Segurança

- Security Group do RDS: aceita conexões **apenas** do SG das tasks ECS (não exponha 5432 publicamente)
- Security Group do nginx: aceita 80 **apenas** do SG do ALB
- ALB: HTTPS-only (redireciona HTTP→HTTPS), TLS 1.2+
- Cookies de sessão são HTTPOnly + Secure + SameSite=Lax (configurado no back)
- CORS configurado no back via env (`BASE_URL_UI`)

---

## 11. CI/CD recomendado

O repo já tem **GitHub Actions** rodando pipeline de segurança em PRs (`.github/workflows/security.yml`):
- CodeQL (matrix JS/TS)
- SonarQube
- Semgrep
- Gitleaks
- Trivy filesystem scan
- Prisma schema validate
- SBOM CycloneDX
- Dependency Review

**Para deploy contínuo**, sugestão:
1. Push em `main` → action que faz `docker build` das 3 imagens
2. Tag por SHA do commit + `latest`
3. Push pro ECR (`aws-actions/configure-aws-credentials` + `amazon-ecr-login`)
4. Update task definitions + force new deployment via `aws ecs update-service`

Posso preparar esse workflow se for útil.

---

## 12. Checklist de primeiro deploy

- [ ] Criar 3 repos ECR (`api`, `webui`, opcional `nginx`)
- [ ] Build & push das imagens de produção
- [ ] Criar RDS PostgreSQL 16 + Secret Manager com DATABASE_URL
- [ ] Gerar secrets JWT (`openssl rand -hex 32`) e guardar no Secrets Manager
- [ ] Criar VPC com subnets privadas (api/webui/postgres) + públicas (ALB)
- [ ] Criar ECS cluster Fargate
- [ ] Definir 3 task definitions com env vars vindas do Secrets Manager
- [ ] Configurar Cloud Map com nomes `sprinttacker-api` e `sprinttacker-webui`
- [ ] Criar ALB + Target Group apontando pro nginx + ACM cert
- [ ] Subir os 3 services (1 task de cada inicialmente)
- [ ] Verificar `https://<dominio>/api/health-check` retorna 200
- [ ] Verificar `https://<dominio>/` carrega a tela de login
- [ ] Criar primeiro usuário via tela de registro
- [ ] Escalar tasks conforme demanda

---

## 13. Logs e observabilidade

**Logs estruturados:** o NestJS imprime JSON estruturado em produção via logger nativo. Capturado pelo driver `awslogs` do ECS.

**Métricas recomendadas (CloudWatch):**
- Tasks em execução / desejadas por service
- CPU/Memory utilization (target tracking pra autoscaling)
- Request count + latency no ALB target group
- RDS: CPU, conexões, IOPS, free storage

**Alarmes sugeridos:**
- 5xx rate > 1% em 5min (ALB)
- DB CPU > 80% sustained 10min
- DB connections > 80% do max
- Tasks com `STOPPED` reason != normal

---

## 14. Dúvidas comuns

**P: Posso rodar o postgres como container em ECS Fargate em vez de RDS?**
R: Tecnicamente sim, mas Fargate não suporta volumes EBS persistentes nativos. Você precisaria EFS (mais lento) e perde backup automático, multi-AZ, snapshots fáceis. **Recomendado: RDS.**

**P: O front é SSR (renderiza no servidor) ou estático?**
R: SSR com algumas server actions. Não é static export — **precisa rodar Node em runtime**. Não vai pra S3+CloudFront sozinho.

**P: Migrations falham se eu rodar 2 tasks simultaneamente no primeiro deploy?**
R: Prisma usa lock no banco (`_prisma_migrations` table) então não corrompe. Mas pode dar timeout em uma das tasks. Primeiro deploy: 1 task → escalar depois.

**P: Como faço backup do banco?**
R: Snapshot diário automatizado do RDS (configurável no console). Para restore point-in-time, ative `backup-retention-period` >= 7.

**P: O sistema usa Redis ou outro cache?**
R: Não. Só Postgres. Caching de query é via TanStack Query no front (in-memory).

---

## 15. Contato

- **Repo:** https://github.com/fabrica-bayarea/sprint-tracker
- **Equipe (dev/produto):** Fábrica Bay Area
- **Documentação extra:**
  - `README.md` (raiz) — overview
  - `DOCKER.md` (raiz) — stack de desenvolvimento local
  - `CONTRIBUTING.md` — fluxo de PRs
