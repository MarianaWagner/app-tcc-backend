# 📚 Referência Completa da API

## 🔗 Base URL

```
http://localhost:5001/api
```

## 🔐 Autenticação

A maioria das rotas requer autenticação JWT. Adicione o token no header:

```
Authorization: Bearer <seu_token_jwt>
```

---

## 📋 Tabela Resumo de Endpoints

| Módulo | Endpoint Base | Autenticação | Descrição |
|--------|--------------|--------------|-----------|
| Auth | `/auth` | Mista | Login, registro, tokens |
| Users | `/users` | Sim* | Gerenciamento de usuários |
| Exams | `/exams` | Sim | Gerenciamento de exames |
| Exam Media | `/exam-media` | Sim | Arquivos dos exames |
| Reminders | `/reminders` | Sim | Lembretes de exames |
| Share Links | `/share-links` | Mista | Compartilhamento com 2FA |
| Shared Exams | `/shared-exams` | Sim | Vínculos exame-compartilhamento |
| Access Logs | `/share-access-logs` | Sim | Logs de auditoria |

*Algumas rotas públicas

---

## 1️⃣ Auth (Autenticação)

### Rotas Públicas

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/auth/register` | Registrar novo usuário |
| POST | `/auth/login` | Fazer login |
| POST | `/auth/verify-token` | Verificar se token é válido |
| POST | `/auth/refresh-token` | Renovar token |

### Rotas Protegidas

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/auth/me` | Dados do usuário logado |
| POST | `/auth/change-password` | Alterar senha |
| POST | `/auth/logout` | Fazer logout |

---

## 2️⃣ Users (Usuários)

| Método | Endpoint | Auth | Descrição |
|--------|----------|------|-----------|
| POST | `/users` | Não | Criar usuário (registro público) |
| GET | `/users` | Sim | Listar usuários |
| GET | `/users/me` | Sim | Dados do usuário logado |
| GET | `/users/:id` | Sim | Obter usuário por ID |
| PUT | `/users/me` | Sim | Atualizar usuário logado |
| PUT | `/users/:id` | Sim | Atualizar usuário |
| PATCH | `/users/:id` | Sim | Atualizar parcialmente |
| DELETE | `/users/:id` | Sim | Deletar usuário (soft delete) |
| DELETE | `/users/:id?hard=true` | Sim | Deletar permanentemente |
| POST | `/users/:id/restore` | Sim | Restaurar usuário deletado |

---

## 3️⃣ Exams (Exames)

| Método | Endpoint | Auth | Descrição |
|--------|----------|------|-----------|
| POST | `/exams` | Sim | Criar exame (+ upload de arquivos) |
| GET | `/exams` | Sim | Listar exames do usuário |
| GET | `/exams/:id` | Sim | Obter exame por ID |
| PUT | `/exams/:id` | Sim | Atualizar exame |
| PATCH | `/exams/:id` | Sim | Atualizar parcialmente |
| DELETE | `/exams/:id` | Sim | Deletar exame (soft delete) |
| DELETE | `/exams/:id?hard=true` | Sim | Deletar permanentemente |
| POST | `/exams/:id/restore` | Sim | Restaurar exame deletado |

**Upload:** Aceita multipart/form-data com campo `files` (até 10 arquivos, 50MB cada)

---

## 4️⃣ Exam Media (Mídias de Exames)

| Método | Endpoint | Auth | Descrição |
|--------|----------|------|-----------|
| POST | `/exam-media` | Sim | Adicionar mídia a um exame |
| GET | `/exam-media/:id` | Sim | Obter mídia por ID |
| GET | `/exam-media/exam/:examId` | Sim | Listar mídias de um exame |
| GET | `/exam-media/exam/:examId/count` | Sim | Contar mídias de um exame |
| PUT | `/exam-media/:id` | Sim | Atualizar mídia |
| PATCH | `/exam-media/:id` | Sim | Atualizar parcialmente |
| DELETE | `/exam-media/:id` | Sim | Deletar mídia |
| DELETE | `/exam-media/exam/:examId` | Sim | Deletar todas as mídias de um exame |

**Tipos permitidos:** `image`, `pdf`, `video`, `document`, `other`

---

## 5️⃣ Reminders (Lembretes)

| Método | Endpoint | Auth | Descrição |
|--------|----------|------|-----------|
| POST | `/reminders` | Sim | Criar lembrete |
| GET | `/reminders` | Sim | Listar lembretes do usuário |
| GET | `/reminders/upcoming` | Sim | Lembretes próximos (N dias) |
| GET | `/reminders/stats` | Sim | Estatísticas de lembretes |
| GET | `/reminders/exam/:examId` | Sim | Lembretes de um exame |
| GET | `/reminders/:id` | Sim | Obter lembrete por ID |
| PUT | `/reminders/:id` | Sim | Atualizar lembrete |
| PATCH | `/reminders/:id` | Sim | Atualizar parcialmente |
| DELETE | `/reminders/:id` | Sim | Deletar lembrete |
| DELETE | `/reminders/exam/:examId` | Sim | Deletar todos os lembretes de um exame |

---

## 6️⃣ Share Links (Links de Compartilhamento)

### Rotas do Proprietário (Autenticadas)

| Método | Endpoint | Auth | Descrição |
|--------|----------|------|-----------|
| POST | `/share-links` | Sim | Criar link de compartilhamento |
| GET | `/share-links` | Sim | Listar links do usuário |
| GET | `/share-links/stats` | Sim | Estatísticas de compartilhamentos |
| GET | `/share-links/:id` | Sim | Obter link por ID |
| GET | `/share-links/:id/logs` | Sim | Ver logs de acesso |
| DELETE | `/share-links/:id` | Sim | Deletar link |

### Rotas Públicas (Acesso ao Link)

| Método | Endpoint | Auth | Descrição |
|--------|----------|------|-----------|
| POST | `/share-links/request-access` | Não | Solicitar OTP |
| POST | `/share-links/validate-otp` | Não | Validar OTP e acessar |

---

## 7️⃣ Shared Exams (Exames Compartilhados)

| Método | Endpoint | Auth | Descrição |
|--------|----------|------|-----------|
| POST | `/shared-exams` | Sim | Adicionar exame a um share link |
| GET | `/shared-exams/share/:shareId` | Sim | Listar exames de um share link |
| GET | `/shared-exams/share/:shareId/count` | Sim | Contar exames de um share link |
| GET | `/shared-exams/exam/:examId` | Sim | Ver links que contêm este exame |
| DELETE | `/shared-exams/share/:shareId/exam/:examId` | Sim | Remover exame de um share link |

---

## 8️⃣ Share Access Logs (Logs de Acesso)

| Método | Endpoint | Auth | Descrição |
|--------|----------|------|-----------|
| POST | `/share-access-logs` | Sim | Criar log manualmente |
| GET | `/share-access-logs/share/:shareId` | Sim | Listar logs de um share link |
| GET | `/share-access-logs/share/:shareId/stats` | Sim | Estatísticas de logs |
| DELETE | `/share-access-logs/share/:shareId` | Sim | Deletar logs |

---

## 🔍 Parâmetros de Consulta Comuns

### Paginação
```
?page=1&limit=10
```

### Filtros de Data
```
?startDate=2025-01-01T00:00:00Z&endDate=2025-12-31T23:59:59Z
```

### Busca
```
?search=termo
```

### Filtros Específicos

#### Exams:
```
?tags=sangue,rotina&upcoming=true
```

#### Reminders:
```
?upcoming=true&daysAhead=7
```

#### Share Links:
```
?active=true
```

#### Exam Media:
```
?mediaType=image
```

---

## 📊 Estrutura de Resposta Padrão

### Sucesso
```json
{
  "success": true,
  "data": { ... },
  "message": "Mensagem opcional"
}
```

### Erro
```json
{
  "success": false,
  "error": "Mensagem do erro"
}
```

### Paginada
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

---

## 🔒 Códigos de Status HTTP

| Código | Significado | Quando |
|--------|-------------|--------|
| 200 | OK | Requisição bem-sucedida |
| 201 | Created | Recurso criado |
| 204 | No Content | Sem conteúdo (raro) |
| 400 | Bad Request | Validação falhou |
| 401 | Unauthorized | Token inválido/expirado |
| 403 | Forbidden | Sem permissão |
| 404 | Not Found | Recurso não encontrado |
| 409 | Conflict | Conflito (ex: email já existe) |
| 500 | Internal Error | Erro no servidor |

---

## 💡 Exemplos de Fluxo Completo

### Fluxo 1: Criar Usuário e Exame com Arquivos

```bash
# 1. Registrar
POST /api/auth/register
{ "name": "Maria", "email": "maria@example.com", "password": "senha123" }
# Retorna: { token: "..." }

# 2. Criar exame com arquivos
POST /api/exams
Headers: Authorization: Bearer <token>
Content-Type: multipart/form-data
Form: name, examDate, files[]

# 3. Ver exames criados
GET /api/exams
Headers: Authorization: Bearer <token>
```

### Fluxo 2: Compartilhar Exame com Médico

```bash
# 1. Criar link de compartilhamento
POST /api/share-links
{ "contact": "medico@example.com", "examIds": ["uuid1", "uuid2"] }

# 2. Médico solicita acesso (sem auth)
POST /api/share-links/request-access
{ "token": "abc123", "contact": "medico@example.com" }

# 3. Médico valida OTP (sem auth)
POST /api/share-links/validate-otp
{ "token": "abc123", "contact": "medico@example.com", "otp": "123456" }

# 4. Dono vê logs de acesso
GET /api/share-access-logs/share/:shareId
Headers: Authorization: Bearer <token>
```

### Fluxo 3: Gerenciar Lembretes

```bash
# 1. Criar lembrete para repetir exame em 6 meses
POST /api/reminders
{ "examId": "uuid", "title": "Repetir exame", "reminderDate": "2025-07-20T09:00:00Z" }

# 2. Ver lembretes próximos (dos próximos 3 dias)
GET /api/reminders/upcoming?daysAhead=3

# 3. Ver estatísticas
GET /api/reminders/stats
```

---

## 🎯 Total de Endpoints

- **Auth:** 7 endpoints
- **Users:** 10 endpoints
- **Exams:** 8 endpoints
- **Exam Media:** 8 endpoints
- **Reminders:** 10 endpoints
- **Share Links:** 8 endpoints
- **Shared Exams:** 5 endpoints
- **Share Access Logs:** 4 endpoints

**Total: ~60 endpoints funcionais**

---

## 📖 Documentação Adicional

- [README.md](./README.md) - Documentação principal
- [UPLOAD_EXAMPLES.md](./UPLOAD_EXAMPLES.md) - Exemplos de upload de arquivos
- [API_REFERENCE.md](./API_REFERENCE.md) - Este documento

---

## 🆘 Suporte

Para dúvidas ou problemas:
1. Verifique os logs do servidor
2. Teste com Postman/Insomnia
3. Veja os exemplos no README.md
4. Consulte a documentação do Drizzle ORM

