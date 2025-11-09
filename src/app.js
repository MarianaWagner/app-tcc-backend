import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import routes, { sharePublicRoutes } from './routes/index.js';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware.js';
import { logger } from './middlewares/logger.middleware.js';
import { ENV } from './config/env.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middlewares de segurança
app.use(helmet());
app.use(cors({
  origin: ENV.NODE_ENV === 'production'
    ? process.env.ALLOWED_ORIGINS?.split(',')
    : '*',
  credentials: true,
}));

// Middlewares de parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// View engine para páginas públicas de compartilhamento
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Arquivos estáticos (CSS/imagens) opcionais
app.use('/public', express.static(path.join(__dirname, '..', 'public')));

// Logger (apenas em desenvolvimento por padrão)
if (ENV.NODE_ENV === 'development') {
  app.use(logger);
}

// Rotas principais
app.use('/api', routes);

// Rotas públicas de compartilhamento (/s/:code)
app.use('/s', sharePublicRoutes);

// Middleware de rota não encontrada (404)
app.use(notFoundHandler);

// Middleware de tratamento de erros (deve ser o último)
app.use(errorHandler);

export default app;

