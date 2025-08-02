# 📧 Email Setup Instructions

To make the contact form functional, you need to set up email credentials in your `.env.local` file.

## Gmail Setup (Recommended)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to [Google Account Settings](https://myaccount.google.com/apppasswords)
   - Select "App passwords"
   - Choose "Other" and name it "Portfolio Website"
   - Copy the generated 16-character password

3. **Update `.env.local`**:
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-16-character-app-password
   ```

## Alternative Email Services

### Outlook/Hotmail

```env
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-password
EMAIL_SERVICE=outlook
```

### Yahoo

```env
EMAIL_USER=your-email@yahoo.com
EMAIL_PASS=your-app-password
EMAIL_SERVICE=yahoo
```

### Custom SMTP

```env
EMAIL_HOST=smtp.yourdomain.com
EMAIL_PORT=587
EMAIL_USER=your-email@yourdomain.com
EMAIL_PASS=your-password
EMAIL_SECURE=true
```

## Testing the Setup

1. Start your development server: `npm run dev`
2. Navigate to the contact section
3. Fill out and submit the test form
4. Check your email for the contact message

## Security Notes

- ⚠️ **Never commit `.env.local` to version control**
- ✅ The `.env.local` file is already in `.gitignore`
- ✅ Use App Passwords instead of your main email password
- ✅ For production, use environment variables in your hosting platform

## Troubleshooting

- **"Authentication failed"**: Check your App Password
- **"Connection timeout"**: Check your internet connection and email service settings
- **"Message not received"**: Check spam folder and email service limits
