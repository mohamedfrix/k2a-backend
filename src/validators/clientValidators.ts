import { z } from 'zod';
import { ClientStatus } from '@prisma/client';

// Helper functions for validation
const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && Boolean(dateString.match(/^\d{4}-\d{2}-\d{2}$/));
};

const isValidPhoneNumber = (phone: string): boolean => {
  // Remove all spaces and dashes for validation
  const cleanPhone = phone.replace(/[\s-]/g, '');
  
  // French phone number formats:
  // - +33 followed by 9 digits (starting with 1-9)
  // - 0 followed by 9 digits (starting with 1-9)
  const frenchRegex = /^(\+33|0)[1-9](\d{8})$/;
  
  // Algerian phone number formats:
  // - +213 followed by 9-10 digits (can start with 0, 5, 6, 7)
  // - 0 followed by 9 digits (local format)
  const algerianRegex = /^(\+213)[0-9](\d{8,9})$/;
  const algerianLocalRegex = /^0[5-7](\d{8})$/;
  
  // Generic 10-digit format (without country code)
  const genericMobileRegex = /^[0-9]{10}$/;
  
  // International format with + and 10-15 digits total
  const internationalRegex = /^\+[1-9]\d{8,14}$/;
  
  return frenchRegex.test(cleanPhone) || 
         algerianRegex.test(cleanPhone) || 
         algerianLocalRegex.test(cleanPhone) ||
         genericMobileRegex.test(cleanPhone) ||
         internationalRegex.test(cleanPhone);
};

// Base schemas for reuse
const phoneSchema = z.string()
  .min(10, 'Le numéro de téléphone doit contenir au moins 10 caractères')
  .max(20, 'Le numéro de téléphone ne peut pas dépasser 20 caractères')
  .refine(isValidPhoneNumber, {
    message: 'Format de numéro de téléphone invalide (ex: +33 6 12 34 56 78, +213 542 60 41 86, ou 0542604186)'
  });

const emailSchema = z.string()
  .email('Format d\'email invalide')
  .max(255, 'L\'email ne peut pas dépasser 255 caractères')
  .optional();

const dateStringSchema = z.string()
  .refine(isValidDate, {
    message: 'Format de date invalide (YYYY-MM-DD)'
  });

const nameSchema = z.string()
  .min(2, 'Le nom doit contenir au moins 2 caractères')
  .max(100, 'Le nom ne peut pas dépasser 100 caractères')
  .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Le nom ne peut contenir que des lettres, espaces, apostrophes et tirets');

// Create client schema
export const createClientSchema = z.object({
  nom: nameSchema,
  prenom: nameSchema,
  dateNaissance: dateStringSchema
    .refine((date) => {
      const birthDate = new Date(date);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      return age >= 16 && age <= 120;
    }, {
      message: 'L\'âge doit être compris entre 16 et 120 ans'
    }),
  telephone: phoneSchema,
  email: emailSchema,
  adresse: z.string()
    .min(10, 'L\'adresse doit contenir au moins 10 caractères')
    .max(500, 'L\'adresse ne peut pas dépasser 500 caractères'),
  datePermis: dateStringSchema
    .refine((date) => {
      const licenseDate = new Date(date);
      const today = new Date();
      return licenseDate <= today;
    }, {
      message: 'La date de permis ne peut pas être dans le futur'
    }),
  status: z.nativeEnum(ClientStatus).default(ClientStatus.ACTIF),
  numeroPermis: z.string()
    .max(50, 'Le numéro de permis ne peut pas dépasser 50 caractères')
    .optional(),
  lieuNaissance: z.string()
    .max(100, 'Le lieu de naissance ne peut pas dépasser 100 caractères')
    .optional(),
  nationalite: z.string()
    .max(50, 'La nationalité ne peut pas dépasser 50 caractères')
    .optional(),
  profession: z.string()
    .max(100, 'La profession ne peut pas dépasser 100 caractères')
    .optional()
});

// Update client schema (all fields optional except validation rules)
export const updateClientSchema = z.object({
  nom: nameSchema.optional(),
  prenom: nameSchema.optional(),
  dateNaissance: z.string()
    .optional()
    .refine((date) => {
      if (!date) return true; // Skip validation if not provided
      if (!isValidDate(date)) return false;
      const birthDate = new Date(date);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      return age >= 16 && age <= 120;
    }, {
      message: 'Format de date invalide (YYYY-MM-DD) ou âge doit être compris entre 16 et 120 ans'
    }),
  telephone: phoneSchema.optional(),
  email: emailSchema,
  adresse: z.string()
    .min(10, 'L\'adresse doit contenir au moins 10 caractères')
    .max(500, 'L\'adresse ne peut pas dépasser 500 caractères')
    .optional(),
  datePermis: z.string()
    .optional()
    .refine((date) => {
      if (!date) return true; // Skip validation if not provided
      if (!isValidDate(date)) return false;
      const licenseDate = new Date(date);
      const today = new Date();
      return licenseDate <= today;
    }, {
      message: 'Format de date invalide (YYYY-MM-DD) ou la date de permis ne peut pas être dans le futur'
    }),
  status: z.nativeEnum(ClientStatus).optional(),
  numeroPermis: z.string()
    .max(50, 'Le numéro de permis ne peut pas dépasser 50 caractères')
    .nullish(), // Accept null, undefined, or string
  lieuNaissance: z.string()
    .max(100, 'Le lieu de naissance ne peut pas dépasser 100 caractères')
    .nullish(), // Accept null, undefined, or string
  nationalite: z.string()
    .max(50, 'La nationalité ne peut pas dépasser 50 caractères')
    .nullish(), // Accept null, undefined, or string
  profession: z.string()
    .max(100, 'La profession ne peut pas dépasser 100 caractères')
    .nullish() // Accept null, undefined, or string
}).transform((data) => {
  // Clean up the data - convert empty strings to null for optional fields
  const cleaned = { ...data };
  
  if (cleaned.numeroPermis === '') cleaned.numeroPermis = null;
  if (cleaned.lieuNaissance === '') cleaned.lieuNaissance = null;
  if (cleaned.nationalite === '') cleaned.nationalite = null;
  if (cleaned.profession === '') cleaned.profession = null;
  
  return cleaned;
});

// Query schema for filtering and pagination
export const clientQuerySchema = z.object({
  page: z.string()
    .default('1')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, { message: 'Page must be greater than 0' }),
  limit: z.string()
    .default('10')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0 && val <= 100, { message: 'Limit must be between 1 and 100' }),
  search: z.string()
    .max(255, 'Search term cannot exceed 255 characters')
    .optional(),
  status: z.nativeEnum(ClientStatus).optional(),
  sortBy: z.enum(['nom', 'prenom', 'dateNaissance', 'datePermis', 'createdAt'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

// Status update schema
export const clientStatusSchema = z.object({
  status: z.nativeEnum(ClientStatus)
});

// Bulk status update schema
export const bulkClientStatusSchema = z.object({
  clientIds: z.array(z.string().cuid('Invalid client ID format')),
  status: z.nativeEnum(ClientStatus)
});

// Search schema
export const clientSearchSchema = z.object({
  query: z.string()
    .min(2, 'Search query must be at least 2 characters')
    .max(255, 'Search query cannot exceed 255 characters'),
  limit: z.string()
    .default('10')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0 && val <= 50, { message: 'Limit must be between 1 and 50' })
});

// Export input types for use in services
export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type ClientQueryInput = z.infer<typeof clientQuerySchema>;
export type ClientStatusInput = z.infer<typeof clientStatusSchema>;
export type BulkClientStatusInput = z.infer<typeof bulkClientStatusSchema>;
export type ClientSearchInput = z.infer<typeof clientSearchSchema>;

// Custom validation functions
export const validateClientDates = (dateNaissance: string, datePermis: string): boolean => {
  const birthDate = new Date(dateNaissance);
  const licenseDate = new Date(datePermis);
  
  // License date should be at least 16 years after birth date (minimum driving age)
  const minimumLicenseDate = new Date(birthDate);
  minimumLicenseDate.setFullYear(minimumLicenseDate.getFullYear() + 16);
  
  return licenseDate >= minimumLicenseDate;
};

// Validation for unique constraints (to be used in service layer)
export const validateUniqueEmail = async (
  email: string, 
  excludeClientId?: string,
  checkFunction?: (email: string, excludeId?: string) => Promise<boolean>
): Promise<boolean> => {
  if (!checkFunction) return true;
  return await checkFunction(email, excludeClientId);
};

export const validateUniquePhone = async (
  phone: string, 
  excludeClientId?: string,
  checkFunction?: (phone: string, excludeId?: string) => Promise<boolean>
): Promise<boolean> => {
  if (!checkFunction) return true;
  return await checkFunction(phone, excludeClientId);
};