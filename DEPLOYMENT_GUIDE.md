# Quick Deployment Guide for Chinblends Booking System

## 🚀 Quick Start (5 Minutes)

### 1. Push to GitHub
```bash
cd barber-booking
git init
git add .
git commit -m "Initial commit - Chinblends booking system"
gh repo create chinblends-booking --public --source=. --remote=origin --push
```

### 2. Deploy to Vercel
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Click "Deploy" (no configuration needed!)

### 3. Add Database (2 clicks)
1. In Vercel dashboard → Storage → Create Database
2. Select "KV" → Create
3. Done! Environment variables auto-added

### 4. Setup Email (3 minutes)
1. **Gmail**: Settings → Security → 2-Step Verification ON
2. **App Password**: Security → App passwords → Create "Chinblends"
3. **Vercel**: Settings → Environment Variables → Add:
   - `EMAIL_USER` = `chinblends@gmail.com`
   - `EMAIL_PASSWORD` = `your-16-char-app-password`
4. **Redeploy**: Deployments → Redeploy

### 5. Add Logo
1. Upload logo to `src/assets/logo.png`
2. Edit `src/components/Header.jsx`:
```jsx
import logo from '../assets/logo.png';

// Replace the CB div with:
<img src={logo} alt="Chinblends" className="w-12 h-12 rounded-full" />
```
3. Push changes → Auto-deploys

## ✅ You're Live!

Your booking system is now live at: `https://your-project.vercel.app`

### Access Admin Panel
- URL: `https://your-project.vercel.app/admin`
- Password: `chinblends2024`

### ⚠️ IMPORTANT: Change Admin Password
Before sharing the site, change the password in `src/pages/AdminPage.jsx` line 13:
```javascript
if (password === 'YOUR_NEW_SECURE_PASSWORD') {
```

## 📧 Email Notifications

You'll receive emails when:
- ✅ New booking is made
- ❌ Booking is cancelled (customer also notified)

## 💡 Pro Tips

1. **Custom Domain**: Vercel → Settings → Domains → Add custom domain (free)
2. **Analytics**: Vercel → Analytics → Enable (free)
3. **Test Bookings**: Create a test booking to verify emails work
4. **Share Link**: Share `your-domain.vercel.app` on Instagram stories!

## 🔧 Customization

### Change Services
Edit: `src/components/ServiceSelection.jsx`

### Change Available Hours
Edit: `api/available-slots.js` (currently 9 AM - 6 PM)

### Change Colors
Edit: `tailwind.config.js` (primary colors)

## 📱 Share Your Site

Add to Instagram bio:
```
Book your appointment → your-domain.vercel.app
```

## 💰 Cost
**Total: $0/month** (everything is free!)

## Need Help?

Check the main README.md for detailed documentation.
