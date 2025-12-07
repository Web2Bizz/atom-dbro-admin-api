import { describe, it, expect } from 'vitest';
import { loginSchema } from './login.dto';

describe('LoginDto', () => {
  describe('loginSchema validation', () => {
    it('should validate correct email and password', () => {
      const validData = {
        email: 'admin@example.com',
        password: 'password123',
      };

      const result = loginSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should reject invalid email format', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123',
      };

      const result = loginSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('email');
      }
    });

    it('should reject empty email', () => {
      const invalidData = {
        email: '',
        password: 'password123',
      };

      const result = loginSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        // Zod сначала проверяет email формат, поэтому пустая строка даст ошибку "Некорректный формат email"
        const hasEmailError = result.error.issues.some(
          (issue) => issue.message.includes('email') || issue.message.includes('Некорректный')
        );
        expect(hasEmailError).toBe(true);
      }
    });

    it('should reject missing email', () => {
      const invalidData = {
        password: 'password123',
      };

      const result = loginSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should reject empty password', () => {
      const invalidData = {
        email: 'admin@example.com',
        password: '',
      };

      const result = loginSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('обязателен');
      }
    });

    it('should reject missing password', () => {
      const invalidData = {
        email: 'admin@example.com',
      };

      const result = loginSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should accept various valid email formats', () => {
      const validEmails = [
        'user@example.com',
        'user.name@example.com',
        'user+tag@example.co.uk',
        'user123@example-domain.com',
      ];

      validEmails.forEach((email) => {
        const result = loginSchema.safeParse({
          email,
          password: 'password123',
        });

        expect(result.success).toBe(true);
      });
    });

    it('should reject various invalid email formats', () => {
      const invalidEmails = [
        'not-an-email',
        '@example.com',
        'user@',
        'user@example',
        'user space@example.com',
      ];

      invalidEmails.forEach((email) => {
        const result = loginSchema.safeParse({
          email,
          password: 'password123',
        });

        expect(result.success).toBe(false);
      });
    });

    it('should accept password with special characters', () => {
      const validData = {
        email: 'admin@example.com',
        password: 'P@ssw0rd!@#$%^&*()',
      };

      const result = loginSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('should accept password with unicode characters', () => {
      const validData = {
        email: 'admin@example.com',
        password: 'пароль123',
      };

      const result = loginSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });
  });
});

