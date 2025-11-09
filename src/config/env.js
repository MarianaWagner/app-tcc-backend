import "dotenv/config";

export const ENV = {
    PORT: process.env.PORT || 5001, 
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV || "development",
    JWT_SECRET: process.env.JWT_SECRET || "your-secret-key-change-in-production",
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || "http://localhost:3000",
    FRONTEND_URL: process.env.FRONTEND_URL || process.env.ALLOWED_ORIGINS?.split(',')[0] || "http://localhost:3000",
    SHARE_BASE_URL: process.env.SHARE_BASE_URL || process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5001}`,
    // SMTP Configuration
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_SECURE: process.env.SMTP_SECURE,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    SMTP_URL: process.env.SMTP_URL, // URL completa alternativa
    SMTP_FROM: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@exams.app',
    // Termo de Responsabilidade
    TERM_VERSION: process.env.TERM_VERSION || '1.0.0', // Versão atual do termo
};