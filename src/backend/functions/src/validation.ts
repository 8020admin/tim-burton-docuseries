/**
 * Input validation utilities for production security
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate email format
 */
export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];
  
  if (!email) {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Invalid email format');
  } else if (email.length > 254) {
    errors.push('Email is too long');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): ValidationResult {
  const errors: string[] = [];
  
  if (!password) {
    errors.push('Password is required');
  } else {
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (password.length > 128) {
      errors.push('Password is too long');
    }
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/(?=.*\d)/.test(password)) {
      errors.push('Password must contain at least one number');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate Stripe webhook payload
 */
export function validateStripeWebhook(event: any): ValidationResult {
  const errors: string[] = [];
  
  if (!event) {
    errors.push('Event payload is required');
    return { isValid: false, errors };
  }
  
  if (!event.id) {
    errors.push('Event ID is required');
  }
  
  if (!event.type) {
    errors.push('Event type is required');
  }
  
  if (!event.data) {
    errors.push('Event data is required');
  }
  
  if (!event.data?.object) {
    errors.push('Event data object is required');
  }
  
  // Validate event ID format (Stripe event IDs start with evt_)
  if (event.id && !event.id.startsWith('evt_')) {
    errors.push('Invalid event ID format');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
    .substring(0, 1000); // Limit length
}

/**
 * Validate purchase amount
 */
export function validatePurchaseAmount(amount: number): ValidationResult {
  const errors: string[] = [];
  
  if (typeof amount !== 'number') {
    errors.push('Amount must be a number');
  } else if (amount < 0) {
    errors.push('Amount cannot be negative');
  } else if (amount > 100000) { // $1000 max
    errors.push('Amount exceeds maximum limit');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate user ID format
 */
export function validateUserId(userId: string): ValidationResult {
  const errors: string[] = [];
  
  if (!userId) {
    errors.push('User ID is required');
  } else if (typeof userId !== 'string') {
    errors.push('User ID must be a string');
  } else if (userId.length < 10 || userId.length > 50) {
    errors.push('User ID has invalid length');
  } else if (!/^[a-zA-Z0-9_-]+$/.test(userId)) {
    errors.push('User ID contains invalid characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
