# Carbon Credits Platform - Backend

Sistema backend para plataforma de créditos de carbono desenvolvido em Node.js com Express, PostgreSQL e Sequelize ORM.

## 🌱 Funcionalidades

### MVP (Requisitos Implementados)

- **[00] Validação de Créditos**: Sistema completo de verificação e validação de créditos de carbono
- **[02] Dashboard**: Dashboard personalizado por tipo de usuário (fornecedor, comprador, governo, cidadão)
- **[03] Cálculo de Créditos**: Algoritmo automático para cálculo de créditos de carbono baseado em área e tipo de floresta
- **[07] Empresas Fornecedoras**: Sistema para encontrar e avaliar empresas fornecedoras confiáveis
- **[08] Comprovação de Confiabilidade**: Sistema de reputação e avaliações para fornecedores
- **[12] Cadastro de Áreas**: CRUD completo para gerenciamento de áreas florestais
- **[13] Cálculo para Fornecedores**: Ferramenta para fornecedores calcularem créditos das suas áreas

## 🚀 Tecnologias

- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **PostgreSQL** - Banco de dados relacional
- **Sequelize ORM** - Object-Relational Mapping
- **Docker** - Containerização
- **JWT** - Autenticação
- **bcryptjs** - Hash de senhas
- **Joi** - Validação de dados
- **Helmet** - Segurança HTTP

## 📋 Pré-requisitos

### Opção 1: Docker (Recomendado)
- Docker
- Docker Compose

### Opção 2: Desenvolvimento Local
- Node.js >= 18.0.0
- PostgreSQL >= 13
- npm ou yarn

## 🚀 Instalação Rápida com Docker

```bash
# Clone e entre no diretório
cd carbon-credits-backend

# Execute o setup (instala dependências e configura banco)
npm run setup

# Suba os containers
docker-compose up -d
```

**Pronto!** O backend estará rodando em `http://localhost:3000`

### 🔍 Serviços disponíveis:

- **API Backend**: http://localhost:3000
- **Adminer (DB Admin)**: http://localhost:8080
- **PostgreSQL**: localhost:5432

### 👤 Usuários de teste criados automaticamente:

- **Admin**: admin@carboncredits.com / admin123
- **Fornecedor**: supplier@example.com / supplier123
- **Comprador**: buyer@company.com / buyer123

## 🛠️ Desenvolvimento Local

Se preferir rodar sem Docker:

```bash
# 1. Setup inicial
npm run setup

# 2. Configure PostgreSQL local e ajuste .env se necessário
# DATABASE_URL="postgresql://user:password@localhost:5432/carbon_credits"

# 3. Inicie o servidor
npm run dev
```

## 📚 Comandos Disponíveis

### 🐳 Docker
```bash
npm run docker:up      # Subir containers
npm run docker:down    # Parar containers
npm run docker:build   # Rebuild containers
```

### 🗄️ Database (Sequelize)
```bash
npm run db:create      # Criar banco de dados
npm run db:migrate     # Executar migrações
npm run db:seed        # Popular com dados de exemplo
npm run db:migrate:undo    # Desfazer última migração
npm run db:seed:undo       # Desfazer seeds
npm run db:drop            # Dropar banco (cuidado!)
```

### 🚀 Aplicação
```bash
npm run dev           # Desenvolvimento
npm run start         # Produção
npm run setup         # Setup inicial
npm test              # Testes
```

## 🗂️ Estrutura do Projeto

```
carbon-credits-backend/
├── database/
│   ├── config/
│   │   └── config.js          # Configuração do Sequelize
│   ├── migrations/            # Migrações do banco
│   ├── models/                # Modelos Sequelize
│   └── seeders/               # Seeds de dados iniciais
├── src/
│   ├── controllers/           # Controladores das rotas
│   ├── middleware/            # Middlewares
│   ├── models/                # Exportação dos modelos
│   ├── routes/                # Rotas da API
│   ├── services/              # Serviços de negócio
│   └── server.js              # Servidor principal
├── config/
│   ├── database.js            # Configuração da conexão
│   └── sequelize.config.js    # Config específica do Sequelize
├── scripts/
│   └── setup.js               # Script de setup
├── docker-compose.yml         # Configuração Docker
├── Dockerfile                 # Imagem Docker
├── .sequelizerc              # Configuração do Sequelize CLI
└── README.md
```

## 📡 API Endpoints

### 🔐 Autenticação
```
POST /api/auth/register        # Cadastro de usuário
POST /api/auth/login          # Login
GET  /api/auth/profile        # Perfil do usuário
PUT  /api/auth/profile        # Atualizar perfil
```

### 🏞️ Áreas
```
GET  /api/areas               # Listar áreas (público)
POST /api/areas               # Cadastrar área (fornecedor)
GET  /api/areas/my-areas      # Minhas áreas (fornecedor)
GET  /api/areas/:id           # Detalhes da área
PUT  /api/areas/:id           # Atualizar área
POST /api/areas/:id/calculate-credits  # Calcular créditos
```

### 💳 Créditos de Carbono
```
GET  /api/carbon-credits                    # Listar créditos
POST /api/carbon-credits                    # Criar crédito (fornecedor)
GET  /api/carbon-credits/my-credits         # Meus créditos
POST /api/carbon-credits/:id/reserve        # Reservar (comprador)
POST /api/carbon-credits/:id/complete-purchase  # Finalizar compra
```

### 🏢 Empresas
```
GET  /api/companies                    # Listar empresas
GET  /api/companies/trusted-suppliers  # Fornecedores confiáveis
POST /api/companies                    # Cadastrar empresa
GET  /api/companies/:id                # Detalhes da empresa
POST /api/companies/:id/review         # Avaliar empresa
```

### 📊 Dashboard
```
GET /api/dashboard           # Dashboard do usuário
GET /api/dashboard/area/:id  # Dashboard da área
```

### ✅ Verificação
```
GET  /api/verification/credit/:id/status      # Status de verificação
GET  /api/verification/credit/:id/certificate # Certificado
POST /api/verification/credit/:id/validate    # Validar (governo)
GET  /api/verification/pending                # Pendentes (governo)
```

## 🔒 Tipos de Usuário

- **🌳 SUPPLIER**: Gerencia áreas, cria e vende créditos
- **💼 BUYER**: Compra créditos, acompanha compensações
- **🏛️ GOVERNMENT**: Verifica créditos, monitora plataforma
- **👤 CITIZEN**: Visualiza informações públicas

## 🐘 Banco de Dados (PostgreSQL + Sequelize)

### Esquema Principal:
- **users** - Usuários do sistema
- **areas** - Áreas florestais
- **carbon_credits** - Créditos de carbono
- **companies** - Empresas cadastradas
- **user_reviews** - Avaliações de usuários
- **company_reviews** - Avaliações de empresas

### Relacionamentos:
- 1 User → N Areas
- 1 Area → N CarbonCredits
- 1 User → N Companies (como owner)
- 1 CarbonCredit → 1 Supplier, 1 Buyer

### Sequelize Features:
- ✅ Migrations automáticas
- ✅ Seeds com dados de exemplo
- ✅ Modelos com validações
- ✅ Relacionamentos configurados
- ✅ Hooks e métodos customizados

## 🛡️ Segurança

- ✅ Autenticação JWT
- ✅ Hash de senhas com bcrypt
- ✅ Rate limiting
- ✅ Validação de dados com Joi
- ✅ Headers de segurança com Helmet
- ✅ CORS configurado
- ✅ Logs estruturados
- ✅ Health checks

## 📊 Monitoramento

### Health Check
```bash
curl http://localhost:3000/health
```

### Adminer (Docker)
Acesse http://localhost:8080 com:
- **Server**: postgres
- **User**: postgres
- **Password**: postgres123
- **Database**: carbon_credits

### Logs do Sequelize
Em desenvolvimento, veja todas as queries SQL no console.

## 🧪 Testes

```bash
npm test              # Executar testes
npm run test:watch    # Modo watch
npm run test:coverage # Coverage report
```

## 🚀 Deploy

### Docker Production
```bash
# Build para produção
docker-compose -f docker-compose.prod.yml up -d

# Ou com variáveis personalizadas
NODE_ENV=production \
DATABASE_URL="postgresql://user:pass@host:5432/db" \
JWT_SECRET="production-secret" \
docker-compose up -d
```

### Variáveis de Ambiente Necessárias
```env
NODE_ENV=production
DATABASE_URL=postgresql://...
JWT_SECRET=secure-secret-key
PORT=3000

# Para Sequelize
POSTGRES_DB=carbon_credits
POSTGRES_USER=postgres
POSTGRES_PASSWORD=secure-password
POSTGRES_HOST=localhost
```

## 🔄 Migrações

### Comandos Úteis:
```bash
# Criar nova migração
npx sequelize-cli migration:generate --name add-new-field

# Ver status das migrações
npx sequelize-cli db:migrate:status

# Rollback da última migração
npm run db:migrate:undo

# Rollback até uma migração específica
npx sequelize-cli db:migrate:undo:all --to XXXXXXXXXXXXXX-some-migration.js
```

### Seeds:
```bash
# Criar novo seed
npx sequelize-cli seed:generate --name demo-data

# Rodar seeds específicos
npx sequelize-cli db:seed --seed XXXXXXXXXXXXXX-some-seed.js

# Desfazer seeds
npm run db:seed:undo
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/nova-feature`
3. Commit: `git commit -m 'Adiciona nova feature'`
4. Push: `git push origin feature/nova-feature`
5. Abra um Pull Request

## 📞 Suporte

- 📧 Email: support@carboncredits.com
- 🐛 Issues: Abra uma issue no repositório
- 📖 Docs: Este README e código comentado

---

Desenvolvido com 🌱 para um futuro mais sustentável

## 🆕 Changelog - Sequelize Migration

### ✅ O que mudou do Prisma para Sequelize:

- **ORM**: Prisma → Sequelize
- **Configuração**: schema.prisma → modelos JS + migrations
- **CLI**: `prisma` → `sequelize-cli`
- **Migrations**: Automáticas → Manuais (mais controle)
- **Seeds**: Script único → Arquivos organizados
- **Queries**: `prisma.model.find()` → `Model.findAll()`

### 🎯 Vantagens do Sequelize:

- ✅ Migrations mais granulares e controláveis
- ✅ Melhor integração com PostgreSQL
- ✅ Hooks e validações mais flexíveis
- ✅ ORM mais maduro e estável
- ✅ Debugging mais fácil
- ✅ Comunidade maior e documentação extensa