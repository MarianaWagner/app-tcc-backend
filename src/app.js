import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware.js';
import { logger } from './middlewares/logger.middleware.js';
import { ENV } from './config/env.js';

const app = express();

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

// Logger (apenas em desenvolvimento por padrão)
if (ENV.NODE_ENV === 'development') {
  app.use(logger);
}

// Rotas principais
app.use('/api', routes);

// Middleware de rota não encontrada (404)
app.use(notFoundHandler);

// Middleware de tratamento de erros (deve ser o último)
app.use(errorHandler);

export default app;

