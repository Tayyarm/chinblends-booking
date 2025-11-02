# Local Testing Guide

## Testing Without Backend (Frontend Only)

You can test the UI without setting up the backend:

```bash
cd barber-booking
npm run dev
```

**What works**:
- ✅ Service selection
- ✅ Date and time picker UI
- ✅ Booking form
- ✅ Admin login UI

**What won't work** (requires deployment):
- ❌ Actually saving bookings
- ❌ Email notifications
- ❌ Viewing saved bookings in admin

The app will show friendly error messages for these features.

## Testing Full Features Locally (Advanced)

To test the complete system locally, you'll need:

### 1. Install Vercel CLI
```bash
npm i -g vercel
```

### 2. Link Project
```bash
cd barber-booking
vercel link
```

### 3. Pull Environment Variables
After you've deployed once and added KV database:
```bash
vercel env pull .env.local
```

This will download the KV credentials to your local `.env.local` file.

### 4. Run Development Server
```bash
vercel dev
```

This runs your app locally with the serverless functions!

## Recommended Approach

**For most users**:
Just deploy to Vercel and test there. It's faster and easier!

**Steps**:
1. Push code to GitHub
2. Deploy to Vercel
3. Add KV database
4. Add email credentials
5. Test live site
6. Make changes if needed
7. Push updates → Auto-deploys

## Quick Test Checklist

After deploying:

- [ ] Homepage loads correctly
- [ ] Can select a service
- [ ] Can pick a date and time
- [ ] Can fill out booking form
- [ ] Booking confirmation shows
- [ ] Email arrives at chinblends@gmail.com
- [ ] Admin panel login works
- [ ] Can see booking in admin
- [ ] Can cancel booking
- [ ] Cancellation email sends

## Troubleshooting

### Email not sending?
- Check Gmail app password is correct
- Check 2FA is enabled
- Check environment variables in Vercel
- Check spam folder

### Bookings not saving?
- Make sure Vercel KV is added
- Check environment variables
- Check browser console for errors

### Admin panel password not working?
- Default password: `chinblends2024`
- Check for typos
- Clear browser cache

---

**Tip**: Testing on the live site is easier than local testing for this project!
