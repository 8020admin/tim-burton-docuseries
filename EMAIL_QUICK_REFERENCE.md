# Email System - Quick Reference

## 🚀 Quick Start (1 Hour Setup)

### 1. SendGrid Account
```
→ Go to: https://sendgrid.com
→ Sign up (free: 100 emails/day)
→ Verify email: noreply@project.com
→ Generate API key (Mail Send permissions)
```

### 2. Create 9 Templates
```
Email API > Dynamic Templates > Create Template

1. Welcome Email
2. Purchase - Rental  
3. Purchase - Regular
4. Purchase - Box Set
5. Password Reset
6. Email Verification
7. Rental Warning - 48h
8. Rental Warning - 24h
9. Rental Expired
```

### 3. Configure Environment
```bash
# Edit: src/backend/functions/.env
SENDGRID_API_KEY=SG.your_key_here
SENDGRID_FROM_EMAIL=noreply@project.com
SENDGRID_TEMPLATE_WELCOME=d-xxxxx
SENDGRID_TEMPLATE_PURCHASE_RENTAL=d-xxxxx
SENDGRID_TEMPLATE_PURCHASE_REGULAR=d-xxxxx
SENDGRID_TEMPLATE_PURCHASE_BOXSET=d-xxxxx
SENDGRID_TEMPLATE_PASSWORD_RESET=d-xxxxx
SENDGRID_TEMPLATE_EMAIL_VERIFICATION=d-xxxxx
SENDGRID_TEMPLATE_RENTAL_WARNING_48H=d-xxxxx
SENDGRID_TEMPLATE_RENTAL_WARNING_24H=d-xxxxx
SENDGRID_TEMPLATE_RENTAL_EXPIRED=d-xxxxx
```

### 4. Deploy
```bash
cd src/backend/functions
npm run build
firebase deploy --only functions
```

---

## 📧 Email Triggers

| Email | When | Sent From |
|-------|------|-----------|
| Welcome | Account created | `auth.ts` |
| Purchase Confirmation | Payment successful | `stripe.ts` |
| Password Reset | User requests reset | `password-reset.ts` |
| Rental Warning (48h) | Scheduled hourly | `scheduled-tasks.ts` |
| Rental Warning (24h) | Scheduled hourly | `scheduled-tasks.ts` |
| Rental Expired | Scheduled hourly | `scheduled-tasks.ts` |

---

## 🔑 Template Variables

### Welcome Email
```json
{
  "firstName": "User"
}
```

### Purchase Confirmations
```json
{
  "firstName": "User",
  "productName": "4-Day Rental",
  "amount": "$24.99",
  "purchaseDate": "January 1, 2025",
  "expiresAt": "January 5, 2025"  // Rental only
}
```

### Password Reset
```json
{
  "firstName": "User",
  "resetLink": "https://..."
}
```

### Rental Warnings
```json
{
  "firstName": "User",
  "hoursRemaining": 48,
  "expiresAt": "January 5, 2025 at 3:00 PM"
}
```

---

## 🧪 Testing

### Test Welcome Email
```javascript
// Create new account on site
// Check email inbox
```

### Test Password Reset
```javascript
await timBurtonAuth.resetPassword('test@example.com');
// Check email inbox
```

### Test Purchase Confirmation
```
1. Make test purchase (Stripe: 4242 4242 4242 4242)
2. Check email inbox
```

### Test Scheduled Function
```
Firebase Console > Functions > checkRentalExpirations > Test
```

---

## 📊 Monitoring

### SendGrid Dashboard
```
https://app.sendgrid.com/
→ Activity Feed (view sent emails)
→ Statistics (opens, clicks, bounces)
```

### Firebase Logs
```bash
# All functions
firebase functions:log

# Scheduled tasks only
firebase functions:log --only checkRentalExpirations
```

---

## 🛠️ Troubleshooting

### Emails Not Sending
```
1. Check: firebase functions:log
2. Verify: API key in .env
3. Check: Template IDs correct
4. Verify: Sender email authenticated
```

### Going to Spam
```
1. Set up domain authentication (SendGrid)
2. Use professional sender email
3. Avoid spam trigger words
```

### Scheduled Function Not Running
```
1. Check: Blaze plan active
2. View: firebase functions:log --only checkRentalExpirations
3. Test: Firebase Console > Functions > Test
```

---

## 📚 Documentation

| File | Use For |
|------|---------|
| `EMAIL_QUICK_REFERENCE.md` | This guide (one-page reference) |
| `SENDGRID_GUIDE.md` | Complete guide (setup, templates, spam prevention) |
| `CURRENT_STATUS.md` | Overall project status |

---

## ✅ Production Checklist

- [ ] SendGrid account created
- [ ] Domain authentication (not single sender)
- [ ] All 9 templates created
- [ ] Template IDs in `.env`
- [ ] API key in `.env`
- [ ] Functions deployed
- [ ] Test emails sent
- [ ] Scheduled function tested
- [ ] Update sender email to real domain
- [ ] Set up bounce handling
- [ ] Configure alerts

---

## 💡 Pro Tips

1. **Start with single sender** (quick), upgrade to domain auth later
2. **Test thoroughly** before going live
3. **Monitor delivery rates** (should be >95%)
4. **Rotate API keys** every 90 days
5. **Keep templates simple** and on-brand

---

## 🆘 Need Help?

**Setup Issues:**
→ `SENDGRID_SETUP_INSTRUCTIONS.md`

**Template Creation:**
→ `SENDGRID_GUIDE.md` (see Dynamic Templates section)

**Code Questions:**
→ `SENDGRID_IMPLEMENTATION_SUMMARY.md`

**SendGrid Issues:**
→ https://support.sendgrid.com

---

_Quick reference for the SendGrid email system. See full documentation for details._

