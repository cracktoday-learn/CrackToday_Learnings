// ============================================================================
// SECURITY UTILITIES
// Input sanitization, validation, and security helpers
// ============================================================================

// XSS Prevention - Sanitize user input
export function sanitizeInput(input: string): string {
  if (!input) return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/\\/g, '&#x5C;')
    .replace(/`/g, '&#96;');
}

// Sanitize object recursively
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate strong password
export function isStrongPassword(password: string): boolean {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
}

// Validate mobile number (Indian format)
export function isValidMobile(mobile: string): boolean {
  const mobileRegex = /^[6-9]\d{9}$/;
  return mobileRegex.test(mobile);
}

// Validate name (letters, spaces, and common name characters only)
export function isValidName(name: string): boolean {
  const nameRegex = /^[a-zA-Z\s\.'-]{2,50}$/;
  return nameRegex.test(name);
}

// Prevent SQL injection patterns
export function containsSqlInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|INTO|FROM|WHERE|AND|OR)\b)/i,
    /(--|;|\/\*|\*\/|xp_|sp_)/i,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
    /(\b(OR|AND)\s+'[^']*'\s*=\s*'[^']*')/i,
  ];
  return sqlPatterns.some(pattern => pattern.test(input));
}

// Check for common XSS patterns
export function containsXssPatterns(input: string): boolean {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
    /eval\s*\(/gi,
    /expression\s*\(/gi,
  ];
  return xssPatterns.some(pattern => pattern.test(input));
}

// Rate limiting helper (client-side with localStorage backup)
const RATE_LIMIT_PREFIX = 'rate_limit_';

export function checkClientRateLimit(
  action: string,
  maxAttempts: number = 5,
  windowMinutes: number = 15
): { allowed: boolean; remaining: number; resetAt: number } {
  const key = `${RATE_LIMIT_PREFIX}${action}`;
  const now = Date.now();
  const windowMs = windowMinutes * 60 * 1000;
  
  const stored = localStorage.getItem(key);
  let attempts: { count: number; firstAttempt: number; blockedUntil?: number };
  
  if (stored) {
    attempts = JSON.parse(stored);
    
    // Check if currently blocked
    if (attempts.blockedUntil && attempts.blockedUntil > now) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: attempts.blockedUntil
      };
    }
    
    // Check if window has expired
    if (now - attempts.firstAttempt > windowMs) {
      attempts = { count: 0, firstAttempt: now };
    }
  } else {
    attempts = { count: 0, firstAttempt: now };
  }
  
  attempts.count++;
  
  // Check if over limit
  if (attempts.count > maxAttempts) {
    const blockedUntil = now + (30 * 60 * 1000); // Block for 30 minutes
    attempts.blockedUntil = blockedUntil;
    localStorage.setItem(key, JSON.stringify(attempts));
    
    return {
      allowed: false,
      remaining: 0,
      resetAt: blockedUntil
    };
  }
  
  localStorage.setItem(key, JSON.stringify(attempts));
  
  return {
    allowed: true,
    remaining: maxAttempts - attempts.count,
    resetAt: attempts.firstAttempt + windowMs
  };
}

// Clear rate limit for an action
export function clearRateLimit(action: string): void {
  localStorage.removeItem(`${RATE_LIMIT_PREFIX}${action}`);
}

// Generate secure random token
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Hash sensitive data (simple hash for non-password use)
export async function hashData(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Validate file upload
export function isValidFileUpload(
  file: File,
  allowedTypes: string[],
  maxSizeMB: number
): { valid: boolean; error?: string } {
  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: `Invalid file type. Allowed: ${allowedTypes.join(', ')}` };
  }
  
  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return { valid: false, error: `File too large. Maximum size: ${maxSizeMB}MB` };
  }
  
  // Check for empty file
  if (file.size === 0) {
    return { valid: false, error: 'File is empty' };
  }
  
  return { valid: true };
}

// Secure storage wrapper
export const secureStorage = {
  set(key: string, value: string, expiresInMinutes?: number): void {
    const item = {
      value,
      timestamp: Date.now(),
      expires: expiresInMinutes ? Date.now() + expiresInMinutes * 60 * 1000 : null
    };
    sessionStorage.setItem(key, JSON.stringify(item));
  },
  
  get(key: string): string | null {
    const stored = sessionStorage.getItem(key);
    if (!stored) return null;
    
    const item = JSON.parse(stored);
    
    if (item.expires && Date.now() > item.expires) {
      sessionStorage.removeItem(key);
      return null;
    }
    
    return item.value;
  },
  
  remove(key: string): void {
    sessionStorage.removeItem(key);
  },
  
  clear(): void {
    sessionStorage.clear();
  }
};

// Detect suspicious activity patterns
export function detectSuspiciousActivity(
  action: string,
  data: Record<string, any>
): { suspicious: boolean; reasons: string[] } {
  const reasons: string[] = [];
  
  // Check for rapid multiple submissions
  const rateCheck = checkClientRateLimit(`suspicious_${action}`, 10, 1);
  if (!rateCheck.allowed) {
    reasons.push('Too many rapid requests');
  }
  
  // Check for suspicious input patterns
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      if (containsSqlInjection(value)) {
        reasons.push(`SQL injection pattern detected in ${key}`);
      }
      if (containsXssPatterns(value)) {
        reasons.push(`XSS pattern detected in ${key}`);
      }
    }
  }
  
  return {
    suspicious: reasons.length > 0,
    reasons
  };
}

// Log security event
export function logSecurityEvent(
  event: string,
  details: Record<string, any>,
  severity: 'low' | 'medium' | 'high' | 'critical' = 'low'
): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    details,
    severity,
    userAgent: navigator.userAgent,
    url: window.location.href
  };
  
  // Log to console in development
  if (import.meta.env?.DEV) {
    console.warn('[Security Event]', logEntry);
  }
  
  // Send to server (async)
  fetch('/api/security/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(logEntry),
    keepalive: true
  }).catch(() => {
    // Silently fail - don't break user experience
  });
}
