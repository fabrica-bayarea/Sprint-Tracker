![Centro Universitário IESB](../assets/logoIesb.png)

## Back-end - NestJS

### Tecnologias
- NestJS
- TypeScript
- Prisma
- Postgres
- Docker

### Rodando localmente

1. Mude para a pasta `back-end`:
  ```bash
  cd back-end
  ```

2. Instale as dependências:
  ```bash
  npm install
  ```

3. Crie um container do Postgres:
  ```bash
  docker run --name database_sprinttracker \
    -e POSTGRES_PASSWORD=password_postgres -e POSTGRES_USER=user_postgres \
    -d -p 5432:5432 postgres
  ```

4. Criar arquivo .env de acordo com o arquivo .env.example que está na pasta "back-end/"
  
> [!IMPORTANT]  
> É crucial que as variaveis de ambiente usada na criação do container seja a mesma no "DATABASE_URL"

5. Aplique as migrações no banco de dados:
  ```bash
  npx prisma migrate dev
  ```

6. Inicie a aplicação:
  ```bash
  npm run start:dev
  ```

7. Acesse [http://localhost:3000/docs](http://localhost:3000/docs) com o seu navegador para ver o resultado.

8. OPCIONAL
  - Criar LDAP Server
  ```bash
  docker run --name meu-openldap --detach -p 389:389 -p 636:636 -e LDAP_DOMAIN="exemplo.com" -e LDAP_ORGANISATION="Minha Empresa S/A" -e LDAP_ADMIN_PASSWORD="sua_senha_segura" osixia/openldap:latest  
  ```

  - Criar o arquivo: **usuario_create.ldif** na raiz do projeto
  ```bash
  dn: uid=55566677788,ou=users,dc=exemplo,dc=com
  objectClass: inetOrgPerson
  objectClass: organizationalPerson
  cn: Usuario Teste LDAP
  sn: LDAP
  uid: 55566677788
  mail: teste.ldap@suaempresa.com
  description: testeuser
  ```

  - Copiar o arquivo **usuario_create.ldif** para dentro do container
  ```bash
  docker cp usuario_create.ldif meu-openldap:/tmp/usuario_create.ldif
  ```

  - Executar a criação do usuário
  ```bash
  docker exec -it meu-openldap ldapadd -x -H ldap://   -D "cn=admin,dc=exemplo,dc=com"   -w sua_senha_segura   -f /tmp/usuario_create.ldif
  ```
