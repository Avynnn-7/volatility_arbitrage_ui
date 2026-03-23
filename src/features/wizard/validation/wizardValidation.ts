import { z } from 'zod';
import type { WizardStep } from '@/types';

// =============================================================================
// STEP 1: Data Upload Validation
// =============================================================================

export const quoteInputSchema = z.object({
  strike: z.number().positive('Strike must be positive'),
  maturity: z.number().positive('Maturity must be positive'),
  impliedVol: z.number().positive('Implied vol must be positive').max(5, 'Implied vol seems too high (>500%)'),
  optionType: z.enum(['call', 'put']).optional(),
  bid: z.number().nonnegative().optional(),
  ask: z.number().nonnegative().optional(),
  mid: z.number().nonnegative().optional(),
});

export const step1Schema = z.object({
  parsedQuotes: z.array(quoteInputSchema).min(1, 'At least one data point required'),
  fileName: z.string().optional(),
  rawData: z.string().optional(),
});

export type Step1Data = z.infer<typeof step1Schema>;

// =============================================================================
// STEP 2: Configuration Validation
// =============================================================================

export const step2Schema = z.object({
  spotPrice: z.number().positive('Spot price must be positive'),
  riskFreeRate: z.number().min(-0.1, 'Rate cannot be below -10%').max(0.5, 'Rate cannot exceed 50%'),
  dividendYield: z.number().min(0, 'Yield cannot be negative').max(0.2, 'Yield cannot exceed 20%'),
  selectedStrikes: z.array(z.number()).min(3, 'Select at least 3 strikes for meaningful analysis'),
  selectedMaturities: z.array(z.number()).min(2, 'Select at least 2 maturities'),
  interpolationMethod: z.enum(['linear', 'cubic', 'spline']).optional(),
});

export type Step2Data = z.infer<typeof step2Schema>;

// =============================================================================
// STEP 3: Arbitrage Detection Validation (Optional - can be skipped)
// =============================================================================

export const arbitrageSettingsSchema = z.object({
  checkCalendar: z.boolean(),
  checkButterfly: z.boolean(),
  checkVertical: z.boolean(),
  toleranceCalendar: z.number().min(0),
  toleranceButterfly: z.number().min(0),
  toleranceVertical: z.number().min(0),
});

export const arbitrageResultSchema = z.object({
  id: z.string(),
  type: z.enum(['calendar', 'butterfly', 'vertical']),
  strike1: z.number().optional(),
  strike2: z.number().optional(),
  strike3: z.number().optional(),
  maturity1: z.number().optional(),
  maturity2: z.number().optional(),
  severity: z.number().min(0).max(1),
  expectedProfit: z.number().optional(),
  description: z.string().optional(),
});

export const step3Schema = z.object({
  arbitrageSettings: arbitrageSettingsSchema.optional(),
  arbitrageResults: z.array(arbitrageResultSchema).optional(),
  hasRun: z.boolean().optional(),
});

export type Step3Data = z.infer<typeof step3Schema>;

// =============================================================================
// STEP 4: QP Correction Validation (Optional - can be skipped)
// =============================================================================

export const qpSettingsSchema = z.object({
  regularizationStrength: z.number().positive(),
  preserveAtm: z.boolean(),
  maxIterations: z.number().int().positive().max(100000),
  tolerance: z.number().positive(),
  smoothnessWeight: z.number().min(0).max(1),
  penaltyMethod: z.enum(['quadratic', 'linear', 'huber']).optional(),
});

export const correctionResultSchema = z.object({
  success: z.boolean(),
  iterations: z.number().int().nonnegative(),
  residual: z.number().nonnegative(),
  violationsRemoved: z.number().int().nonnegative(),
  totalViolations: z.number().int().nonnegative().optional(),
  maxAdjustment: z.number().nonnegative(),
  avgAdjustment: z.number().nonnegative().optional(),
});

export const step4Schema = z.object({
  qpSettings: qpSettingsSchema.optional(),
  qpResult: correctionResultSchema.optional(),
  correctedSurface: z.array(quoteInputSchema).optional(),
});

export type Step4Data = z.infer<typeof step4Schema>;

// =============================================================================
// STEP 5: Results (No validation needed - display only)
// =============================================================================

export const step5Schema = z.object({}).optional();

export type Step5Data = z.infer<typeof step5Schema>;

// =============================================================================
// COMBINED WIZARD DATA SCHEMA
// =============================================================================

export const wizardDataSchema = z.object({
  step1: step1Schema.optional(),
  step2: step2Schema.optional(),
  step3: step3Schema.optional(),
  step4: step4Schema.optional(),
  step5: step5Schema.optional(),
});

export type WizardData = z.infer<typeof wizardDataSchema>;

// =============================================================================
// VALIDATION UTILITIES
// =============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  fieldErrors?: Record<string, string[]>;
}

/**
 * Validate data for a specific step
 */
export function validateStep(step: number | WizardStep, data: unknown): ValidationResult {
  const stepNumber = typeof step === 'number' ? step : getStepNumber(step);
  
  try {
    switch (stepNumber) {
      case 1:
        step1Schema.parse(data);
        break;
      case 2:
        step2Schema.parse(data);
        break;
      case 3:
        step3Schema.parse(data);
        break;
      case 4:
        step4Schema.parse(data);
        break;
      case 5:
        // Step 5 is always valid (display only)
        break;
      default:
        return { valid: false, errors: ['Unknown step'] };
    }
    return { valid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors: Record<string, string[]> = {};
      const errors: string[] = [];
      
      for (const issue of error.issues) {
        const path = issue.path.join('.');
        const message = issue.message;
        errors.push(path ? `${path}: ${message}` : message);
        
        if (path) {
          if (!fieldErrors[path]) {
            fieldErrors[path] = [];
          }
          fieldErrors[path].push(message);
        }
      }
      
      return { valid: false, errors, fieldErrors };
    }
    return { valid: false, errors: ['Unknown validation error'] };
  }
}

/**
 * Check if a step can be skipped
 */
export function canSkipStep(step: number | WizardStep): boolean {
  const stepNumber = typeof step === 'number' ? step : getStepNumber(step);
  // Steps 3 (arbitrage detection) and 4 (QP correction) can be skipped
  return stepNumber === 3 || stepNumber === 4;
}

/**
 * Check if all required data for a step is present
 */
export function isStepDataComplete(step: number | WizardStep, data: unknown): boolean {
  const result = validateStep(step, data);
  return result.valid;
}

/**
 * Get step number from step ID
 */
function getStepNumber(step: WizardStep): number {
  const stepMap: Record<WizardStep, number> = {
    'data-input': 1,
    'surface-preview': 2,
    'arbitrage-detection': 3,
    'correction': 4,
    'export': 5,
  };
  return stepMap[step] || 0;
}

/**
 * Get step ID from step number
 */
export function getStepId(stepNumber: number): WizardStep | null {
  const stepMap: Record<number, WizardStep> = {
    1: 'data-input',
    2: 'surface-preview',
    3: 'arbitrage-detection',
    4: 'correction',
    5: 'export',
  };
  return stepMap[stepNumber] || null;
}

/**
 * Validate parsed quote data (for file upload)
 */
export function validateParsedQuotes(data: unknown[]): ValidationResult {
  const errors: string[] = [];
  
  if (!Array.isArray(data)) {
    return { valid: false, errors: ['Data must be an array'] };
  }
  
  if (data.length === 0) {
    return { valid: false, errors: ['No data points found'] };
  }
  
  // Check required fields
  const requiredFields = ['strike', 'maturity', 'impliedVol'];
  const missingFields = new Set<string>();
  
  for (let i = 0; i < Math.min(data.length, 10); i++) {
    const row = data[i] as Record<string, unknown>;
    for (const field of requiredFields) {
      if (!(field in row) || row[field] === null || row[field] === undefined) {
        missingFields.add(field);
      }
    }
  }
  
  if (missingFields.size > 0) {
    errors.push(`Missing required fields: ${Array.from(missingFields).join(', ')}`);
  }
  
  // Validate each row
  let invalidRows = 0;
  for (let i = 0; i < data.length; i++) {
    try {
      quoteInputSchema.parse(data[i]);
    } catch {
      invalidRows++;
    }
  }
  
  if (invalidRows > 0) {
    errors.push(`${invalidRows} row(s) have invalid data`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize and normalize quote data
 */
export function sanitizeQuoteData(
  data: Record<string, unknown>[]
): Array<z.infer<typeof quoteInputSchema>> {
  return data.map((row) => ({
    strike: Number(row.strike) || 0,
    maturity: Number(row.maturity) || 0,
    impliedVol: Number(row.impliedVol || row.implied_vol || row.iv) || 0,
    optionType: (row.optionType || row.option_type || row.type || 'call') as 'call' | 'put',
    bid: row.bid ? Number(row.bid) : undefined,
    ask: row.ask ? Number(row.ask) : undefined,
    mid: row.mid ? Number(row.mid) : undefined,
  })).filter((row) => row.strike > 0 && row.maturity > 0 && row.impliedVol > 0);
}
