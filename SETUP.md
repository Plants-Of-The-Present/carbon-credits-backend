# 🌱 Carbon Credits Backend - Guia de Instalação

Este guia contém instruções completas para configurar e executar o projeto Carbon Credits Backend em qualquer sistema operacional (Linux, macOS ou Windows).

## 📋 Pré-requisitos

### 1. Node.js (Versão 16 ou superior)

#### **Windows:**
1. Acesse https://nodejs.org/
2. Baixe a versão LTS (recomendada)
3. Execute o instalador `.msi` baixado
4. Siga as instruções do instalador
5. Reinicie o terminal/prompt de comando

#### **macOS:**
```bash
# Opção 1: Download direto
# Acesse https://nodejs.org/ e baixe a versão LTS

# Opção 2: Usando Homebrew (recomendado)
brew install node

# Opção 3: Usando MacPorts
sudo port install nodejs18
```

#### **Linux (Ubuntu/Debian):**
```bash
# Atualizar repositórios
sudo apt update

# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalação
node --version
npm --version
```

#### **Linux (CentOS/RHEL/Fedora):**
```bash
# Para CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs npm

# Para Fedora
sudo dnf install nodejs npm
```

### 2. Docker Desktop

#### **Windows:**
1. Acesse https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe
2. Baixe e execute o instalador
3. Siga as instruções do instalador
4. Reinicie o computador quando solicitado
5. Abra o Docker Desktop e aguarde a inicialização

#### **macOS:**
```bash
# Opção 1: Download direto
# Acesse https://desktop.docker.com/mac/main/amd64/Docker.dmg (Intel)
# Ou https://desktop.docker.com/mac/main/arm64/Docker.dmg (Apple Silicon)

# Opção 2: Usando Homebrew
brew install --cask docker
```

#### **Linux (Ubuntu/Debian):**
```bash
# Remover versões antigas
sudo apt-get remove docker docker-engine docker.io containerd runc

# Instalar dependências
sudo apt-get update
sudo apt-get install \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Adicionar chave GPG do Docker
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Adicionar repositório
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker Engine
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER

# Reiniciar para aplicar mudanças
sudo systemctl restart docker
newgrp docker
```

### 3. Git

#### **Windows:**
1. Acesse https://git-scm.com/download/win
2. Baixe e execute o instalador
3. Siga as configurações padrão do instalador

#### **macOS:**
```bash
# Opção 1: Usando Homebrew
brew install git

# Opção 2: Usando Xcode Command Line Tools
xcode-select --install
```

#### **Linux:**
```bash
# Ubuntu/Debian
sudo apt install git

# CentOS/RHEL
sudo yum install git

# Fedora
sudo dnf install git
```

## 🚀 Instalação do Projeto

### 1. Clonar o Repositório
```bash
git clone [URL_DO_SEU_REPOSITORIO]
cd carbon-credits-backend
```

### 2. Verificar Pré-requisitos
Execute os comandos abaixo para verificar se tudo está instalado corretamente:

```bash
# Verificar Node.js (deve mostrar versão 16 ou superior)
node --version

# Verificar npm
npm --version

# Verificar Docker
docker --version

# Verificar Git
git --version
```

### 3. Configurar Variáveis de Ambiente
O arquivo `.env` já está configurado corretamente. Verifique se ele existe:

```bash
# Verificar se arquivo .env existe
ls -la .env

# Se não existir, copie do exemplo:
cp .env.example .env
```

### 4. Inicializar Docker
Certifique-se de que o Docker Desktop está rodando:

#### **Windows/macOS:**
- Abra o Docker Desktop
- Aguarde até ver "Docker Desktop is running" na bandeja do sistema

#### **Linux:**
```bash
# Iniciar serviço Docker
sudo systemctl start docker

# Verificar se está rodando
sudo systemctl status docker
```

## ▶️ Executando o Projeto

### 1. Subir os Containers Docker
```bash
npm run docker:up
```

Este comando irá:
- Criar e iniciar o container PostgreSQL na porta 5432
- Criar e iniciar o container da aplicação na porta 3000
- Criar e iniciar o Adminer (interface web do banco) na porta 8080

### 2. Configurar o Banco de Dados
```bash
# Instalar dependências
npm install

# Executar migrações para criar as tabelas
npm run db:migrate
```

**Nota**: O sistema atual não possui seeds automáticos. Os usuários devem ser criados através:
- Frontend em `http://localhost:3001/cadastro`
- Ou via API diretamente (veja exemplos no README.md)

### 3. Verificar se Está Funcionando

Acesse os seguintes endereços no seu navegador:

- **API Backend**: http://localhost:3000
- **Frontend React**: http://localhost:3001 (se configurado)
- **Adminer (Interface do Banco)**: http://localhost:8080

Para acessar o Adminer:
- **Sistema**: PostgreSQL
- **Servidor**: postgres
- **Usuário**: postgres
- **Senha**: postgres123
- **Base de dados**: carbon_credits

## 🛠️ Comandos Úteis

### Gerenciamento Docker
```bash
# Subir containers
npm run docker:up

# Parar containers
npm run docker:down

# Ver logs dos containers
docker logs carbon-credits-backend
docker logs carbon-credits-postgres

# Ver containers rodando
docker ps
```

### Desenvolvimento
```bash
# Instalar dependências
npm install

# Executar migrações do banco
npm run db:migrate

# Executar seeds (dados de exemplo)
npm run db:seed

# Executar aplicação em modo desenvolvimento (sem Docker)
npm run dev

# Executar testes
npm test

# Verificar código (linting)
npm run lint

# Corrigir problemas de linting automaticamente
npm run lint:fix
```

### Banco de Dados
```bash
# Criar banco de dados
npm run db:create

# Executar migrações
npm run db:migrate

# Reverter última migração
npm run db:migrate:undo

# Executar seeds
npm run db:seed

# Reverter seeds
npm run db:seed:undo

# Resetar banco completamente
npm run db:drop
npm run db:create
npm run db:migrate
npm run db:seed
```

## 📊 Estrutura do Projeto

```
carbon-credits-backend/
├── config/                 # Configurações do banco de dados
│   └── database.js        # Conexão com PostgreSQL
├── database/              # Migrations, models e seeders (Sequelize)
│   ├── config/           # Configuração do Sequelize
│   │   └── config.js     # Config para PostgreSQL
│   ├── migrations/       # Scripts de criação/alteração do banco
│   │   └── 001-create-users-areas.js  # Migração principal
│   ├── models/          # Modelos do banco de dados
│   │   ├── User.js      # Modelo de usuário (implementado)
│   │   ├── Area.js      # Modelo de área (preparado)
│   │   └── index.js     # Exportação dos modelos
│   └── seeders/         # Dados de exemplo (opcional)
├── src/                  # Código fonte da aplicação
│   ├── controllers/     # Controladores das rotas
│   │   └── authController.js  # Auth, login, cadastro
│   ├── middleware/      # Middlewares
│   │   ├── auth.js      # Middleware de autenticação JWT
│   │   └── validation.js # Validação de dados (Joi)
│   ├── routes/          # Rotas da API
│   │   ├── auth.js      # Rotas de autenticação
│   │   └── areas.js     # Rotas de áreas (preparado)
│   ├── services/        # Serviços de negócio
│   └── server.js        # Servidor principal
├── Front-end/           # Frontend React (integrado)
│   └── sftf_front/      # Aplicação React + TypeScript
├── docker-compose.yml   # PostgreSQL, Adminer, App
├── package.json        # Dependências Node.js
├── .env               # Variáveis de ambiente
├── README.md          # Documentação principal
└── SETUP.md           # Este guia de instalação
```

## 🔧 Solução de Problemas

### Erro de Porta em Uso
Se receber erro de porta já em uso:

```bash
# Verificar qual processo está usando a porta
# Windows
netstat -ano | findstr :3000

# macOS/Linux
lsof -i :3000

# Parar processo ou usar porta diferente no .env
```

### Erro de Permissão Docker (Linux)
```bash
# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER

# Reiniciar sessão ou executar
newgrp docker
```

### Erro de Conexão com Banco
```bash
# Verificar se PostgreSQL está rodando
docker ps | grep postgres

# Se não estiver, reiniciar containers
npm run docker:down
npm run docker:up
```

### Erro de Memória Docker
```bash
# Aumentar memória disponível para Docker Desktop
# Windows/macOS: Docker Desktop → Settings → Resources → Memory
# Aumentar para pelo menos 4GB

# Linux: Verificar espaço em disco
df -h
docker system prune  # Limpar containers/imagens não utilizados
```

### Reset Completo do Ambiente
Se algo der errado, você pode resetar tudo:

```bash
# Parar e remover todos os containers
npm run docker:down

# Remover volumes (dados do banco)
docker volume rm carbon-credits-backend_postgres_data

# Remover imagens (opcional)
docker rmi carbon-credits-backend-app postgres:15-alpine adminer:latest

# Subir tudo novamente
npm run docker:up
npm run setup
```

## 📚 Próximos Passos

1. **Teste a integração**: Acesse o frontend em `http://localhost:3001` e teste login/cadastro
2. **Explore a API**: Use ferramentas como Postman ou curl para testar os endpoints
3. **Consulte o banco**: Use o Adminer para visualizar usuários cadastrados
4. **Leia a documentação**: Confira o README.md e `INTEGRACAO_LOGIN_CADASTRO.md`
5. **Desenvolva**: Implemente novas funcionalidades como áreas e créditos de carbono

### 🔐 Funcionalidades Implementadas
- ✅ Sistema de autenticação JWT
- ✅ Cadastro e login de usuários
- ✅ Validações de CNPJ e dados corporativos
- ✅ Integração frontend-backend completa
- ✅ Tratamento de erros e UX

## 🆘 Precisa de Ajuda?

- Verifique os logs: `docker logs carbon-credits-backend`
- Consulte a documentação do Docker: https://docs.docker.com/
- Consulte a documentação do Node.js: https://nodejs.org/docs/

---

🌱 **Bem-vindo ao Carbon Credits Backend!**

Se você seguiu todos os passos acima, seu ambiente de desenvolvimento está pronto. Boa codificação!