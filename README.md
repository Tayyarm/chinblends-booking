# Chinblends Barber Booking System

A modern, free barber booking website built with React and deployed on Vercel.

## Features

- 📅 Easy appointment booking with service selection
- ⏰ Real-time availability checking
- 📧 Email notifications for bookings and cancellations
- 🔐 Secure admin panel for managing appointments
- 📱 Fully responsive design
- 💰 Payment in-person (no payment processing needed)

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Vercel Serverless Functions
- **Database**: Vercel KV (Redis)
- **Email**: Nodemailer with Gmail
- **Hosting**: Vercel (100% Free)

## Local Development

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Run development server**
   ```bash
   npm run dev
   ```

3. **Open browser**
   Navigate to `http://localhost:5173`

## Deployment to Vercel (FREE)

### Step 1: Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub (free)

### Step 2: Deploy the Project
1. Install Vercel CLI (optional but recommended):
   ```bash
   npm i -g vercel
   ```

2. Deploy from the project directory:
   ```bash
   vercel
   ```

   OR use the Vercel web interface:
   - Click "Import Project"
   - Connect your GitHub repository
   - Click "Deploy"

### Step 3: Add Vercel KV Database (FREE)
1. Go to your project dashboard on Vercel
2. Click on "Storage" tab
3. Click "Create Database"
4. Select "KV" (Key-Value Store)
5. Name it "bookings-db" and create
6. Vercel will automatically add the environment variables to your project

### Step 4: Configure Gmail for Email Notifications

1. **Enable 2-Factor Authentication on Gmail**
   - Go to Google Account settings
   - Security → 2-Step Verification → Turn it ON

2. **Create App Password**
   - Go to Google Account → Security
   - Under "2-Step Verification", find "App passwords"
   - Select "Mail" and "Other (Custom name)"
   - Name it "Chinblends Booking"
   - Copy the 16-character password

3. **Add Environment Variables to Vercel**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add these variables:
     ```
     EMAIL_USER=chinblends@gmail.com
     EMAIL_PASSWORD=<paste the 16-character app password>
     ```
   - Click "Save"

4. **Redeploy**
   - Go to Deployments tab
   - Click "Redeploy" on the latest deployment

### Step 5: Add Your Logo
1. Replace the placeholder logo in `src/components/Header.jsx`
2. Add your logo image to `src/assets/`
3. Update the Header component to use your logo

## Admin Panel

- Access: `https://your-domain.vercel.app/admin`
- Default password: `chinblends2024`
- **IMPORTANT**: Change the password in `src/pages/AdminPage.jsx` before deploying to production!

### Features:
- View all bookings (upcoming and past)
- Cancel appointments (automatically sends email to customer)
- Track booking statistics

## Customization

### Change Service Times
Edit `src/components/ServiceSelection.jsx` to modify services and durations.

### Change Available Hours
Edit `api/available-slots.js` to modify the default time slots:
```javascript
const allSlots = [
  '09:00 AM',
  '10:00 AM',
  // Add or remove times here
];
```

### Change Admin Password
Edit `src/pages/AdminPage.jsx`:
```javascript
if (password === 'your_new_password') {
  // ...
}
```

## Cost Breakdown

| Service | Free Tier | Cost |
|---------|-----------|------|
| Vercel Hosting | ✅ Yes | $0 |
| Vercel KV Database | ✅ 256MB storage | $0 |
| Gmail SMTP | ✅ Unlimited | $0 |
| **Total** | | **$0/month** |

## Support

For issues or questions:
- Email: chinblends@gmail.com
- Instagram: [@chin_blends](https://www.instagram.com/chin_blends/)

## License

MIT License - Feel free to use and modify!
