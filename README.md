# App TCC Backend

Backend do projeto TCC desenvolvido com Node.js, Express e Drizzle ORM (PostgreSQL).

## 🏗️ Arquitetura

O projeto segue uma arquitetura em camadas:

```
src/
├── config/           # Configurações (DB, env)
├── db/              # Schemas e migrations
├── models/          # Modelos/DTOs
├── repositories/    # Acesso ao banco de dados
├── services/        # Lógica de negócio
├── controllers/     # Controllers (requisições HTTP)
├── routes/          # Definição de rotas
├── middlewares/     # Middlewares (auth, validation, error)
├── validators/      # Schemas de validação (Zod)
├── types/           # TypeScript types globais
├── utils/           # Funções utilitárias
├── app.ts           # Configuração do Express
└── server.ts        # Entry point
```

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Copiar arquivo de ambiente
cp .env.example .env

# Configurar variáveis de ambiente no .env
```

## 🗄️ Banco de Dados

```bash
# Gerar migrations
npm run db:generate

# Executar migrations
npm run db:migrate

# Abrir Drizzle Studio (GUI para visualizar o banco)
npm run db:studio
```

## 🚀 Executar

```bash
# Desenvolvimento (com hot reload)
npm run dev

# Executar em produção
npm start
# ou
npm run start:prod
```

## 🔐 Autenticação

A API usa JWT para autenticação. Adicione o token no header:

```
Authorization: Bearer <token>
```

## 📝 Endpoints da API

### Auth (Autenticação)

#### Registrar novo usuário
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "João Silva",
  "email": "joao@example.com",
  "password": "senha123"
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "name": "João Silva",
      "email": "joao@example.com",
      "createdAt": "2025-01-20T10:00:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "User registered successfully"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "joao@example.com",
  "password": "senha123"
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "name": "João Silva",
      "email": "joao@example.com",
      "createdAt": "2025-01-20T10:00:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Login successful"
}
```

#### Verificar token
```http
POST /api/auth/verify-token
Content-Type: application/json

{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Renovar token (Refresh)
```http
POST /api/auth/refresh-token
Content-Type: application/json

{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Obter usuário logado
```http
GET /api/auth/me
Authorization: Bearer <token>
```

#### Alterar senha
```http
POST /api/auth/change-password
Content-Type: application/json
Authorization: Bearer <token>

{
  "currentPassword": "senha123",
  "newPassword": "novaSenha456"
}
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <token>
```

---

### Users (Usuários)

#### Criar um usuário (público - registro)
```http
POST /api/users
Content-Type: application/json

{
  "name": "João Silva",
  "email": "joao@example.com",
  "password": "senha123"
}
```

#### Obter usuário logado
```http
GET /api/users/me
Authorization: Bearer <token>
```

#### Atualizar usuário logado
```http
PUT /api/users/me
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "João Silva Atualizado",
  "email": "novoemail@example.com",
  "password": "novasenha123"
}
```

#### Listar usuários
```http
GET /api/users?page=1&limit=10&search=joão
Authorization: Bearer <token>
```

#### Obter um usuário
```http
GET /api/users/:id
Authorization: Bearer <token>
```

#### Atualizar um usuário
```http
PUT /api/users/:id
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Nome Atualizado"
}
```

#### Deletar um usuário (soft delete)
```http
DELETE /api/users/:id
Authorization: Bearer <token>
```

#### Deletar permanentemente
```http
DELETE /api/users/:id?hard=true
Authorization: Bearer <token>
```

#### Restaurar usuário deletado
```http
POST /api/users/:id/restore
Authorization: Bearer <token>
```

---

### Exams (Exames)

#### Criar um exame (COM upload de arquivos)
```http
POST /api/exams
Content-Type: multipart/form-data
Authorization: Bearer <token>

Form Data:
- name: "Hemograma Completo"
- examDate: "2025-01-15"
- notes: "Exame de rotina"
- tags: ["sangue", "rotina"]
- files: [arquivo1.pdf, imagem1.jpg, imagem2.png]  # Máximo 10 arquivos, 50MB cada
```

**Tipos de arquivo aceitos:**
- Imagens: JPG, PNG, GIF, WebP
- Documentos: PDF
- Vídeos: MP4, MOV

**Resposta com arquivos:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Hemograma Completo",
    "examDate": "2025-01-15",
    "uploadedFiles": [
      {
        "id": "media-uuid-1",
        "mediaType": "pdf",
        "filePath": "/uploads/exams/2025/01/laudo-123456.pdf",
        "metadata": {
          "originalName": "laudo.pdf",
          "size": 1024000,
          "mimetype": "application/pdf"
        }
      },
      {
        "id": "media-uuid-2",
        "mediaType": "image",
        "filePath": "/uploads/exams/2025/01/resultado-789012.jpg",
        "metadata": {
          "originalName": "resultado.jpg",
          "size": 512000,
          "mimetype": "image/jpeg"
        }
      }
    ]
  },
  "message": "Exam created successfully with 2 file(s)"
}
```

#### Criar um exame SEM arquivos
```http
POST /api/exams
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Hemograma Completo",
  "examDate": "2025-01-15",
  "notes": "Exame de rotina",
  "tags": ["sangue", "rotina"]
}
```

### Listar exames
```http
GET /api/exams?page=1&limit=10&search=hemograma&tags=sangue
Authorization: Bearer <token>
```

### Obter um exame
```http
GET /api/exams/:id
Authorization: Bearer <token>
```

### Atualizar um exame
```http
PUT /api/exams/:id
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Hemograma Completo Atualizado",
  "notes": "Nova nota"
}
```

### Deletar um exame (soft delete)
```http
DELETE /api/exams/:id
Authorization: Bearer <token>
```

### Deletar permanentemente
```http
DELETE /api/exams/:id?hard=true
Authorization: Bearer <token>
```

### Restaurar exame deletado
```http
POST /api/exams/:id/restore
Authorization: Bearer <token>
```

---

### Exam Media (Mídias de Exames)

#### Criar uma mídia vinculada a um exame
```http
POST /api/exam-media
Content-Type: application/json
Authorization: Bearer <token>

{
  "examId": "uuid-do-exame",
  "mediaType": "image",
  "filePath": "/uploads/exames/arquivo.jpg",
  "metadata": {
    "size": 1024000,
    "format": "jpeg",
    "width": 1920,
    "height": 1080
  }
}
```

**Tipos de mídia permitidos:** `image`, `pdf`, `video`, `document`, `other`

#### Obter uma mídia específica
```http
GET /api/exam-media/:id
Authorization: Bearer <token>
```

#### Listar todas as mídias de um exame
```http
GET /api/exam-media/exam/:examId?page=1&limit=50&mediaType=image
Authorization: Bearer <token>
```

#### Contar mídias de um exame
```http
GET /api/exam-media/exam/:examId/count
Authorization: Bearer <token>
```

#### Atualizar uma mídia
```http
PUT /api/exam-media/:id
Content-Type: application/json
Authorization: Bearer <token>

{
  "mediaType": "pdf",
  "metadata": {
    "pages": 5
  }
}
```

#### Deletar uma mídia específica
```http
DELETE /api/exam-media/:id
Authorization: Bearer <token>
```

#### Deletar todas as mídias de um exame
```http
DELETE /api/exam-media/exam/:examId
Authorization: Bearer <token>
```

---

### Reminders (Lembretes)

#### Criar um lembrete para um exame
```http
POST /api/reminders
Content-Type: application/json
Authorization: Bearer <token>

{
  "examId": "uuid-do-exame",
  "title": "Repetir hemograma completo",
  "reminderDate": "2025-06-15T09:00:00Z"
}
```

#### Obter um lembrete específico
```http
GET /api/reminders/:id
Authorization: Bearer <token>
```

#### Listar todos os lembretes do usuário
```http
GET /api/reminders?page=1&limit=50&upcoming=true
Authorization: Bearer <token>
```

**Parâmetros de filtro:**
- `upcoming=true` - Apenas lembretes futuros
- `startDate` - Filtrar a partir de uma data
- `endDate` - Filtrar até uma data

#### Listar lembretes próximos (nos próximos N dias)
```http
GET /api/reminders/upcoming?daysAhead=3
Authorization: Bearer <token>
```

**Útil para notificações:** Retorna lembretes que vencerão nos próximos 3 dias (padrão)

#### Obter estatísticas de lembretes
```http
GET /api/reminders/stats
Authorization: Bearer <token>
```

**Retorna:** Total de lembretes, quantos são futuros e quantos já passaram

#### Listar lembretes de um exame específico
```http
GET /api/reminders/exam/:examId
Authorization: Bearer <token>
```

#### Atualizar um lembrete
```http
PUT /api/reminders/:id
Content-Type: application/json
Authorization: Bearer <token>

{
  "title": "Novo título do lembrete",
  "reminderDate": "2025-07-20T10:00:00Z"
}
```

#### Deletar um lembrete
```http
DELETE /api/reminders/:id
Authorization: Bearer <token>
```

#### Deletar todos os lembretes de um exame
```http
DELETE /api/reminders/exam/:examId
Authorization: Bearer <token>
```

---

### Share Links (Compartilhamento de Exames)

#### Criar link de compartilhamento
```http
POST /api/share-links
Content-Type: application/json
Authorization: Bearer <token>

{
  "contact": "medico@example.com",
  "examIds": ["uuid-exam-1", "uuid-exam-2"],
  "expiresInHours": 168
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "token": "abc123...",
    "contact": "medico@example.com",
    "expiresAt": "2025-01-27T10:00:00Z",
    "isExpired": false,
    "isUsed": false,
    "exams": [...]
  }
}
```

#### Obter um link de compartilhamento
```http
GET /api/share-links/:id
Authorization: Bearer <token>
```

#### Listar links de compartilhamento
```http
GET /api/share-links?page=1&limit=50&active=true
Authorization: Bearer <token>
```

**Filtros:**
- `active=true` - Apenas links ainda válidos (não expirados)

#### Obter estatísticas de compartilhamentos
```http
GET /api/share-links/stats
Authorization: Bearer <token>
```

#### Deletar link de compartilhamento
```http
DELETE /api/share-links/:id
Authorization: Bearer <token>
```

#### Ver logs de acesso de um link
```http
GET /api/share-links/:id/logs?page=1&limit=50
Authorization: Bearer <token>
```

---

### Acesso Público a Links Compartilhados (SEM autenticação)

#### 1. Solicitar acesso (receber OTP por email)
```http
POST /api/share-links/request-access
Content-Type: application/json

{
  "token": "abc123...",
  "contact": "medico@example.com"
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "message": "OTP sent to your contact",
    "expiresIn": 10
  }
}
```

#### 2. Validar OTP e obter acesso aos exames
```http
POST /api/share-links/validate-otp
Content-Type: application/json

{
  "token": "abc123...",
  "contact": "medico@example.com",
  "otp": "123456"
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "message": "Access granted",
    "shareLink": {
      "id": "uuid",
      "exams": [...]
    }
  }
}
```

## 📤 Upload de Arquivos

O sistema suporta upload de arquivos diretamente ao criar exames:

### **Características:**
- ✅ Upload múltiplo (até 10 arquivos por exame)
- ✅ Limite de 50MB por arquivo
- ✅ Tipos aceitos: Imagens (JPG, PNG, GIF, WebP), PDF, Vídeos (MP4, MOV)
- ✅ Armazenamento organizado por ano/mês
- ✅ Nomes únicos gerados automaticamente
- ✅ Metadados salvos automaticamente
- ✅ Registros de `exam_media` criados automaticamente

### **Exemplo com cURL:**
```bash
curl -X POST http://localhost:5001/api/exams \
  -H "Authorization: Bearer <token>" \
  -F "name=Hemograma Completo" \
  -F "examDate=2025-01-20" \
  -F "notes=Exame de rotina" \
  -F "files=@/path/to/laudo.pdf" \
  -F "files=@/path/to/resultado.jpg"
```

### **Estrutura de Diretórios:**
```
uploads/
└── exams/
    └── 2025/
        ├── 01/
        │   ├── laudo-1705747200000-123456789.pdf
        │   └── resultado-1705747200000-987654321.jpg
        └── 02/
            └── ...
```

### **Exemplo com JavaScript/Fetch:**
```javascript
const formData = new FormData();
formData.append('name', 'Hemograma Completo');
formData.append('examDate', '2025-01-20');
formData.append('notes', 'Exame de rotina');
formData.append('tags', JSON.stringify(['sangue', 'rotina']));

// Adicionar múltiplos arquivos
const fileInput = document.getElementById('fileInput');
for (const file of fileInput.files) {
  formData.append('files', file);
}

const response = await fetch('http://localhost:5001/api/exams', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const result = await response.json();
console.log(result);
```

### **Exemplo com HTML Form:**
```html
<form action="http://localhost:5001/api/exams" method="POST" enctype="multipart/form-data">
  <input type="text" name="name" placeholder="Nome do exame" required>
  <input type="date" name="examDate">
  <textarea name="notes" placeholder="Observações"></textarea>
  <input type="file" name="files" multiple accept="image/*,.pdf,video/*">
  <button type="submit">Criar Exame</button>
</form>
```

---

### Shared Exams (Exames Compartilhados)

Gerenciar exames vinculados a links de compartilhamento.

#### Adicionar exame a um share link
```http
POST /api/shared-exams
Content-Type: application/json
Authorization: Bearer <token>

{
  "shareId": "uuid-do-share-link",
  "examId": "uuid-do-exame"
}
```

#### Listar exames de um share link
```http
GET /api/shared-exams/share/:shareId
Authorization: Bearer <token>
```

#### Contar exames de um share link
```http
GET /api/shared-exams/share/:shareId/count
Authorization: Bearer <token>
```

#### Ver em quais links um exame está compartilhado
```http
GET /api/shared-exams/exam/:examId
Authorization: Bearer <token>
```

#### Remover exame de um share link
```http
DELETE /api/shared-exams/share/:shareId/exam/:examId
Authorization: Bearer <token>
```

---

### Share Access Logs (Logs de Acesso)

Sistema de auditoria para rastrear acessos aos links compartilhados.

#### Listar logs de um share link
```http
GET /api/share-access-logs/share/:shareId?page=1&limit=50
Authorization: Bearer <token>
```

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "log-uuid",
      "event": "otp_requested",
      "emailInput": "medico@example.com",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "createdAt": "2025-01-20T10:00:00Z"
    }
  ],
  "pagination": {...}
}
```

**Eventos registrados:**
- `link_created` - Link criado
- `otp_requested` - OTP solicitado
- `access_granted` - Acesso concedido
- `access_denied_*` - Acesso negado (vários motivos)
- `otp_validation_failed_*` - Falhas na validação de OTP

#### Obter estatísticas de logs
```http
GET /api/share-access-logs/share/:shareId/stats
Authorization: Bearer <token>
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "total": 8,
    "events": {
      "link_created": 1,
      "otp_requested": 3,
      "access_granted": 2,
      "access_denied_wrong_contact": 1
    },
    "lastAccess": "2025-01-20T15:30:00Z"
  }
}
```

#### Deletar logs de um share link
```http
DELETE /api/share-access-logs/share/:shareId
Authorization: Bearer <token>
```

#### Criar log manualmente (opcional)
```http
POST /api/share-access-logs
Content-Type: application/json
Authorization: Bearer <token>

{
  "shareId": "uuid",
  "event": "custom_event",
  "emailInput": "email@example.com"
}
```

## 🛠️ Tecnologias

- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **Drizzle ORM** - ORM para PostgreSQL
- **Multer** - Upload de arquivos
- **Zod** - Validação de schemas
- **JWT** - Autenticação
- **Helmet** - Segurança HTTP headers
- **CORS** - Cross-Origin Resource Sharing
- **Bcrypt** - Hash de senhas

## 📁 Como adicionar novos módulos

1. **Repository** - `src/repositories/[nome].repository.js`
2. **Service** - `src/services/[nome].service.js`
3. **Validator** - `src/validators/[nome].validator.js`
4. **Controller** - `src/controllers/[nome].controller.js`
5. **Routes** - `src/routes/[nome].routes.js`
6. Importar no `src/routes/index.js`

## 📊 Estrutura do Banco de Dados

- `users` - Usuários do sistema
- `exams` - Exames médicos
- `exam_media` - Mídias dos exames
- `reminders` - Lembretes de exames
- `share_links` - Links de compartilhamento
- `shared_exams` - Exames compartilhados
- `share_access_log` - Log de acessos aos compartilhamentos

## 🔧 Variáveis de Ambiente

```env
PORT=5001
NODE_ENV=development
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
ALLOWED_ORIGINS=http://localhost:3000
```

## 🐛 Debug

O projeto usa logs de requisições em desenvolvimento. Todos os erros são capturados pelo middleware de erro global.

## 📤 Recursos de Upload

### **Sistema Completo de Upload Implementado:**
- ✅ Upload direto ao criar exames (multipart/form-data)
- ✅ Suporte a múltiplos arquivos (até 10 por exame)
- ✅ Validação de tipo de arquivo
- ✅ Limite de tamanho (50MB por arquivo)
- ✅ Organização automática por ano/mês
- ✅ Metadados extraídos e salvos
- ✅ Registros de `exam_media` criados automaticamente
- ✅ Integração perfeita com o módulo de exames

### **Limitações e Configurações:**
- Máximo: 10 arquivos por upload
- Tamanho máximo: 50MB por arquivo
- Diretório: `/uploads/exams/YYYY/MM/`
- Tipos permitidos configuráveis em `upload.middleware.js`

## 🎯 Próximos Passos

### 🎉 Todos os Módulos Completos (100%):
1. ✅ **Auth** - Sistema completo de autenticação com JWT
2. ✅ **Users** - CRUD completo de usuários com hash de senha
3. ✅ **Exams** - CRUD completo com upload integrado de arquivos
4. ✅ **Exam Media** - Gerenciamento de arquivos vinculados aos exames
5. ✅ **Reminders** - Sistema de lembretes configuráveis para exames
6. ✅ **Share Links** - Sistema de compartilhamento com autenticação 2FA (OTP)
7. ✅ **Shared Exams** - Gerenciamento de vínculos entre links e exames
8. ✅ **Share Access Logs** - Sistema de auditoria e logs de acesso

**Total: 8 módulos | ~65+ endpoints | 100% funcional**

### 🚀 Como Começar a Usar

1. **Registrar um usuário:**
```bash
POST /api/auth/register
{ "name": "João", "email": "joao@example.com", "password": "senha123" }
```

2. **Fazer login e obter token:**
```bash
POST /api/auth/login
{ "email": "joao@example.com", "password": "senha123" }
# Retorna: { "token": "eyJhbGc..." }
```

3. **Usar o token nas requisições:**
```bash
GET /api/exams
Authorization: Bearer eyJhbGc...
```

### 📌 Importante

- ✅ Use `/api/auth/register` ou `/api/auth/login` para obter tokens JWT
- ✅ Inclua o token no header: `Authorization: Bearer <token>`
- ✅ Tokens expiram em 7 dias (configurável em JWT_EXPIRES_IN)
- ✅ Use `/api/auth/refresh-token` para renovar tokens expirados

## 📄 Licença

ISC

