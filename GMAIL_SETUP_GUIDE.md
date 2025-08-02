# 🚀 Quick Gmail Setup for Ibrahim's Portfolio

## Step-by-Step Setup for mibrahimnasir.engineer@gmail.com

### 1. Enable 2-Factor Authentication

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Click on "2-Step Verification"
3. Follow the setup process if not already enabled

### 2. Generate App Password

1. Go to [App Passwords](https://myaccount.google.com/apppasswords)
2. You might need to sign in again
3. Select "Other (Custom name)"
4. Type: "Ibrahim Portfolio Website"
5. Click "GENERATE"
6. **Copy the 16-character password** (something like: `abcd efgh ijkl mnop`)

### 3. Update .env.local File

Replace the content in `.env.local` with:

```env
# Email Configuration for Ibrahim's Portfolio
EMAIL_USER=mibrahimnasir.engineer@gmail.com
EMAIL_PASS=paste-your-16-character-app-password-here
```

### 4. Restart Development Server

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm start
```

### 5. Test the Contact Form

1. Go to your portfolio website
2. Scroll to the contact section
3. Fill out the form with test data
4. Submit and check mibrahimnasir.engineer@gmail.com for the email

## ⚠️ Important Security Notes

- **Never share your App Password**
- The App Password is different from your regular Gmail password
- Add `.env.local` to `.gitignore` (already done)
- For production deployment, add these environment variables to your hosting platform

## 🔧 Troubleshooting

- **"Username and Password not accepted"**: Make sure 2FA is enabled and you're using the App Password, not your regular password
- **"Less secure app access"**: This is outdated - use App Passwords instead
- **Still not working?**: Try generating a new App Password

## 📧 Expected Email Format

When someone submits the contact form, you'll receive an email with:

- **Subject**: Portfolio Contact: [Their Subject]
- **From**: mibrahimnasir.engineer@gmail.com
- **Content**: Formatted HTML email with their name, email, subject, and message
