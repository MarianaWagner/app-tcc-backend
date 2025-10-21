# 📤 Exemplos de Upload de Arquivos

Este documento contém exemplos práticos de como fazer upload de arquivos ao criar exames.

## 🔧 Configuração

O sistema aceita até **10 arquivos** por upload, com tamanho máximo de **50MB cada**.

### Tipos de arquivo permitidos:
- **Imagens:** JPG, JPEG, PNG, GIF, WebP
- **Documentos:** PDF
- **Vídeos:** MP4, MOV

## 📝 Exemplos de Uso

### 1. cURL (Terminal)

```bash
# Upload com múltiplos arquivos
curl -X POST http://localhost:5001/api/exams \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -F "name=Hemograma Completo" \
  -F "examDate=2025-01-20" \
  -F "notes=Exame de rotina anual" \
  -F "tags[]=sangue" \
  -F "tags[]=rotina" \
  -F "files=@./laudo.pdf" \
  -F "files=@./resultado.jpg" \
  -F "files=@./grafico.png"
```

### 2. JavaScript/Fetch (Frontend)

```javascript
async function criarExameComArquivos() {
  const formData = new FormData();
  
  // Dados do exame
  formData.append('name', 'Hemograma Completo');
  formData.append('examDate', '2025-01-20');
  formData.append('notes', 'Exame de rotina');
  formData.append('tags', JSON.stringify(['sangue', 'rotina']));
  
  // Arquivos (do input file)
  const fileInput = document.getElementById('fileInput');
  for (const file of fileInput.files) {
    formData.append('files', file);
  }
  
  try {
    const response = await fetch('http://localhost:5001/api/exams', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('Exame criado:', result.data);
      console.log('Arquivos enviados:', result.data.uploadedFiles);
    }
  } catch (error) {
    console.error('Erro:', error);
  }
}
```

### 3. React Component

```jsx
import { useState } from 'react';

function CreateExamForm() {
  const [formData, setFormData] = useState({
    name: '',
    examDate: '',
    notes: '',
    tags: []
  });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const data = new FormData();
    data.append('name', formData.name);
    data.append('examDate', formData.examDate);
    data.append('notes', formData.notes);
    data.append('tags', JSON.stringify(formData.tags));

    // Adicionar arquivos
    files.forEach(file => {
      data.append('files', file);
    });

    try {
      const response = await fetch('http://localhost:5001/api/exams', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: data
      });

      const result = await response.json();

      if (result.success) {
        alert(`Exame criado com ${result.data.uploadedFiles?.length || 0} arquivo(s)!`);
        // Resetar formulário
      }
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={formData.name}
        onChange={(e) => setFormData({...formData, name: e.target.value})}
        placeholder="Nome do exame"
        required
      />
      
      <input
        type="date"
        value={formData.examDate}
        onChange={(e) => setFormData({...formData, examDate: e.target.value})}
      />
      
      <textarea
        value={formData.notes}
        onChange={(e) => setFormData({...formData, notes: e.target.value})}
        placeholder="Observações"
      />
      
      <input
        type="file"
        multiple
        accept="image/*,.pdf,video/*"
        onChange={(e) => setFiles(Array.from(e.target.files))}
      />
      
      <p>Arquivos selecionados: {files.length}</p>
      
      <button type="submit" disabled={loading}>
        {loading ? 'Enviando...' : 'Criar Exame'}
      </button>
    </form>
  );
}
```

### 4. Axios (JavaScript)

```javascript
import axios from 'axios';

async function createExamWithFiles(examData, files) {
  const formData = new FormData();
  
  formData.append('name', examData.name);
  formData.append('examDate', examData.examDate);
  formData.append('notes', examData.notes);
  formData.append('tags', JSON.stringify(examData.tags));
  
  files.forEach(file => {
    formData.append('files', file);
  });
  
  try {
    const response = await axios.post(
      'http://localhost:5001/api/exams',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          console.log(`Upload: ${percentCompleted}%`);
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Erro:', error.response?.data || error);
    throw error;
  }
}
```

### 5. Postman

1. Selecione método **POST**
2. URL: `http://localhost:5001/api/exams`
3. Em **Headers**, adicione:
   - `Authorization: Bearer SEU_TOKEN`
4. Em **Body**, selecione **form-data**
5. Adicione os campos:
   - `name` (text): "Hemograma Completo"
   - `examDate` (text): "2025-01-20"
   - `notes` (text): "Exame de rotina"
   - `tags` (text): ["sangue", "rotina"]
   - `files` (file): Selecione um arquivo
   - `files` (file): Selecione outro arquivo (mesmo nome de campo!)

## 🔍 Validações de Upload

### Tipos de arquivo rejeitados:
```json
{
  "success": false,
  "error": "File type application/msword is not allowed. Allowed types: images (jpg, png, gif, webp), PDF, and videos (mp4, mov)"
}
```

### Arquivo muito grande:
```json
{
  "success": false,
  "error": "File size too large. Maximum size is 50MB per file."
}
```

### Muitos arquivos:
```json
{
  "success": false,
  "error": "Too many files. Maximum is 10 files per upload."
}
```

## 📂 Estrutura de Resposta

### Com arquivos:
```json
{
  "success": true,
  "data": {
    "id": "exam-uuid",
    "name": "Hemograma Completo",
    "examDate": "2025-01-20",
    "notes": "Exame de rotina",
    "tags": ["sangue", "rotina"],
    "uploadedFiles": [
      {
        "id": "media-uuid-1",
        "mediaType": "pdf",
        "filePath": "/uploads/exams/2025/01/laudo-1705747200000-123456789.pdf",
        "metadata": {
          "originalName": "laudo.pdf",
          "mimetype": "application/pdf",
          "size": 1024000,
          "encoding": "7bit"
        }
      },
      {
        "id": "media-uuid-2",
        "mediaType": "image",
        "filePath": "/uploads/exams/2025/01/resultado-1705747200000-987654321.jpg",
        "metadata": {
          "originalName": "resultado.jpg",
          "mimetype": "image/jpeg",
          "size": 512000,
          "encoding": "7bit"
        }
      }
    ],
    "createdAt": "2025-01-20T10:00:00Z",
    "updatedAt": "2025-01-20T10:00:00Z"
  },
  "message": "Exam created successfully with 2 file(s)"
}
```

### Sem arquivos:
```json
{
  "success": true,
  "data": {
    "id": "exam-uuid",
    "name": "Hemograma Completo",
    "examDate": "2025-01-20",
    "notes": "Exame de rotina",
    "tags": ["sangue", "rotina"],
    "createdAt": "2025-01-20T10:00:00Z",
    "updatedAt": "2025-01-20T10:00:00Z"
  },
  "message": "Exam created successfully"
}
```

## 🚀 Fluxo Completo de Uso

1. **Usuário faz login**
2. **Cria exame com arquivos em uma única requisição**
3. **Sistema automaticamente:**
   - Salva o exame
   - Faz upload dos arquivos
   - Cria registros de `exam_media`
   - Retorna tudo junto
4. **Arquivos ficam disponíveis para:**
   - Visualização via API
   - Download
   - Compartilhamento via Share Links

## 💾 Gerenciamento de Arquivos

### Listar arquivos de um exame:
```bash
GET /api/exam-media/exam/:examId
```

### Deletar arquivo específico:
```bash
DELETE /api/exam-media/:mediaId
```

### Adicionar mais arquivos depois:
```bash
POST /api/exam-media
{
  "examId": "uuid",
  "mediaType": "image",
  "filePath": "/path/to/file",
  "metadata": {...}
}
```

## ⚙️ Configurações Avançadas

Para alterar limites de upload, edite `src/middlewares/upload.middleware.js`:

```javascript
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // Alterar para 100MB
  }
});

// Alterar número máximo de arquivos
export const uploadExamFiles = upload.array('files', 20); // 20 arquivos
```

