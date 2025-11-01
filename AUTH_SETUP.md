# Authentication Setup Guide

## Overview
ADAPT uses Supabase Auth with two sign-in methods:
1. **Phone OTP** (SMS-based one-time password)
2. **Google OAuth** (Social sign-in)

Both methods set secure httpOnly cookies that are validated by middleware to protect routes and APIs.

---

## Supabase Dashboard Configuration

### 1. Site URL Configuration
Go to: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/auth/url-configuration

Set the following:
- **Site URL**: `http://localhost:3000` (for development)
- **Redirect URLs** (add both):
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/**`

For production, add your production domain (e.g., `https://yourdomain.com`)

---

### 2. Google OAuth Setup

#### Step 1: Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure:
   - Application type: **Web application**
   - Name: `ADAPT Banking`
   - Authorized JavaScript origins:
     - `http://localhost:3000`
     - `https://ngxamgnolyoksfptzaxx.supabase.co`
   - Authorized redirect URIs:
     - `https://ngxamgnolyoksfptzaxx.supabase.co/auth/v1/callback`
6. Copy the **Client ID** and **Client Secret**

#### Step 2: Supabase Dashboard
1. Go to: https://supabase.com/dashboard/project/ngxamgnolyoksfptzaxx/auth/providers
2. Find **Google** provider and enable it
3. Paste your **Client ID** and **Client Secret**
4. Save changes

---

### 3. Phone (SMS) Setup

#### Supported Providers
Supabase supports multiple SMS providers:
- **Twilio** (recommended)
- **Vonage (Nexmo)**
- **MessageBird**
- **Textlocal** (India-specific)

#### Step 1: SMS Provider Setup (Twilio Example)
1. Sign up at [Twilio](https://www.twilio.com/)
2. Get a phone number (for India, ensure it supports international SMS)
3. Copy your **Account SID**, **Auth Token**, and **Phone Number**

**Note for India (+91):**
- Register with DLT (Distributed Ledger Technology)
- Get your Entity ID and Template ID
- Ensure your SMS templates are approved

#### Step 2: Supabase Dashboard
1. Go to: https://supabase.com/dashboard/project/ngxamgnolyoksfptzaxx/auth/providers
2. Find **Phone** provider and enable it
3. Select **Twilio** as the SMS provider
4. Enter:
   - Account SID
   - Auth Token
   - Messaging Service SID or Phone Number
5. Configure the OTP template (must match DLT template for India)
6. Save changes

---

## Environment Variables

Ensure your `.env.local` file has:

```bash
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=https://ngxamgnolyoksfptzaxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# App URL (important for OAuth redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# AI (for Advisor chat)
GEMINI_API_KEY=your_gemini_key_here
```

---

## How It Works

### Phone OTP Flow
1. User enters phone number in E.164 format (e.g., `+919876543210`)
2. Click "Send OTP" → Supabase sends SMS via configured provider
3. User enters 6-digit OTP
4. Click "Verify OTP" → Client calls `supabase.auth.verifyOtp()`
5. On success, tokens are posted to `/api/auth/set-session`
6. Server sets httpOnly cookies with proper security options
7. User is redirected to `/home`

### Google OAuth Flow
1. User clicks "Continue with Google"
2. Browser redirects to Google consent screen
3. User authorizes → Google redirects to Supabase callback URL
4. Supabase redirects to `/auth/callback` with authorization code
5. Server exchanges code for session via `supabase.auth.exchangeCodeForSession()`
6. Cookies are set automatically via Supabase SSR
7. User is redirected to `/home`

### Protected Routes
- **Pages**: `/home` (requires auth, redirects to `/sign-in` if not authenticated)
- **APIs**: 
  - `/api/credit/calculate` (credit score computation)
  - `/api/advisor/chat` (AI loan advisor)
  - Returns 401 JSON if no valid session

---

## Testing

### Test Phone OTP (if SMS provider is configured)
```bash
npm run dev
# Navigate to http://localhost:3000/sign-in
# Enter: +919876543210 (or your test number)
# Click "Send OTP"
# Enter the OTP received via SMS
# Click "Verify OTP"
# Should redirect to /home
```

### Test Google OAuth
```bash
npm run dev
# Navigate to http://localhost:3000/sign-in
# Click "Continue with Google"
# Authorize with your Google account
# Should redirect to /home
```

---

## Troubleshooting

### "Unsupported phone provider"
- SMS provider is not configured in Supabase
- Use Google OAuth instead, or configure Twilio/Vonage in Supabase Dashboard

### "No code in callback" (OAuth)
- Site URL or Redirect URLs are not configured correctly in Supabase
- Check that `http://localhost:3000/auth/callback` is in the allowed redirect URLs
- Verify Google OAuth redirect URI matches: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`

### Google sign-in button does nothing
- Check browser console for errors
- Verify Google provider is enabled in Supabase with valid credentials
- Check Network tab to see if OAuth URL is being requested

### Middleware blocks authenticated users
- Clear browser cookies and try again
- Check that cookies are being set with correct domain/path
- Verify `NEXT_PUBLIC_SUPABASE_URL` matches your project

---

## Security Notes

- Auth cookies are **httpOnly** (JavaScript can't access them)
- Cookies use **sameSite: 'lax'** (CSRF protection)
- Cookies are **secure** in production (HTTPS only)
- Service role key is only used server-side in API routes
- Middleware validates every request to protected routes
- No tokens are exposed to the client bundle

---

## Production Checklist

Before deploying:
- [ ] Update Site URL to production domain in Supabase
- [ ] Add production domain to Redirect URLs
- [ ] Update Google OAuth redirect URIs with production domain
- [ ] Set `NEXT_PUBLIC_APP_URL` to production URL
- [ ] Ensure SMS provider is funded and DLT registered (India)
- [ ] Test both auth flows in production
- [ ] Verify middleware protection on all sensitive routes
- [ ] Enable rate limiting in Supabase (Auth → Rate Limits)

---

## Support

For issues:
1. Check Supabase logs: https://supabase.com/dashboard/project/ngxamgnolyoksfptzaxx/logs/auth-logs
2. Verify configuration in Supabase Auth settings
3. Check browser console and Network tab for errors
4. Review server logs for API errors
