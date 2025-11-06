import { ExamMediaService } from '../services/examMedia.service.js';
import { ShareLinkService } from '../services/shareLink.service.js';
import { FileUtil } from '../utils/file.util.js';
import { ResponseUtil } from '../utils/response.util.js';
import archiver from 'archiver';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class ShareDownloadController {
  constructor() {
    this.examMediaService = new ExamMediaService();
    this.shareLinkService = new ShareLinkService();
  }

  /**
   * GET /s/:code/files - Lista arquivos disponíveis para download
   */
  listFiles = async (req, res, next) => {
    try {
      const { shareLink } = req;
      
      // Buscar todos os exames compartilhados neste link
      const { ShareLinkRepository } = await import('../repositories/shareLink.repository.js');
      const shareLinkRepo = new ShareLinkRepository();
      const result = await shareLinkRepo.findByIdWithExams(shareLink.id);
      
      if (!result || !result.exams || result.exams.length === 0) {
        return ResponseUtil.success(res, { files: [] });
      }

      // Buscar arquivos de todos os exames compartilhados
      const allFiles = [];
      for (const exam of result.exams) {
        const files = await this.examMediaService.getMediasByExamForShare(exam.id);
        // Adicionar informações do exame a cada arquivo
        files.forEach(file => {
          allFiles.push({
            ...file,
            examName: exam.name,
            examDate: exam.examDate || null,
          });
        });
      }
      
      return ResponseUtil.success(res, { files: allFiles });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /s/:code/files/:mediaId/download - Download de arquivo específico
   */
  downloadFile = async (req, res, next) => {
    try {
      const { shareId, shareLink } = req;
      const { mediaId } = req.params;
      const ipAddress = req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';

      // Buscar mídia
      const media = await this.examMediaService.getMediaByIdForShare(mediaId);

      // Verificar se a mídia pertence a algum dos exames compartilhados neste link
      const { ShareLinkRepository } = await import('../repositories/shareLink.repository.js');
      const shareLinkRepo = new ShareLinkRepository();
      const result = await shareLinkRepo.findByIdWithExams(shareLink.id);
      
      if (!result || !result.exams) {
        return ResponseUtil.error(res, 'No exams found in this share link', 404);
      }

      const examIds = result.exams.map(e => e.id);
      if (!examIds.includes(media.examId)) {
        return ResponseUtil.error(res, 'Media does not belong to any shared exam in this link', 403);
      }

      // Obter caminho completo do arquivo
      const filePath = FileUtil.getFullPath(media.filePath);

      // Verificar se o arquivo existe
      if (!fs.existsSync(filePath)) {
        return ResponseUtil.error(res, 'File not found', 404);
      }

      // Incrementar contador de usos do compartilhamento
      await shareLinkRepo.incrementTimesUsed(shareId);

      // Logar download
      await this.shareLinkService.logAccess(shareId, 'FILE_DOWNLOADED', null, ipAddress, userAgent);

      // Obter nome do arquivo original
      const originalName = media.metadata?.originalName || path.basename(filePath);
      const safeFileName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');

      // Obter tipo MIME
      const mimeType = media.metadata?.mimetype || 'application/octet-stream';

      // Configurar headers de download
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${safeFileName}"`);
      res.setHeader('X-Content-Type-Options', 'nosniff');

      // Enviar arquivo
      res.sendFile(filePath, (err) => {
        if (err) {
          console.error('Error sending file:', err);
          if (!res.headersSent) {
            return ResponseUtil.error(res, 'Failed to send file', 500);
          }
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /s/:code/download-all - Download de todos os arquivos como ZIP
   */
  downloadAll = async (req, res, next) => {
    try {
      const { shareId, shareLink } = req;
      const ipAddress = req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';

      // Buscar todos os exames compartilhados neste link
      const { ShareLinkRepository } = await import('../repositories/shareLink.repository.js');
      const shareLinkRepo = new ShareLinkRepository();
      const result = await shareLinkRepo.findByIdWithExams(shareLink.id);
      
      if (!result || !result.exams || result.exams.length === 0) {
        return ResponseUtil.error(res, 'No exams found in this share link', 404);
      }

      // Buscar todos os arquivos de todos os exames
      const allFiles = [];
      for (const exam of result.exams) {
        const files = await this.examMediaService.getMediasByExamForShare(exam.id);
        files.forEach(file => {
          allFiles.push({
            ...file,
            examName: exam.name,
            examDate: exam.examDate,
          });
        });
      }

      if (allFiles.length === 0) {
        return ResponseUtil.error(res, 'No files available for download', 404);
      }

      // Incrementar contador de usos do compartilhamento
      await shareLinkRepo.incrementTimesUsed(shareId);

      // Logar download
      await this.shareLinkService.logAccess(shareId, 'ALL_FILES_DOWNLOADED', null, ipAddress, userAgent);

      // Gerar nome do arquivo ZIP
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
      const zipFileName = `exames-${dateStr}.zip`;

      // Configurar headers para download ZIP
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${zipFileName}"`);
      res.setHeader('X-Content-Type-Options', 'nosniff');

      // Criar arquivo ZIP usando archiver
      const archive = archiver('zip', {
        zlib: { level: 9 } // Máxima compressão
      });

      // Tratar erros do archiver
      archive.on('error', (err) => {
        console.error('Error creating ZIP:', err);
        if (!res.headersSent) {
          return ResponseUtil.error(res, 'Failed to create ZIP file', 500);
        }
      });

      // Conectar o stream do ZIP com a resposta
      archive.pipe(res);

      // Adicionar arquivos ao ZIP
      for (const file of allFiles) {
        const filePath = FileUtil.getFullPath(file.filePath);
        
        // Verificar se o arquivo existe
        if (!fs.existsSync(filePath)) {
          console.warn(`File not found: ${filePath}`);
          continue;
        }

        // Criar estrutura de pastas: examName/arquivo.pdf
        const safeExamName = (file.examName || 'Exame').replace(/[^a-zA-Z0-9._-]/g, '_');
        const originalName = file.metadata?.originalName || path.basename(filePath);
        const safeFileName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
        const zipEntryPath = `${safeExamName}/${safeFileName}`;

        // Adicionar arquivo ao ZIP
        archive.file(filePath, { name: zipEntryPath });
      }

      // Finalizar o ZIP
      await archive.finalize();

      // Note: Não enviar resposta aqui, o archiver vai fazer isso através do pipe
    } catch (error) {
      next(error);
    }
  };
}

