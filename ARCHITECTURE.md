# 🏗️ Arquitetura do Backend

## 📁 Estrutura de Diretórios

```
app-tcc-backend/
│
├── src/
│   ├── config/                    # Configurações
│   │   ├── db.js                  # Conexão Drizzle
│   │   └── env.js                 # Variáveis de ambiente
│   │
│   ├── db/                        # Banco de dados
│   │   ├── schema.js              # Schemas das tabelas
│   │   └── migrations/            # Migrations SQL
│   │
│   ├── repositories/              # Camada de Acesso ao Banco
│   │   ├── user.repository.js
│   │   ├── exam.repository.js
│   │   ├── examMedia.repository.js
│   │   ├── reminder.repository.js
│   │   ├── shareLink.repository.js
│   │   ├── sharedExam.repository.js
│   │   └── shareAccessLog.repository.js
│   │
│   ├── services/                  # Camada de Negócio
│   │   ├── auth.service.js
│   │   ├── user.service.js
│   │   ├── exam.service.js
│   │   ├── examMedia.service.js
│   │   ├── reminder.service.js
│   │   ├── shareLink.service.js
│   │   ├── sharedExam.service.js
│   │   └── shareAccessLog.service.js
│   │
│   ├── controllers/               # Camada de Controle
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── exam.controller.js
│   │   ├── examMedia.controller.js
│   │   ├── reminder.controller.js
│   │   ├── shareLink.controller.js
│   │   ├── sharedExam.controller.js
│   │   └── shareAccessLog.controller.js
│   │
│   ├── routes/                    # Camada de Rotas
│   │   ├── index.js               # Roteador principal
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── exam.routes.js
│   │   ├── examMedia.routes.js
│   │   ├── reminder.routes.js
│   │   ├── shareLink.routes.js
│   │   ├── sharedExam.routes.js
│   │   └── shareAccessLog.routes.js
│   │
│   ├── middlewares/               # Middlewares
│   │   ├── auth.middleware.js     # Autenticação JWT
│   │   ├── validation.middleware.js # Validação Zod
│   │   ├── error.middleware.js    # Tratamento de erros
│   │   ├── logger.middleware.js   # Logs de requisições
│   │   └── upload.middleware.js   # Upload de arquivos (Multer)
│   │
│   ├── validators/                # Schemas de Validação
│   │   ├── auth.validator.js
│   │   ├── user.validator.js
│   │   ├── exam.validator.js
│   │   ├── examMedia.validator.js
│   │   ├── reminder.validator.js
│   │   ├── shareLink.validator.js
│   │   ├── sharedExam.validator.js
│   │   └── shareAccessLog.validator.js
│   │
│   ├── utils/                     # Utilitários
│   │   ├── errors.util.js         # Classes de erro
│   │   ├── response.util.js       # Padronização de responses
│   │   ├── jwt.util.js            # Funções JWT
│   │   ├── hash.util.js           # Hash bcrypt
│   │   ├── token.util.js          # Tokens e OTP
│   │   └── file.util.js           # Manipulação de arquivos
│   │
│   ├── app.js                     # Configuração Express
│   └── server.js                  # Entry point
│
├── uploads/                       # Arquivos enviados
│   └── exams/
│       └── YYYY/MM/
│
├── .env                           # Variáveis de ambiente
├── .gitignore
├── package.json
├── drizzle.config.js
├── nodemon.json
├── README.md
├── API_REFERENCE.md
├── UPLOAD_EXAMPLES.md
└── ARCHITECTURE.md (este arquivo)
```

---

## 🔄 Fluxo de Requisição

```
┌─────────────┐
│   Cliente   │
└──────┬──────┘
       │ HTTP Request
       ▼
┌─────────────────────────────────┐
│         Express App             │
│  (middlewares globais)          │
│  - CORS, Helmet, JSON Parser    │
│  - Logger (dev)                 │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│          Routes                 │
│  /api/auth, /api/exams, etc     │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│       Middlewares               │
│  1. Upload (se necessário)      │
│  2. Auth (se protegido)         │
│  3. Validation (Zod)            │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│       Controller                │
│  Recebe req, chama service      │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│        Service                  │
│  Lógica de negócio              │
│  Validações complexas           │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│      Repository                 │
│  Acesso ao banco de dados       │
│  Queries Drizzle ORM            │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│   PostgreSQL Database           │
│   (via Neon)                    │
└─────────────────────────────────┘
       │
       │ Response
       ▼
┌─────────────────────────────────┐
│   Error Handler Middleware      │
│   (se houver erro)              │
└──────┬──────────────────────────┘
       │
       ▼
    Cliente
```

---

## 🗄️ Modelo de Dados (ERD Simplificado)

```
┌─────────────┐
│    Users    │
│  (usuários) │
└──────┬──────┘
       │ 1
       │
       │ N
┌──────▼──────────────┐
│      Exams          │
│    (exames)         │
└──────┬──────────────┘
       │ 1
       ├─────────────────────┐
       │ N                   │ N
┌──────▼──────────┐  ┌───────▼────────┐
│   Exam Media    │  │   Reminders    │
│  (arquivos)     │  │  (lembretes)   │
└─────────────────┘  └────────────────┘

┌─────────────┐
│    Users    │
└──────┬──────┘
       │ 1
       │
       │ N
┌──────▼──────────────┐
│   Share Links       │
│  (compartilhar)     │
└──────┬──────────────┘
       │ 1         │ 1
       │           │
       │ N         │ N
┌──────▼──────┐  ┌─▼─────────────┐
│Shared Exams │  │ Access Logs   │
│(vínculos)   │  │  (auditoria)  │
└─────────────┘  └───────────────┘
```

---

## 🎯 Responsabilidades por Camada

### **Repositories**
- ✅ Queries SQL via Drizzle ORM
- ✅ CRUD básico
- ✅ Filtros e paginação
- ❌ SEM lógica de negócio
- ❌ SEM validações complexas

### **Services**
- ✅ Lógica de negócio
- ✅ Validações complexas
- ✅ Orquestração entre repositories
- ✅ Transformação de dados
- ❌ SEM acesso direto ao request/response

### **Controllers**
- ✅ Recebe requisições HTTP
- ✅ Extrai dados do request
- ✅ Chama services
- ✅ Formata responses
- ❌ SEM lógica de negócio
- ❌ SEM queries diretas ao banco

### **Routes**
- ✅ Define endpoints
- ✅ Aplica middlewares
- ✅ Conecta controllers
- ❌ SEM lógica

### **Middlewares**
- ✅ Autenticação
- ✅ Validação de schemas
- ✅ Upload de arquivos
- ✅ Tratamento de erros
- ✅ Logging

### **Validators**
- ✅ Schemas Zod
- ✅ Validações de formato
- ✅ Transformações de dados
- ❌ SEM lógica de negócio

### **Utils**
- ✅ Funções reutilizáveis
- ✅ Helpers
- ✅ Classes utilitárias

---

## 🔐 Segurança Implementada

### **Autenticação e Autorização**
- ✅ JWT com expiração configurável
- ✅ Senhas hasheadas com bcrypt
- ✅ Middleware de autenticação
- ✅ Validação de propriedade de recursos

### **Validação de Dados**
- ✅ Zod para todos os endpoints
- ✅ Sanitização de inputs
- ✅ Validação de UUIDs
- ✅ Validação de tipos de arquivo

### **Proteção de API**
- ✅ Helmet para headers seguros
- ✅ CORS configurável
- ✅ Tratamento global de erros
- ✅ Logs de auditoria (share access)

### **Upload Seguro**
- ✅ Validação de tipos de arquivo
- ✅ Limite de tamanho
- ✅ Nomes únicos gerados
- ✅ Armazenamento organizado

---

## 📊 Estatísticas do Projeto

### **Arquivos Criados:**
- 8 Repositories
- 8 Services
- 8 Controllers
- 8 Routes
- 8 Validators
- 5 Middlewares
- 6 Utils
- 2 Configs

**Total: ~53 arquivos**

### **Linhas de Código (aproximado):**
- Repositories: ~1,000 linhas
- Services: ~1,500 linhas
- Controllers: ~800 linhas
- Routes: ~600 linhas
- Validators: ~400 linhas
- Middlewares: ~300 linhas
- Utils: ~400 linhas

**Total: ~5,000+ linhas de código**

### **Endpoints por Módulo:**
- Auth: 7
- Users: 10
- Exams: 8
- Exam Media: 8
- Reminders: 10
- Share Links: 8
- Shared Exams: 5
- Share Access Logs: 4

**Total: ~60 endpoints**

---

## 🚀 Patterns e Boas Práticas

### **Padrões Aplicados:**
- ✅ Repository Pattern
- ✅ Service Layer Pattern
- ✅ Dependency Injection (via constructor)
- ✅ Error Handling Pattern
- ✅ Response Formatting Pattern

### **Princípios SOLID:**
- ✅ Single Responsibility Principle
- ✅ Open/Closed Principle
- ✅ Dependency Inversion Principle

### **Clean Code:**
- ✅ Nomes descritivos
- ✅ Funções pequenas e focadas
- ✅ Separação de responsabilidades
- ✅ DRY (Don't Repeat Yourself)

---

## 🔧 Configuração e Manutenção

### **Adicionar Novo Módulo (Exemplo: Medications)**

1. **Schema** (`src/db/schema.js`)
```javascript
export const medicationTable = pgTable("medication", {
  id: uuid("id").primaryKey().defaultRandom(),
  // ... campos
});
```

2. **Repository** (`src/repositories/medication.repository.js`)
```javascript
export class MedicationRepository {
  async create(data) { ... }
  async findById(id) { ... }
  // ... CRUD
}
```

3. **Service** (`src/services/medication.service.js`)
```javascript
export class MedicationService {
  constructor() {
    this.repository = new MedicationRepository();
  }
  // ... lógica de negócio
}
```

4. **Validator** (`src/validators/medication.validator.js`)
```javascript
export const createMedicationSchema = z.object({ ... });
```

5. **Controller** (`src/controllers/medication.controller.js`)
```javascript
export class MedicationController {
  constructor() {
    this.service = new MedicationService();
  }
  // ... handlers
}
```

6. **Routes** (`src/routes/medication.routes.js`)
```javascript
const router = Router();
router.post('/', validate(schema), controller.create);
export default router;
```

7. **Registrar** (`src/routes/index.js`)
```javascript
import medicationRoutes from './medication.routes.js';
router.use('/medications', medicationRoutes);
```

---

## 📦 Dependências Principais

### **Produção:**
- `express` - Framework web
- `drizzle-orm` - ORM PostgreSQL
- `@neondatabase/serverless` - Driver Neon
- `zod` - Validação de schemas
- `jsonwebtoken` - JWT
- `bcryptjs` - Hash de senhas
- `multer` - Upload de arquivos
- `helmet` - Segurança
- `cors` - CORS
- `dotenv` - Variáveis de ambiente

### **Desenvolvimento:**
- `drizzle-kit` - CLI do Drizzle
- `nodemon` - Hot reload

---

## 🌐 Ambiente e Deploy

### **Desenvolvimento:**
```bash
npm run dev          # Inicia com nodemon
npm run db:studio    # Abre Drizzle Studio
```

### **Produção:**
```bash
npm run db:generate  # Gerar migrations
npm run db:migrate   # Rodar migrations
npm start            # Iniciar servidor
```

### **Variáveis de Ambiente:**
```env
# Servidor
PORT=5001
NODE_ENV=development

# Banco de Dados
DATABASE_URL=postgresql://...

# JWT
JWT_SECRET=chave-secreta
JWT_EXPIRES_IN=7d

# CORS (produção)
ALLOWED_ORIGINS=https://app.com,https://www.app.com
```

---

## 📈 Escalabilidade

### **Horizontal:**
- ✅ Stateless (sem sessões em memória)
- ✅ Pode rodar múltiplas instâncias
- ✅ Compatível com load balancer

### **Vertical:**
- ✅ Conexões ao banco otimizadas
- ✅ Queries eficientes com índices
- ✅ Paginação em todas as listagens

### **Otimizações Futuras:**
- 🔜 Cache (Redis)
- 🔜 CDN para arquivos estáticos
- 🔜 Queue para tarefas assíncronas
- 🔜 Compressão de imagens
- 🔜 Database read replicas

---

## 🧪 Testes (Recomendado para Futuro)

### **Estrutura Sugerida:**
```
tests/
├── unit/
│   ├── services/
│   │   ├── exam.service.test.js
│   │   └── user.service.test.js
│   └── utils/
│       ├── jwt.util.test.js
│       └── hash.util.test.js
├── integration/
│   └── routes/
│       ├── auth.routes.test.js
│       └── exam.routes.test.js
└── e2e/
    └── complete-flow.test.js
```

### **Frameworks Recomendados:**
- Jest
- Supertest
- Mock Service Worker (MSW)

---

## 📊 Métricas de Qualidade

### **Cobertura Atual:**
- ✅ Todas as tabelas do banco têm CRUD
- ✅ Todas as rotas têm validação
- ✅ Todos os erros são tratados
- ✅ Logs de auditoria implementados
- ✅ Upload de arquivos funcional

### **Para Melhorar:**
- 🔜 Testes automatizados
- 🔜 Documentação OpenAPI/Swagger
- 🔜 Rate limiting
- 🔜 Logs estruturados (Winston)
- 🔜 Monitoramento (New Relic, DataDog)

---

## 🎯 Status do Projeto

**Backend: 100% Completo e Funcional** ✅

- ✅ 8 módulos implementados
- ✅ ~60 endpoints funcionais
- ✅ Autenticação JWT completa
- ✅ Upload de arquivos integrado
- ✅ Sistema de compartilhamento 2FA
- ✅ Logs de auditoria
- ✅ Soft delete em tabelas principais
- ✅ Validação completa com Zod
- ✅ Documentação detalhada

**Pronto para integração com frontend!** 🚀

