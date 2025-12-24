# Resend Domain Verification Guide

This guide will help you configure Resend to send emails to any email address (Gmail, Outlook, custom domains, etc.).

## Current Status

**Problem:** You can only send test emails to `saul@polibit.io` because you're using Resend's sandbox email `onboarding@resend.dev`.

**Solution:** Verify your own domain (e.g., `polibit.io`) and use it for sending emails.

---

## Step-by-Step Setup

### Step 1: Log into Resend Dashboard

1. Go to [https://resend.com/login](https://resend.com/login)
2. Log in with your Resend account credentials

### Step 2: Add Your Domain

1. Navigate to **Domains** in the sidebar
2. Click **Add Domain** button
3. Enter your domain name: `polibit.io` (or whatever domain you want to use)
   - **Note:** You can use the root domain (polibit.io) or a subdomain (e.g., mail.polibit.io)
4. Click **Add**

### Step 3: Configure DNS Records

Resend will provide you with DNS records that you need to add to your domain. You'll need to add these records:

#### Required DNS Records:

**1. SPF Record (TXT)**
- **Type:** TXT
- **Name:** `@` or your domain
- **Value:** Something like `v=spf1 include:resend.com ~all`

Type = TXT
Name = send
Content = v=spf1 include:amazonses.com ~all
TTL = Auto



**2. DKIM Records (CNAME)**
- **Type:** CNAME
- **Name:** Will be provided by Resend (e.g., `resend._domainkey`)
- **Value:** Will be provided by Resend (e.g., `resend._domainkey.resend.com`)

Type = TXT
Name = resend._domainkey
Content = p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCX6oRmffzASq/nyuKOQrqySSWqN9rHOcmYkiMmm1WaYJVh2gQAkd4f3dOCkAbUZJwFFrq37qVPpDTVCpuv0MUdIDLTsCBfMFAQPS8CW8qC0IrqDCMc4LW/9czc7rnxdgTeTgTiMWCVA73BCSvL/kKmaKhvt4Ii7XH+gIypTkA4dQIDAQAB
TTL = Auto


**3. DMARC Record (TXT) - Recommended**
- **Type:** TXT
- **Name:** `_dmarc`
- **Value:** Will be provided by Resend (e.g., `v=DMARC1; p=none;`)

#### Where to Add DNS Records:

Go to your domain registrar or DNS provider (examples):
- **GoDaddy:** DNS Management
- **Namecheap:** Advanced DNS
- **Cloudflare:** DNS settings
- **Google Domains:** DNS
- **AWS Route 53:** Hosted zones

**Example for Cloudflare:**
1. Log into Cloudflare
2. Select your domain (polibit.io)
3. Go to **DNS** → **Records**
4. Click **Add record** for each DNS record provided by Resend
5. Add the Type, Name, and Value exactly as shown in Resend
6. Save each record

### Step 4: Verify Domain in Resend

1. After adding all DNS records, go back to Resend dashboard
2. Go to **Domains**
3. Click on your domain (polibit.io)
4. Click **Verify DNS Records** or **Verify Domain**
5. Resend will check your DNS records

**Note:** DNS propagation can take a few minutes to 48 hours, but usually it's verified within 5-10 minutes.

### Step 5: Update Your Environment Variables

Once your domain is verified, update your `.env` file:

**Before:**
```env
RESEND_FROM_EMAIL=onboarding@resend.dev
```

**After:**
```env
RESEND_FROM_EMAIL=noreply@polibit.io
```

Or use any email address with your verified domain:
- `no-reply@polibit.io`
- `notifications@polibit.io`
- `support@polibit.io`
- `info@polibit.io`

**Important:** The email address doesn't need to actually exist - Resend will handle sending from it as long as the domain is verified.

### Step 6: Restart Your Server

After updating the `.env` file:

```bash
# Stop your server (Ctrl+C if running)
# Then restart it
npm start
```

Or if using PM2 or similar:
```bash
pm2 restart your-app
```

### Step 7: Test Sending to Any Email

Now you can send emails to any domain:

```bash
# Test with the API
curl -X POST http://localhost:3005/api/emails/test \
  -H "Content-Type: application/json" \
  -d '{
    "testEmail": "anyone@gmail.com"
  }'
```

---

## Troubleshooting

### DNS Records Not Verifying

**Problem:** Resend says DNS records are not found

**Solutions:**
1. Wait 10-15 minutes for DNS propagation
2. Check that you added the records exactly as shown (no extra spaces)
3. Use a DNS checker tool: [https://dnschecker.org](https://dnschecker.org)
4. Make sure you didn't add quotes around TXT record values (some providers require this, others don't)

### Emails Going to Spam

**Problem:** Emails are being delivered but going to spam folders

**Solutions:**
1. Ensure all DNS records (SPF, DKIM, DMARC) are properly configured
2. Add a DMARC record with proper policy
3. Avoid spammy words in subject lines
4. Ensure your sending domain has good reputation
5. Consider adding an unsubscribe link for bulk emails

### Using a Subdomain Instead

If you don't want to use your root domain (`polibit.io`), you can use a subdomain:

1. In Resend, add domain as: `mail.polibit.io`
2. Use email like: `noreply@mail.polibit.io`
3. DNS records will be specific to the subdomain

---

## Current Configuration Summary

**Your current setup:**
- API Key: `re_JS8NEPB6_7A4BZMAd15nE3CbP9XHLDgd6` ✓
- From Email: `onboarding@resend.dev` (sandbox - limited) ⚠️

**After domain verification:**
- API Key: `re_JS8NEPB6_7A4BZMAd15nE3CbP9XHLDgd6` ✓
- From Email: `noreply@polibit.io` (production - unlimited) ✓

---

## Additional Resources

- [Resend Documentation](https://resend.com/docs)
- [Resend Domain Setup](https://resend.com/docs/dashboard/domains/introduction)
- [DNS Record Help](https://resend.com/docs/dashboard/domains/dns-records)

---

## Quick Checklist

- [ ] Log into Resend dashboard
- [ ] Add domain (polibit.io) in Resend
- [ ] Copy DNS records from Resend
- [ ] Add DNS records to your domain provider
- [ ] Wait 5-10 minutes for DNS propagation
- [ ] Verify domain in Resend dashboard
- [ ] Update `RESEND_FROM_EMAIL` in `.env` to use your domain
- [ ] Restart your server
- [ ] Test sending to any email address
