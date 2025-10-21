import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';

export class JwtUtil {
  static sign(payload) {
    return jwt.sign(payload, ENV.JWT_SECRET, {
      expiresIn: ENV.JWT_EXPIRES_IN,
    });
  }

  static verify(token) {
    return jwt.verify(token, ENV.JWT_SECRET);
  }

  static decode(token) {
    return jwt.decode(token);
  }
}

