import { UserRepository } from '../repositories/user.repository.js';
import { HashUtil } from '../utils/hash.util.js';
import { JwtUtil } from '../utils/jwt.util.js';
import { UnauthorizedError, ValidationError, ConflictError, NotFoundError } from '../utils/errors.util.js';

export class AuthService {
  constructor() {
    this.userRepository = new UserRepository();
  }

  formatAuthResponse(user, token) {
    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
      },
      token,
    };
  }

  async register(data) {
    const { name, email, password } = data;

    // Verificar se o email já existe
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictError('Email already in use');
    }

    // Validar senha
    if (password.length < 6) {
      throw new ValidationError('Password must be at least 6 characters');
    }

    // Hash da senha
    const hashedPassword = await HashUtil.hash(password);

    // Criar usuário
    const user = await this.userRepository.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
    });

    // Gerar token JWT
    const token = JwtUtil.sign({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    return this.formatAuthResponse(user, token);
  }

  async login(data) {
    const { email, password } = data;

    // Buscar usuário por email
    const user = await this.userRepository.findByEmail(email);
    
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Verificar se o usuário foi deletado (soft delete)
    if (user.deletedAt) {
      throw new UnauthorizedError('Account has been deactivated');
    }

    // Verificar senha
    const isPasswordValid = await HashUtil.compare(password, user.password);
    
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Gerar token JWT
    const token = JwtUtil.sign({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    return this.formatAuthResponse(user, token);
  }

  async verifyToken(token) {
    try {
      const decoded = JwtUtil.verify(token);
      
      // Buscar usuário para verificar se ainda existe
      const user = await this.userRepository.findById(decoded.userId);
      
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      if (user.deletedAt) {
        throw new UnauthorizedError('Account has been deactivated');
      }

      return {
        valid: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw error;
      }
      throw new UnauthorizedError('Invalid or expired token');
    }
  }

  async refreshToken(oldToken) {
    try {
      // Verificar token antigo
      const decoded = JwtUtil.verify(oldToken);
      
      // Buscar usuário
      const user = await this.userRepository.findById(decoded.userId);
      
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      if (user.deletedAt) {
        throw new UnauthorizedError('Account has been deactivated');
      }

      // Gerar novo token
      const newToken = JwtUtil.sign({
        userId: user.id,
        email: user.email,
        name: user.name,
      });

      return {
        token: newToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw error;
      }
      throw new UnauthorizedError('Invalid or expired token');
    }
  }

  async changePassword(userId, data) {
    const { currentPassword, newPassword } = data;

    // Buscar usuário
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Verificar senha atual
    const isPasswordValid = await HashUtil.compare(currentPassword, user.password);
    
    if (!isPasswordValid) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    // Validar nova senha
    if (newPassword.length < 6) {
      throw new ValidationError('New password must be at least 6 characters');
    }

    // Não permitir senha igual à antiga
    const isSamePassword = await HashUtil.compare(newPassword, user.password);
    if (isSamePassword) {
      throw new ValidationError('New password must be different from current password');
    }

    // Hash da nova senha
    const hashedPassword = await HashUtil.hash(newPassword);

    // Atualizar senha
    await this.userRepository.update(userId, {
      password: hashedPassword,
    });

    return {
      message: 'Password changed successfully',
    };
  }

  async getCurrentUser(userId) {
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.deletedAt) {
      throw new UnauthorizedError('Account has been deactivated');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: user.updatedAt?.toISOString() || new Date().toISOString(),
    };
  }
}

