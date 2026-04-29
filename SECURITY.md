# CrackToday Security Guide

## Overview
This document outlines the comprehensive security measures implemented to protect the CrackToday platform from hacking attempts and data breaches.

## Security Layers

### 1. Database Security (RLS - Row Level Security)

All database tables have RLS policies enabled to ensure:
- **Users can only access their own data**
- **Admins have controlled access**
- **No unauthorized data exposure**

#### Key Tables Secured:
- `profiles` - User profiles
- `batches` - Exam batches
- `tests` - Test data
- `questions` - Question bank
- `purchases` - Purchase records
- `test_attempts` - Test results
- `user_roles` - Role assignments
- `coupons` - Coupon codes

**Run the SQL**: `supabase/security/001_comprehensive_rls_policies.sql`

### 2. Rate Limiting

Prevents brute force attacks and API abuse:
- **Login attempts**: 5 attempts per 15 minutes
- **Signup attempts**: 3 attempts per 15 minutes
- **API calls**: Configurable per endpoint
- **Auto-blocking**: 30-minute block after limit exceeded

**Run the SQL**: `supabase/security/002_rate_limiting.sql`

### 3. Session Security

Enhanced session management:
- **Password expiry tracking** (90 days)
- **Login attempt logging**
- **Suspicious activity detection**
- **Multi-device session tracking**
- **Auto-cleanup of expired sessions**

**Run the SQL**: `supabase/security/003_session_security.sql`

### 4. Application Security

Client-side security utilities in `src/utils/security.ts`:
- **XSS Prevention** - Input sanitization
- **SQL Injection Detection** - Pattern matching
- **Input Validation** - Email, password, mobile
- **Rate Limiting** - Client-side backup
- **Secure Storage** - Session storage wrapper
- **Suspicious Activity Detection**

### 5. Security Headers

Add to your `vercel.json` or web server config:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://api.resend.com;"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=(), payment=()"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains; preload"
        }
      ]
    }
  ]
}
```

### 6. API Key Security

**Never expose these in client-side code:**
- `SUPABASE_SERVICE_ROLE_KEY` - Only in Edge Functions
- `RESEND_API_KEY` - Only in Edge Functions
- Any database credentials

**Environment Variables Setup:**
```bash
# .env.local (local development)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key

# Supabase Edge Functions (set in Supabase dashboard)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
RESEND_API_KEY=your_resend_key
FROM_EMAIL=notifications@cracktoday.com
```

### 7. Audit Logging

All sensitive operations are logged:
- User logins (success/failure)
- Purchase transactions
- Test attempts
- Profile changes
- Admin actions

View logs in: `security_audit_log` table

### 8. Input Sanitization

Always use security utilities:

```typescript
import { 
  sanitizeInput, 
  sanitizeObject, 
  isValidEmail,
  isStrongPassword,
  containsSqlInjection,
  containsXssPatterns 
} from './utils/security';

// Sanitize user input
const cleanInput = sanitizeInput(userInput);

// Validate email
if (!isValidEmail(email)) {
  throw new Error('Invalid email');
}

// Check for SQL injection
if (containsSqlInjection(input)) {
  logSecurityEvent('sql_injection_attempt', { input }, 'high');
  throw new Error('Invalid input');
}
```

### 9. HTTPS Only

- All traffic must use HTTPS
- No HTTP endpoints
- Secure cookies only
- HSTS header enabled

### 10. CORS Configuration

Restrict API access:

```sql
-- In Supabase Dashboard > API > CORS
-- Set allowed origins to your domain only
https://cracktoday.vercel.app
https://cracktoday.com
```

## Deployment Checklist

Before deploying:

- [ ] Run all security SQL migrations
- [ ] Set environment variables in Supabase
- [ ] Enable RLS on all tables
- [ ] Configure CORS settings
- [ ] Add security headers
- [ ] Enable HTTPS redirect
- [ ] Test rate limiting
- [ ] Verify audit logging
- [ ] Review RLS policies
- [ ] Check API key permissions
- [ ] Enable 2FA for admin accounts

## Security Monitoring

Monitor these tables regularly:
- `security_audit_log` - All security events
- `auth_login_attempts` - Failed logins
- `security_alerts` - Suspicious activity
- `user_sessions` - Active sessions

## Incident Response

If security breach suspected:
1. Check `security_audit_log` for suspicious activity
2. Review `security_alerts` for automated warnings
3. Revoke suspicious sessions from `user_sessions`
4. Force password reset for affected users
5. Enable additional rate limiting
6. Contact security team

## Regular Maintenance

- Review RLS policies monthly
- Check audit logs weekly
- Update security libraries
- Rotate API keys quarterly
- Test backup restoration
- Review access logs

## Contact

For security issues, contact: security@cracktoday.com
