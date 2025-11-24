import fs from 'fs';
import path from 'path';

export class FileUtil {
  /**
   * Determina o tipo de mídia baseado no mimetype
   */
  static getMediaType(mimetype) {
    if (mimetype.startsWith('image/')) {
      return 'image';
    }
    if (mimetype === 'application/pdf') {
      return 'pdf';
    }
    if (mimetype.startsWith('video/')) {
      return 'video';
    }
    return 'document';
  }

  /**
   * Extrai metadados do arquivo
   */
  static extractMetadata(file) {
    return {
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      encoding: file.encoding,
    };
  }

  /**
   * Deleta um arquivo do sistema
   */
  static deleteFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  /**
   * Deleta múltiplos arquivos
   */
  static deleteFiles(filePaths) {
    const results = [];
    for (const filePath of filePaths) {
      results.push(this.deleteFile(filePath));
    }
    return results;
  }

  /**
   * Formata o caminho do arquivo para ser relativo ao diretório uploads
   */
  static getRelativePath(fullPath) {
    // Remove o caminho absoluto e mantém apenas o relativo
    // Procura por /uploads/ ou pelo BASE_UPLOAD_DIR
    const uploadsIndex = fullPath.indexOf('/uploads/');
    if (uploadsIndex !== -1) {
      return fullPath.substring(uploadsIndex);
    }
    
    // Em produção, pode ser /var/data/exams/...
    const baseUploadDir = process.env.BASE_UPLOAD_DIR;
    if (baseUploadDir && fullPath.startsWith(baseUploadDir)) {
      // Retorna o caminho relativo ao BASE_UPLOAD_DIR
      // Remove a barra inicial se existir após remover o baseUploadDir
      let relativePath = fullPath.substring(baseUploadDir.length);
      if (relativePath.startsWith('/')) {
        relativePath = relativePath.substring(1);
      }
      return relativePath;
    }
    
    return fullPath;
  }

  /**
   * Obtém o caminho completo do arquivo
   */
  static getFullPath(relativePath) {
    // Se o caminho já é absoluto (começa com /), retorná-lo como está
    // Isso cobre casos legados onde o caminho completo foi salvo no banco
    if (path.isAbsolute(relativePath)) {
      return relativePath;
    }
    
    // Se temos BASE_UPLOAD_DIR configurado, usar ele
    const baseUploadDir = process.env.BASE_UPLOAD_DIR;
    if (baseUploadDir) {
      // Se o caminho relativo começa com /, remover para evitar problemas
      const normalizedPath = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
      return path.join(baseUploadDir, normalizedPath);
    }
    
    // Caso contrário, usar process.cwd()
    // Remove barra inicial se existir para garantir que seja relativo
    const normalizedPath = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
    return path.join(process.cwd(), normalizedPath);
  }
}

