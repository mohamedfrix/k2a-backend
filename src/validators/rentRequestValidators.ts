import Joi from 'joi';
import { RentRequestStatus } from '@/types/rentRequest';

/**
 * Joi Validation Schemas for Rent Request Operations
 * Comprehensive validation rules for all rent request endpoints
 */

// Base validation schemas
export const phoneRegex = /^(\+213|0)[1-9](\d{8})$/; // Algerian phone format
export const emailSchema = Joi.string().email().lowercase().trim().required();
export const phoneSchema = Joi.string().pattern(phoneRegex).required();
export const nameSchema = Joi.string().min(2).max(255).trim().required();
export const dateSchema = Joi.date().iso().required();

/**
 * Validation for creating a new rent request
 */
export const createRentRequestSchema = Joi.object({
  clientName: nameSchema.messages({
    'string.min': 'Le nom du client doit contenir au moins 2 caractères',
    'string.max': 'Le nom du client ne peut pas dépasser 255 caractères',
    'any.required': 'Le nom du client est obligatoire',
  }),

  clientEmail: emailSchema.messages({
    'string.email': 'Veuillez fournir une adresse email valide',
    'any.required': 'L\'adresse email est obligatoire',
  }),

  clientPhone: phoneSchema.messages({
    'string.pattern.base': 'Veuillez fournir un numéro de téléphone algérien valide (ex: +213xxxxxxxxx ou 0xxxxxxxxx)',
    'any.required': 'Le numéro de téléphone est obligatoire',
  }),

  startDate: dateSchema
    .min('now')
    .messages({
      'date.min': 'La date de début doit être dans le futur',
      'any.required': 'La date de début est obligatoire',
    }),

  endDate: dateSchema
    .min(Joi.ref('startDate'))
    .messages({
      'date.min': 'La date de fin doit être postérieure à la date de début',
      'any.required': 'La date de fin est obligatoire',
    }),

  message: Joi.string()
    .max(1000)
    .trim()
    .allow('')
    .optional()
    .messages({
      'string.max': 'Le message ne peut pas dépasser 1000 caractères',
    }),

  vehicleId: Joi.string().required().messages({
    'any.required': 'L\'identifiant du véhicule est obligatoire',
  }),
}).custom((value, helpers) => {
  // Custom validation for rental duration
  const { startDate, endDate } = value;
  if (startDate && endDate) {
    const diffTime = new Date(endDate).getTime() - new Date(startDate).getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 90) {
      return helpers.error('custom.maxRentalDays');
    }
    
    if (diffDays < 1) {
      return helpers.error('custom.minRentalDays');
    }
  }
  
  return value;
}, 'Rental duration validation').messages({
  'custom.maxRentalDays': 'La durée de location ne peut pas dépasser 90 jours',
  'custom.minRentalDays': 'La durée de location doit être d\'au moins 1 jour',
});

/**
 * Validation for updating a rent request (admin only)
 */
export const updateRentRequestSchema = Joi.object({
  status: Joi.string()
    .valid(...Object.values(RentRequestStatus))
    .messages({
      'any.only': 'Statut invalide. Les valeurs autorisées sont: PENDING, REVIEWED, APPROVED, REJECTED, CONTACTED',
    }),

  adminNotes: Joi.string()
    .max(2000)
    .trim()
    .allow('')
    .messages({
      'string.max': 'Les notes administrateur ne peuvent pas dépasser 2000 caractères',
    }),

  reviewedBy: Joi.string()
    .max(255)
    .trim()
    .messages({
      'string.max': 'Le nom du réviseur ne peut pas dépasser 255 caractères',
    }),
}).min(1).messages({
  'object.min': 'Au moins un champ doit être fourni pour la mise à jour',
});

/**
 * Validation for rent request query filters
 */
export const rentRequestFiltersSchema = Joi.object({
  status: Joi.string()
    .valid(...Object.values(RentRequestStatus))
    .messages({
      'any.only': 'Statut invalide pour le filtrage',
    }),

  clientEmail: emailSchema.optional(),

  vehicleId: Joi.string().optional(),

  startDate: Joi.date().iso().optional(),

  endDate: Joi.date().iso().min(Joi.ref('startDate')).optional().messages({
    'date.min': 'La date de fin doit être postérieure à la date de début',
  }),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20)
    .messages({
      'number.min': 'La limite doit être d\'au moins 1',
      'number.max': 'La limite ne peut pas dépasser 100',
    }),

  offset: Joi.number()
    .integer()
    .min(0)
    .default(0)
    .messages({
      'number.min': 'L\'offset ne peut pas être négatif',
    }),

  sortBy: Joi.string()
    .valid('createdAt', 'updatedAt', 'startDate', 'endDate')
    .default('createdAt')
    .messages({
      'any.only': 'Champ de tri invalide. Utilisez: createdAt, updatedAt, startDate, endDate',
    }),

  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
    .messages({
      'any.only': 'Ordre de tri invalide. Utilisez: asc ou desc',
    }),
});

/**
 * Validation for rent request ID parameter
 */
export const rentRequestIdSchema = Joi.object({
  id: Joi.string().required().messages({
    'any.required': 'L\'identifiant de la demande est obligatoire',
  }),
});

/**
 * Custom validation functions
 */

/**
 * Validate business hours for booking (8 AM to 8 PM)
 */
export const validateBusinessHours = (date: Date): boolean => {
  const hour = date.getHours();
  return hour >= 8 && hour <= 20;
};

/**
 * Validate minimum advance booking time (24 hours)
 */
export const validateAdvanceBooking = (startDate: Date): boolean => {
  const now = new Date();
  const diffHours = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  return diffHours >= 24;
};

/**
 * Validate weekdays only (no weekends)
 */
export const validateWeekdays = (date: Date): boolean => {
  const dayOfWeek = date.getDay();
  return dayOfWeek >= 1 && dayOfWeek <= 5; // Monday to Friday
};

/**
 * Enhanced validation with business rules
 */
export const createRentRequestWithBusinessRulesSchema = createRentRequestSchema.custom((value, helpers) => {
  const { startDate, endDate } = value;

  if (startDate) {
    // Check minimum advance booking
    if (!validateAdvanceBooking(new Date(startDate))) {
      return helpers.error('custom.advanceBooking');
    }
  }

  return value;
}, 'Business rules validation').messages({
  'custom.advanceBooking': 'La réservation doit être effectuée au moins 24 heures à l\'avance',
});

/**
 * Validation middleware helper
 */
export const validateSchema = (schema: Joi.ObjectSchema) => {
  return (data: any) => {
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(', ');
      
      throw new Error(`Erreur de validation: ${errorMessage}`);
    }

    return value;
  };
};

// Pre-configured validation functions
export const validateCreateRentRequest = validateSchema(createRentRequestWithBusinessRulesSchema);
export const validateUpdateRentRequest = validateSchema(updateRentRequestSchema);
export const validateRentRequestFilters = validateSchema(rentRequestFiltersSchema);
export const validateRentRequestId = validateSchema(rentRequestIdSchema);
