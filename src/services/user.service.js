import { UserRepository } from '../repositories/user.repository.js';
import { HashUtil } from '../utils/hash.util.js';
import { NotFoundError, ConflictError } from '../utils/errors.util.js';

export class UserService {
  constructor() {
    this.userRepository = new UserRepository();
  }

  formatUserResponse(user) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: user.updatedAt?.toISOString() || new Date().toISOString(),
      deletedAt: user.deletedAt?.toISOString() || null,
    };
  }

  async createUser(data) {
    // Verificar se o email já existe
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictError('Email already in use');
    }

    // Hash da senha
    const hashedPassword = await HashUtil.hash(data.password);

    const newUser = {
      name: data.name,
      email: data.email.toLowerCase(),
      password: hashedPassword,
    };

    const user = await this.userRepository.create(newUser);
    return this.formatUserResponse(user);
  }

  async getUserById(userId) {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return this.formatUserResponse(user);
  }

  async getUserByEmail(email) {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return this.formatUserResponse(user);
  }

  async getAllUsers(query) {
    const { users, total } = await this.userRepository.findAll(query);

    const page = query.page || 1;
    const limit = query.limit || 10;

    return {
      data: users.map(user => this.formatUserResponse(user)),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateUser(userId, data) {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const updateData = {};

    if (data.name !== undefined) updateData.name = data.name;
    
    if (data.email !== undefined) {
      // Verificar se o novo email já está em uso por outro usuário
      const existingUser = await this.userRepository.findByEmail(data.email);
      if (existingUser && existingUser.id !== userId) {
        throw new ConflictError('Email already in use');
      }
      updateData.email = data.email.toLowerCase();
    }

    if (data.password !== undefined) {
      updateData.password = await HashUtil.hash(data.password);
    }

    const updated = await this.userRepository.update(userId, updateData);

    if (!updated) {
      throw new NotFoundError('Failed to update user');
    }

    return this.formatUserResponse(updated);
  }

  async deleteUser(userId, hard = false) {
    const user = await this.userRepository.findById(userId, true);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (hard) {
      const deleted = await this.userRepository.hardDelete(userId);
      if (!deleted) {
        throw new NotFoundError('Failed to delete user');
      }
    } else {
      const deleted = await this.userRepository.softDelete(userId);
      if (!deleted) {
        throw new NotFoundError('Failed to delete user');
      }
    }
  }

  async restoreUser(userId) {
    const user = await this.userRepository.restore(userId);

    if (!user) {
      throw new NotFoundError('User not found or already active');
    }

    return this.formatUserResponse(user);
  }

  async verifyPassword(userId, password) {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return HashUtil.compare(password, user.password);
  }
}

