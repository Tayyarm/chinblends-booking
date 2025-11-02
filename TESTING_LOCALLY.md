# Testing the Booking System Locally

## 🚀 Quick Test Guide

Your booking system is running at: **http://localhost:5176**

### Step 1: Set Your Availability (As Barber)

1. Go to: http://localhost:5176/admin
2. Login with password: `chinblends2024`
3. You'll see the "Set Availability" tab (default)
4. Select some time slots for today's day of the week
   - Example: If today is Friday, click some times under "Friday"
   - Click as many times as you want (9 AM, 10 AM, 2 PM, etc.)
5. Click "Save Availability"
6. You should see: "Availability saved locally!"

### Step 2: Make a Test Booking (As Customer)

1. Go back to: http://localhost:5176
2. Click on a service (e.g., "Fade & Beard")
3. Select today's date in the calendar
4. **You should now see ONLY the times you selected!**
5. Click on a time slot
6. Fill in your name and phone number
7. Click "Confirm Booking"
8. You should see a success page!

### Step 3: View Your Bookings (As Barber)

1. Go back to: http://localhost:5176/admin
2. Click on the "Bookings" tab
3. You should see your test booking!
4. Try clicking "Cancel" to cancel it

## 📝 How It Works Locally

**Local Storage:**
- All data is saved in your browser's localStorage
- Availability, bookings, everything
- Perfect for testing the UI and flow
- Data only exists in your browser

**When Deployed to Vercel:**
- Automatically switches to real database (Vercel KV)
- All customers see the same data
- Email notifications work
- Professional and scalable

## ✅ What to Test

- [ ] Set availability for different days
- [ ] Select All / Clear All buttons
- [ ] Only set times show up for customers
- [ ] Create a booking
- [ ] View booking in admin panel
- [ ] Cancel a booking
- [ ] Try booking a time that's already booked (should be hidden)
- [ ] Navigate between pages
- [ ] "Business Owner?" link in header

## 🎨 Things You Can Customize

### Services
Edit: `src/components/ServiceSelection.jsx`
- Change service names
- Modify durations
- Add or remove services

### Available Times
Already controlled by the admin panel!
- Just set your availability in the admin

### Colors/Design
Edit: `tailwind.config.js`
- Change primary colors
- Modify theme

### Admin Password
Edit: `src/pages/AdminPage.jsx` line 13
```javascript
if (password === 'YOUR_NEW_PASSWORD') {
```

## 🚀 Ready to Deploy?

When you're happy with how it looks and works:

1. Everything will automatically switch to using the real database
2. Email notifications will start working
3. All customers will see the same availability
4. Follow the DEPLOYMENT_GUIDE.md

## 💡 Pro Tips

- Open browser dev tools (F12) → Application → Local Storage to see saved data
- Clear localStorage to start fresh: `localStorage.clear()` in console
- Test on mobile view (responsive design)

---

**Questions?** Check README.md or DEPLOYMENT_GUIDE.md
