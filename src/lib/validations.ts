import { z } from 'zod';

// Surface upload validation
export const surfaceUploadSchema = z.object({
  ticker: z.string().min(1, 'Ticker is required').max(10, 'Ticker too long'),
  spotPrice: z.number().positive('Spot price must be positive'),
  riskFreeRate: z.number().min(-0.1, 'Rate too low').max(0.5, 'Rate too high'),
  dividendYield: z.number().min(0, 'Dividend yield cannot be negative').max(0.2, 'Dividend yield too high'),
});

export type SurfaceUploadFormData = z.infer<typeof surfaceUploadSchema>;

// Option data validation
export const optionDataSchema = z.object({
  strike: z.number().positive('Strike must be positive'),
  maturity: z.number().positive('Maturity must be positive'),
  impliedVol: z.number().min(0.01, 'IV too low').max(5, 'IV too high'),
  optionType: z.enum(['call', 'put']),
  bid: z.number().min(0).optional(),
  ask: z.number().min(0).optional(),
});

export type OptionDataFormData = z.infer<typeof optionDataSchema>;

// Arbitrage detection settings
export const arbitrageSettingsSchema = z.object({
  minSpread: z.number().min(0, 'Min spread cannot be negative'),
  maxMaturity: z.number().positive('Max maturity must be positive'),
  includeCalendar: z.boolean(),
  includeButterfly: z.boolean(),
  includeVertical: z.boolean(),
});

export type ArbitrageSettingsFormData = z.infer<typeof arbitrageSettingsSchema>;

// QP Correction settings
export const qpCorrectionSchema = z.object({
  regularizationStrength: z.number().min(0).max(1),
  preserveAtm: z.boolean(),
  maxIterations: z.number().int().positive().max(10000),
  tolerance: z.number().positive().max(0.01),
});

export type QPCorrectionFormData = z.infer<typeof qpCorrectionSchema>;

// Contact/feedback form (example)
export const feedbackSchema = z.object({
  email: z.string().email('Invalid email address'),
  subject: z.string().min(5, 'Subject too short').max(100, 'Subject too long'),
  message: z.string().min(20, 'Message too short').max(2000, 'Message too long'),
});

export type FeedbackFormData = z.infer<typeof feedbackSchema>;
