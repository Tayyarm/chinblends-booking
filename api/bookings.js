import { kv } from '@vercel/kv';
import nodemailer from 'nodemailer';

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Will be chinblends@gmail.com
    pass: process.env.EMAIL_PASSWORD, // App-specific password
  },
});

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      // Get all bookings
      const bookings = await kv.get('bookings') || [];
      return res.status(200).json({ bookings });
    } catch (error) {
      console.error('Error fetching bookings:', error);
      return res.status(500).json({ error: 'Failed to fetch bookings' });
    }
  }

  if (req.method === 'POST') {
    try {
      const booking = req.body;

      // Generate unique ID
      booking.id = `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Get existing bookings
      const bookings = await kv.get('bookings') || [];

      // Add new booking
      bookings.push(booking);

      // Save to KV store
      await kv.set('bookings', bookings);

      // Send confirmation emails (don't fail booking if email fails)
      try {
        await sendBookingEmail(booking);
        await sendCustomerConfirmationEmail(booking);
      } catch (emailError) {
        console.error('Error sending emails (booking still created):', emailError);
        console.error('Email error details:', emailError.message);
        console.error('EMAIL_USER configured:', !!process.env.EMAIL_USER);
        console.error('EMAIL_PASSWORD configured:', !!process.env.EMAIL_PASSWORD);
      }

      return res.status(201).json({ success: true, booking });
    } catch (error) {
      console.error('Error creating booking:', error);
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
      return res.status(500).json({ error: 'Failed to create booking', details: error.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const bookingId = req.query.id;

      // Get existing bookings
      const bookings = await kv.get('bookings') || [];

      // Find the booking to cancel
      const booking = bookings.find(b => b.id === bookingId);

      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      // Remove booking
      const updatedBookings = bookings.filter(b => b.id !== bookingId);
      await kv.set('bookings', updatedBookings);

      // Send cancellation emails (don't fail cancellation if email fails)
      try {
        await sendCancellationEmail(booking);
        await sendBarberCancellationNotification(booking);
      } catch (emailError) {
        console.error('Error sending cancellation emails (booking still cancelled):', emailError);
        console.error('Email error details:', emailError.message);
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error cancelling booking:', error);
      console.error('Error details:', error.message);
      return res.status(500).json({ error: 'Failed to cancel booking', details: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

async function sendBookingEmail(booking) {
  const emailContent = {
    from: process.env.EMAIL_USER,
    to: 'chinblends@gmail.com',
    subject: `New Booking: ${booking.service} - ${booking.customerName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #000;">New Booking Received</h2>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Customer:</strong> ${booking.customerName}</p>
          <p><strong>Phone:</strong> ${booking.customerPhone}</p>
          <p><strong>Service:</strong> ${booking.service}</p>
          <p><strong>Duration:</strong> ${booking.duration}</p>
          <p><strong>Date:</strong> ${new Date(booking.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p><strong>Time:</strong> ${booking.time}</p>
        </div>
        <p style="color: #666;">This is an automated notification from your booking system.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(emailContent);
  } catch (error) {
    console.error('Error sending booking email:', error);
  }
}

async function sendCustomerConfirmationEmail(booking) {
  // Email to customer confirming their booking
  const customerEmail = {
    from: process.env.EMAIL_USER,
    to: booking.customerEmail,
    subject: 'Booking Confirmed - Chinblends',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #000;">Booking Confirmed!</h2>
        <p>Hi ${booking.customerName},</p>
        <p>Your appointment has been confirmed. We look forward to seeing you!</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Service:</strong> ${booking.service}</p>
          <p><strong>Duration:</strong> ${booking.duration}</p>
          <p><strong>Date:</strong> ${new Date(booking.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p><strong>Time:</strong> ${booking.time}</p>
        </div>
        <p style="color: #666;">
          If you need to cancel or reschedule, please contact us:<br>
          Email: chinblends@gmail.com<br>
          Instagram: @chin_blends
        </p>
      </div>
    `,
  };

  try {
    // Only send if we have a valid email
    if (booking.customerEmail && booking.customerEmail.includes('@')) {
      await transporter.sendMail(customerEmail);
    }
  } catch (error) {
    console.error('Error sending customer confirmation email:', error);
  }
}

async function sendCancellationEmail(booking) {
  // Email to customer about cancellation
  const customerEmail = {
    from: process.env.EMAIL_USER,
    to: booking.customerEmail,
    subject: 'Appointment Cancelled - Chinblends',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #000;">Appointment Cancelled</h2>
        <p>Hi ${booking.customerName},</p>
        <p>Unfortunately, your appointment has been cancelled:</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Service:</strong> ${booking.service}</p>
          <p><strong>Date:</strong> ${new Date(booking.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p><strong>Time:</strong> ${booking.time}</p>
        </div>
        <p>Please contact us to reschedule your appointment.</p>
        <p style="color: #666;">
          Contact: chinblends@gmail.com<br>
          Instagram: @chin_blends
        </p>
      </div>
    `,
  };

  try {
    // Only send if we have a valid email
    if (booking.customerEmail && booking.customerEmail.includes('@')) {
      await transporter.sendMail(customerEmail);
    }
  } catch (error) {
    console.error('Error sending cancellation email:', error);
  }
}

async function sendBarberCancellationNotification(booking) {
  // Email to barber notifying them of the cancellation
  const barberEmail = {
    from: process.env.EMAIL_USER,
    to: 'chinblends@gmail.com',
    subject: `Booking Cancelled: ${booking.service} - ${booking.customerName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #d9534f;">Booking Cancelled</h2>
        <p>The following booking has been cancelled:</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Customer:</strong> ${booking.customerName}</p>
          <p><strong>Phone:</strong> ${booking.customerPhone}</p>
          <p><strong>Email:</strong> ${booking.customerEmail}</p>
          <p><strong>Service:</strong> ${booking.service}</p>
          <p><strong>Duration:</strong> ${booking.duration}</p>
          <p><strong>Date:</strong> ${new Date(booking.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p><strong>Time:</strong> ${booking.time}</p>
        </div>
        <p style="color: #666;">This time slot is now available for other bookings.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(barberEmail);
  } catch (error) {
    console.error('Error sending barber cancellation notification:', error);
  }
}
