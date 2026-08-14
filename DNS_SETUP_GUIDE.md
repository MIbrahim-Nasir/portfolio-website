# 🌐 DNS Configuration for mibrahimnasir.dev

## Current Status

- **Domain**: `mibrahimnasir.dev`
- **Status**: Pending DNS Configuration
- **Provider**: Vercel
- **Target**: Custom domain setup

## 📋 Required DNS Records

Based on Vercel's latest requirements, configure these DNS records at your domain provider:

### Primary Records (Required)

| Type    | Name  | Value                  | TTL |
| ------- | ----- | ---------------------- | --- |
| `A`     | `@`   | `216.198.79.1`         | 300 |
| `CNAME` | `www` | `cname.vercel-dns.com` | 300 |

### Alternative Records (Backup)

If the primary records don't work, you can try these older records:
| Type | Name | Value | TTL |
|------|------|-------|-----|
| `A` | `@` | `76.76.21.21` | 300 |
| `CNAME` | `www` | `cname.vercel-dns.com` | 300 |

## 🔧 Step-by-Step Configuration

### If you're using **Namecheap**:

1. Log into Namecheap dashboard
2. Go to "Domain List" → Manage for `mibrahimnasir.dev`
3. Go to "Advanced DNS" tab
4. Delete any existing A records and CNAME records
5. Add new records:
   - **Type**: A Record, **Host**: @, **Value**: `216.198.79.1`, **TTL**: 300
   - **Type**: CNAME, **Host**: www, **Value**: `cname.vercel-dns.com`, **TTL**: 300
6. Save changes

### If you're using **GoDaddy**:

1. Log into GoDaddy account
2. Go to "My Products" → DNS for `mibrahimnasir.dev`
3. Delete existing A and CNAME records
4. Add new records:
   - **Type**: A, **Name**: @, **Value**: `216.198.79.1`, **TTL**: 300
   - **Type**: CNAME, **Name**: www, **Value**: `cname.vercel-dns.com`, **TTL**: 300
5. Save changes

### If you're using **Cloudflare**:

1. Log into Cloudflare dashboard
2. Select `mibrahimnasir.dev` domain
3. Go to "DNS" → "Records"
4. Delete existing A and CNAME records
5. Add new records:
   - **Type**: A, **Name**: @, **Content**: `216.198.79.1`, **TTL**: Auto
   - **Type**: CNAME, **Name**: www, **Content**: `cname.vercel-dns.com`, **TTL**: Auto
6. **Important**: Set Proxy status to "DNS only" (gray cloud)

## ⏰ Propagation Timeline

- **Minimum**: 15-30 minutes
- **Typical**: 2-4 hours
- **Maximum**: 24-48 hours

## 🔍 Verification Steps

### 1. Check DNS Propagation

Use online tools to verify:

- [DNS Checker](https://dnschecker.org/)
- [What's My DNS](https://www.whatsmydns.net/)
- Search for `mibrahimnasir.dev` and check A record shows `216.198.79.1`

### 2. Test Domain Access

- Try accessing `https://mibrahimnasir.dev`
- Try accessing `https://www.mibrahimnasir.dev`
- Both should redirect to your portfolio

### 3. Verify in Vercel

- Go to Vercel dashboard → Settings → Domains
- `mibrahimnasir.dev` should show "Valid Configuration" ✅

## 🚨 Troubleshooting

### Domain Not Working After 24 Hours

1. **Double-check DNS records** - Ensure exact values match
2. **Clear DNS cache** - Restart router/computer
3. **Contact domain provider** - Some providers have delays
4. **Try alternative IP** - Use `76.76.21.21` if `216.198.79.1` doesn't work

### SSL Certificate Issues

- Vercel automatically provides SSL certificates
- May take 1-2 hours after DNS verification
- Certificate covers both `mibrahimnasir.dev` and `www.mibrahimnasir.dev`

### Redirect Issues

- Ensure both A record (@) and CNAME (www) are configured
- Vercel automatically redirects www to non-www or vice versa

## 🎯 Expected Final Result

Once configured successfully:

- ✅ `https://mibrahimnasir.dev` → Your portfolio
- ✅ `https://www.mibrahimnasir.dev` → Redirects to main domain
- ✅ SSL certificate active (green padlock)
- ✅ Fast loading via Vercel's global CDN

## 📞 Need Help?

1. **Check current DNS**: Run `nslookup mibrahimnasir.dev` in terminal
2. **Verify A record**: Should return `216.198.79.1`
3. **Contact support**: If issues persist after 48 hours

---

**Current Status**: Configuring DNS records for `mibrahimnasir.dev` ⏳
