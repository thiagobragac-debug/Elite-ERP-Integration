import { describe, it, expect } from 'vitest';
import {
  isValidUUID,
  cleanUUID,
  isValidCPF,
  isValidCNPJ,
  isValidDocument,
  isValidEmail,
  isValidPhone,
} from './validation';

describe('isValidUUID', () => {
  it('should return true for valid UUID v4', () => {
    expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    expect(isValidUUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8')).toBe(true);
    expect(isValidUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
  });

  it('should return false for invalid UUID format', () => {
    expect(isValidUUID('550e8400-e29b-41d4-a716')).toBe(false);
    expect(isValidUUID('not-a-uuid')).toBe(false);
    expect(isValidUUID('123456')).toBe(false);
    expect(isValidUUID('550e8400e29b41d4a716446655440000')).toBe(false); // No hyphens
  });

  it('should return false for null or undefined', () => {
    expect(isValidUUID(null)).toBe(false);
    expect(isValidUUID(undefined)).toBe(false);
  });

  it('should return false for empty string', () => {
    expect(isValidUUID('')).toBe(false);
  });

  it('should handle uppercase and lowercase UUIDs', () => {
    expect(isValidUUID('550E8400-E29B-41D4-A716-446655440000')).toBe(true);
    expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
  });
});

describe('cleanUUID', () => {
  it('should return valid UUID as-is', () => {
    const validUUID = '550e8400-e29b-41d4-a716-446655440000';
    expect(cleanUUID(validUUID)).toBe(validUUID);
  });

  it('should return null for invalid UUID', () => {
    expect(cleanUUID('not-a-uuid')).toBe(null);
    expect(cleanUUID('123456')).toBe(null);
    expect(cleanUUID('')).toBe(null);
  });

  it('should return null for null or undefined', () => {
    expect(cleanUUID(null)).toBe(null);
    expect(cleanUUID(undefined)).toBe(null);
  });
});

describe('isValidCPF', () => {
  it('should return true for valid CPF with formatting', () => {
    expect(isValidCPF('123.456.789-09')).toBe(true);
    expect(isValidCPF('111.444.777-35')).toBe(true);
  });

  it('should return true for valid CPF without formatting', () => {
    expect(isValidCPF('12345678909')).toBe(true);
    expect(isValidCPF('11144477735')).toBe(true);
  });

  it('should return false for invalid CPF check digits', () => {
    expect(isValidCPF('123.456.789-00')).toBe(false);
    expect(isValidCPF('12345678900')).toBe(false);
  });

  it('should return false for CPF with all same digits', () => {
    expect(isValidCPF('111.111.111-11')).toBe(false);
    expect(isValidCPF('00000000000')).toBe(false);
    expect(isValidCPF('99999999999')).toBe(false);
  });

  it('should return false for CPF with wrong length', () => {
    expect(isValidCPF('123.456.789')).toBe(false);
    expect(isValidCPF('123456789')).toBe(false);
    expect(isValidCPF('123.456.789-091')).toBe(false);
  });

  it('should return false for empty string', () => {
    expect(isValidCPF('')).toBe(false);
  });

  it('should handle CPF with various separators', () => {
    expect(isValidCPF('123 456 789 09')).toBe(true);
    expect(isValidCPF('123-456-789-09')).toBe(true);
  });
});

describe('isValidCNPJ', () => {
  it('should return true for valid CNPJ with formatting', () => {
    expect(isValidCNPJ('11.222.333/0001-81')).toBe(true);
    expect(isValidCNPJ('34.028.316/0001-03')).toBe(true);
  });

  it('should return true for valid CNPJ without formatting', () => {
    expect(isValidCNPJ('11222333000181')).toBe(true);
    expect(isValidCNPJ('34028316000103')).toBe(true);
  });

  it('should return false for invalid CNPJ check digits', () => {
    expect(isValidCNPJ('11.222.333/0001-00')).toBe(false);
    expect(isValidCNPJ('11222333000100')).toBe(false);
  });

  it('should return false for CNPJ with all same digits', () => {
    expect(isValidCNPJ('11.111.111/1111-11')).toBe(false);
    expect(isValidCNPJ('00000000000000')).toBe(false);
    expect(isValidCNPJ('99999999999999')).toBe(false);
  });

  it('should return false for CNPJ with wrong length', () => {
    expect(isValidCNPJ('11.222.333/0001')).toBe(false);
    expect(isValidCNPJ('112223330001')).toBe(false);
    expect(isValidCNPJ('11.222.333/0001-811')).toBe(false);
  });

  it('should return false for empty string', () => {
    expect(isValidCNPJ('')).toBe(false);
  });

  it('should handle CNPJ with various separators', () => {
    expect(isValidCNPJ('11 222 333 0001 81')).toBe(true);
    expect(isValidCNPJ('11-222-333-0001-81')).toBe(true);
  });

  it('should validate real CNPJ examples', () => {
    // Valid CNPJ examples
    expect(isValidCNPJ('00.000.000/0001-91')).toBe(true);
    expect(isValidCNPJ('11.444.777/0001-61')).toBe(true);
  });
});

describe('isValidDocument', () => {
  it('should return true for valid CPF (11 digits)', () => {
    expect(isValidDocument('123.456.789-09')).toBe(true);
    expect(isValidDocument('12345678909')).toBe(true);
  });

  it('should return true for valid CNPJ (14 digits)', () => {
    expect(isValidDocument('11.222.333/0001-81')).toBe(true);
    expect(isValidDocument('11222333000181')).toBe(true);
  });

  it('should return false for invalid CPF', () => {
    expect(isValidDocument('123.456.789-00')).toBe(false);
    expect(isValidDocument('11111111111')).toBe(false);
  });

  it('should return false for invalid CNPJ', () => {
    expect(isValidDocument('11.222.333/0001-00')).toBe(false);
    expect(isValidDocument('00000000000000')).toBe(false);
  });

  it('should return true for empty document', () => {
    // Empty documents are allowed (validation handled elsewhere if required)
    expect(isValidDocument('')).toBe(true);
  });

  it('should return false for document with invalid length', () => {
    expect(isValidDocument('123456789')).toBe(false); // 9 digits
    expect(isValidDocument('123456789012')).toBe(false); // 12 digits
    expect(isValidDocument('123456789012345')).toBe(false); // 15 digits
  });
});

describe('isValidEmail', () => {
  it('should return true for valid email addresses', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('test.email@domain.co')).toBe(true);
    expect(isValidEmail('firstname.lastname@company.com.br')).toBe(true);
    expect(isValidEmail('user+tag@example.com')).toBe(true);
    expect(isValidEmail('admin@subdomain.example.org')).toBe(true);
  });

  it('should return false for invalid email addresses', () => {
    expect(isValidEmail('invalid.email')).toBe(false);
    expect(isValidEmail('@example.com')).toBe(false);
    expect(isValidEmail('user@')).toBe(false);
    expect(isValidEmail('user @example.com')).toBe(false); // Space
    expect(isValidEmail('user@example')).toBe(false); // No TLD
  });

  it('should return false for empty string', () => {
    expect(isValidEmail('')).toBe(false);
  });

  it('should trim whitespace and validate', () => {
    expect(isValidEmail('  user@example.com  ')).toBe(true);
    expect(isValidEmail(' user@example.com')).toBe(true);
    expect(isValidEmail('user@example.com ')).toBe(true);
  });

  it('should return false for email with multiple @ symbols', () => {
    expect(isValidEmail('user@@example.com')).toBe(false);
    expect(isValidEmail('user@domain@example.com')).toBe(false);
  });

  it('should return false for email with no domain extension', () => {
    expect(isValidEmail('user@domain')).toBe(false);
  });
});

describe('isValidPhone', () => {
  it('should return true for valid Brazilian landline (10 digits)', () => {
    expect(isValidPhone('(11) 1234-5678')).toBe(true);
    expect(isValidPhone('1112345678')).toBe(true);
    expect(isValidPhone('(47) 3333-4444')).toBe(true);
  });

  it('should return true for valid Brazilian mobile (11 digits)', () => {
    expect(isValidPhone('(11) 91234-5678')).toBe(true);
    expect(isValidPhone('11912345678')).toBe(true);
    expect(isValidPhone('(47) 99999-8888')).toBe(true);
  });

  it('should return false for phone with wrong length', () => {
    expect(isValidPhone('123456789')).toBe(false); // 9 digits
    expect(isValidPhone('12345678')).toBe(false); // 8 digits
    expect(isValidPhone('123456789012')).toBe(false); // 12 digits
  });

  it('should return false for empty string', () => {
    expect(isValidPhone('')).toBe(false);
  });

  it('should handle various phone formats', () => {
    expect(isValidPhone('11 1234-5678')).toBe(true);
    expect(isValidPhone('(11)12345678')).toBe(true);
    expect(isValidPhone('11-1234-5678')).toBe(true);
    expect(isValidPhone('(11) 9 1234-5678')).toBe(true); // Space in mobile
  });

  it('should return false for phone with letters', () => {
    expect(isValidPhone('(11) ABCD-EFGH')).toBe(false);
    expect(isValidPhone('11abc345678')).toBe(false);
  });

  it('should validate real phone examples', () => {
    // Real Brazilian phone patterns
    expect(isValidPhone('(11) 3456-7890')).toBe(true); // São Paulo landline
    expect(isValidPhone('(21) 98765-4321')).toBe(true); // Rio mobile
    expect(isValidPhone('(47) 3333-4444')).toBe(true); // SC landline
    expect(isValidPhone('(85) 99876-5432')).toBe(true); // CE mobile
  });
});
