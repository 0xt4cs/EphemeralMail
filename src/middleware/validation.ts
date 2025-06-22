import Joi from 'joi';

export const emailValidation = {
  // Validate email generation request
  generateEmail: Joi.object({
    customPrefix: Joi.string().alphanum().min(3).max(20).optional(),
  }),

  // Validate email list query parameters
  getEmails: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    search: Joi.string().max(100).optional(),
    unreadOnly: Joi.boolean().default(false),
  }),
  // Validate email address parameter
  emailAddress: Joi.object({
    address: Joi.string().pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+$/).required(),
  }),
  // Validate email ID parameter
  emailId: Joi.object({
    id: Joi.string().required(),
  }),

  // Validate manual email creation
  manualEmail: Joi.object({
    prefix: Joi.string()
      .pattern(/^[a-zA-Z0-9._+-]+$/)
      .min(1)
      .max(64)
      .custom((value, helpers) => {
        // Check for consecutive dots or dots at start/end
        if (value.includes('..') || value.startsWith('.') || value.endsWith('.')) {
          return helpers.error('string.format');
        }
        return value;
      })
      .required()
      .messages({
        'string.pattern.base': 'Prefix can only contain letters, numbers, dots (.), hyphens (-), underscores (_), and plus signs (+)',
        'string.format': 'Prefix cannot have consecutive dots or start/end with dots',
        'string.min': 'Prefix must be at least 1 character long',
        'string.max': 'Prefix cannot exceed 64 characters'
      }),
  }),
};

export const adminValidation = {
  // Validate blacklist domain request
  blacklistDomain: Joi.object({
    domain: Joi.string().domain().required(),
    reason: Joi.string().max(255).optional(),
  }),

  // Validate admin stats query
  getStats: Joi.object({
    days: Joi.number().integer().min(1).max(90).default(7),
  }),
};
