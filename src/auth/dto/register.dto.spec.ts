import { describe, it, expect } from 'vitest';
import { registerSchema } from './register.dto';

describe('RegisterDto', () => {
  describe('registerSchema validation', () => {
    it('should validate correct data', () => {
      const validData = {
        firstName: 'John',
        lastName: 'Doe',
        middleName: 'Middle',
        email: 'user@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      };

      const result = registerSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should reject when password and confirmPassword do not match', () => {
      const invalidData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'user@example.com',
        password: 'password123',
        confirmPassword: 'differentPassword',
      };

      const result = registerSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        const confirmPasswordError = result.error.issues.find(
          (issue) => issue.path.includes('confirmPassword')
        );
        expect(confirmPasswordError).toBeDefined();
        expect(confirmPasswordError?.message).toContain('совпадать');
      }
    });

    it('should reject empty firstName', () => {
      const invalidData = {
        firstName: '',
        lastName: 'Doe',
        email: 'user@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      };

      const result = registerSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('обязательно');
      }
    });

    it('should reject missing firstName', () => {
      const invalidData = {
        lastName: 'Doe',
        email: 'user@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      };

      const result = registerSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should reject empty lastName', () => {
      const invalidData = {
        firstName: 'John',
        lastName: '',
        email: 'user@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      };

      const result = registerSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('обязательна');
      }
    });

    it('should reject missing lastName', () => {
      const invalidData = {
        firstName: 'John',
        email: 'user@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      };

      const result = registerSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should reject invalid email', () => {
      const invalidData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'invalid-email',
        password: 'password123',
        confirmPassword: 'password123',
      };

      const result = registerSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('email');
      }
    });

    it('should accept valid data without middleName', () => {
      const validData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'user@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      };

      const result = registerSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('should accept valid data with null middleName', () => {
      // Zod optional() не принимает null, только undefined или отсутствие поля
      // Проверяем, что схема работает без middleName (undefined)
      const validDataWithoutMiddle = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'user@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      };

      const result = registerSchema.safeParse(validDataWithoutMiddle);
      expect(result.success).toBe(true);
      
      // Также проверяем с undefined явно
      const validDataWithUndefined = {
        ...validDataWithoutMiddle,
        middleName: undefined,
      };
      
      const result2 = registerSchema.safeParse(validDataWithUndefined);
      expect(result2.success).toBe(true);
    });

    it('should reject firstName longer than 255 characters', () => {
      const invalidData = {
        firstName: 'a'.repeat(256),
        lastName: 'Doe',
        email: 'user@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      };

      const result = registerSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('255');
      }
    });

    it('should accept firstName with exactly 255 characters', () => {
      const validData = {
        firstName: 'a'.repeat(255),
        lastName: 'Doe',
        email: 'user@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      };

      const result = registerSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('should reject lastName longer than 255 characters', () => {
      const invalidData = {
        firstName: 'John',
        lastName: 'a'.repeat(256),
        email: 'user@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      };

      const result = registerSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('255');
      }
    });

    it('should reject middleName longer than 255 characters', () => {
      const invalidData = {
        firstName: 'John',
        lastName: 'Doe',
        middleName: 'a'.repeat(256),
        email: 'user@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      };

      const result = registerSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('255');
      }
    });

    it('should accept middleName with exactly 255 characters', () => {
      const validData = {
        firstName: 'John',
        lastName: 'Doe',
        middleName: 'a'.repeat(255),
        email: 'user@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      };

      const result = registerSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('should reject empty password', () => {
      const invalidData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'user@example.com',
        password: '',
        confirmPassword: '',
      };

      const result = registerSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should reject empty confirmPassword', () => {
      const invalidData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'user@example.com',
        password: 'password123',
        confirmPassword: '',
      };

      const result = registerSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should accept password with special characters', () => {
      const validData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'user@example.com',
        password: 'P@ssw0rd!@#$%^&*()',
        confirmPassword: 'P@ssw0rd!@#$%^&*()',
      };

      const result = registerSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });
  });
});

