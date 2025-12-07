import { describe, it, expect } from 'vitest';
import { refreshTokenSchema } from './refresh-token.dto';

describe('RefreshTokenDto', () => {
  describe('refreshTokenSchema validation', () => {
    it('should validate correct refresh_token', () => {
      const validData = {
        refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
      };

      const result = refreshTokenSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should reject empty refresh_token', () => {
      const invalidData = {
        refresh_token: '',
      };

      const result = refreshTokenSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('обязателен');
      }
    });

    it('should reject missing refresh_token', () => {
      const invalidData = {};

      const result = refreshTokenSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should accept refresh_token with minimum length', () => {
      const validData = {
        refresh_token: 'a',
      };

      const result = refreshTokenSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('should accept refresh_token with special characters', () => {
      const validData = {
        refresh_token: 'token-with-special-chars-!@#$%^&*()',
      };

      const result = refreshTokenSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('should accept refresh_token with unicode characters', () => {
      const validData = {
        refresh_token: 'токен123',
      };

      const result = refreshTokenSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('should accept very long refresh_token', () => {
      const validData = {
        refresh_token: 'a'.repeat(1000),
      };

      const result = refreshTokenSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('should accept JWT-like token format', () => {
      const validData = {
        refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIn0.signature',
      };

      const result = refreshTokenSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });
  });
});

