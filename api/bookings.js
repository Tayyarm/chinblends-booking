import { createClient } from 'redis';
import nodemailer from 'nodemailer';
const tickTickService = require('./ticktick-service');

// Redis client setup
let redisClient;
async function getRedisClient() {
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_URL || process.env.KV_URL
    });
    redisClient.on('error', (err) => console.error('Redis Client Error', err));
    await redisClient.connect();
  }
  return redisClient;
}

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Verify transporter configuration on startup
transporter.verify(function (error) {
  if (error) {
    console.error('Email transporter verification failed:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});

// Calendar event generator (inline to avoid import issues)
function generateCalendarEvent(booking) {
  // Convert 12-hour time to 24-hour format
  const convertTo24Hour = (time12) => {
    const [time, period] = time12.split(' ');
    let [hours, minutes] = time.split(':');
    hours = parseInt(hours);

    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }

    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  };

  // Parse the booking date and time
  const bookingDate = new Date(booking.date);
  const [hours, minutes] = convertTo24Hour(booking.time).split(':');

  // Set the start time
  const startDate = new Date(bookingDate);
  startDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

  // Calculate end time based on duration
  const durationMinutes = parseInt(booking.duration);
  const endDate = new Date(startDate.getTime() + durationMinutes * 60000);

  // Format dates for iCalendar (YYYYMMDDTHHMMSS)
  const formatICalDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const sec = String(date.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}T${hour}${min}${sec}`;
  };

  const startDateStr = formatICalDate(startDate);
  const endDateStr = formatICalDate(endDate);
  const nowStr = formatICalDate(new Date());

  // Create alarm for 15 minutes before
  const alarmDate = new Date(startDate.getTime() - 15 * 60000);
  const alarmStr = formatICalDate(alarmDate);

  // Generate the .ics file content
  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Chinblends//Booking System//EN
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
DTSTART:${startDateStr}
DTEND:${endDateStr}
DTSTAMP:${nowStr}
UID:${booking.id}@chinblends.com
SUMMARY:${booking.service} - Chinblends
DESCRIPTION:Appointment for ${booking.service}\\nDuration: ${booking.duration}\\nCustomer: ${booking.customerName}\\nPhone: ${booking.customerPhone}
STATUS:CONFIRMED
SEQUENCE:0
BEGIN:VALARM
TRIGGER:${alarmStr}
DESCRIPTION:Reminder: Your appointment at Chinblends is in 15 minutes
ACTION:DISPLAY
END:VALARM
END:VEVENT
END:VCALENDAR`;

  return icsContent;
}

// Calendar cancellation event generator
function generateCancellationEvent(booking) {
  // Convert 12-hour time to 24-hour format
  const convertTo24Hour = (time12) => {
    const [time, period] = time12.split(' ');
    let [hours, minutes] = time.split(':');
    hours = parseInt(hours);

    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }

    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  };

  // Parse the booking date and time
  const bookingDate = new Date(booking.date);
  const [hours, minutes] = convertTo24Hour(booking.time).split(':');

  // Set the start time
  const startDate = new Date(bookingDate);
  startDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

  // Calculate end time based on duration
  const durationMinutes = parseInt(booking.duration);
  const endDate = new Date(startDate.getTime() + durationMinutes * 60000);

  // Format dates for iCalendar (YYYYMMDDTHHMMSS)
  const formatICalDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const sec = String(date.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}T${hour}${min}${sec}`;
  };

  const startDateStr = formatICalDate(startDate);
  const endDateStr = formatICalDate(endDate);
  const nowStr = formatICalDate(new Date());

  // Generate the cancellation .ics file content
  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Chinblends//Booking System//EN
CALSCALE:GREGORIAN
METHOD:CANCEL
BEGIN:VEVENT
DTSTART:${startDateStr}
DTEND:${endDateStr}
DTSTAMP:${nowStr}
UID:${booking.id}@chinblends.com
SUMMARY:${booking.service} - Chinblends
STATUS:CANCELLED
SEQUENCE:1
END:VEVENT
END:VCALENDAR`;

  return icsContent;
}

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
      const client = await getRedisClient();
      const bookingsData = await client.get('bookings');
      const bookings = bookingsData ? JSON.parse(bookingsData) : [];
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
      const client = await getRedisClient();
      const bookingsData = await client.get('bookings');
      const bookings = bookingsData ? JSON.parse(bookingsData) : [];

      // Add new booking
      bookings.push(booking);

      // Save to Redis store
      await client.set('bookings', JSON.stringify(bookings));

      // Create TickTick task (don't fail booking if TickTick fails)
      try {
        if (tickTickService.isEnabled()) {
          console.log('Creating TickTick task for booking...');
          const tickTickTask = await tickTickService.createTask(booking);
          if (tickTickTask && tickTickTask.id) {
            booking.tickTickTaskId = tickTickTask.id;
            // Update booking with TickTick task ID
            const updatedBookings = bookings.map(b => b.id === booking.id ? booking : b);
            await client.set('bookings', JSON.stringify(updatedBookings));
            console.log('✓ TickTick task created:', tickTickTask.id);
          }
        }
      } catch (tickTickError) {
        console.error('❌ Error creating TickTick task (booking still created):', tickTickError);
        console.error('TickTick error details:', tickTickError.message);
      }

      // Send confirmation emails (don't fail booking if email fails)
      try {
        console.log('Attempting to send booking notification emails...');
        console.log('EMAIL_USER:', process.env.EMAIL_USER);
        console.log('Customer email:', booking.customerEmail);

        await sendBookingEmail(booking);
        console.log('✓ Booking email sent to barber successfully');

        await sendCustomerConfirmationEmail(booking);
        console.log('✓ Confirmation email sent to customer successfully');
      } catch (emailError) {
        console.error('❌ Error sending emails (booking still created):', emailError);
        console.error('Email error details:', emailError.message);
        console.error('Email error code:', emailError.code);
        console.error('Email error stack:', emailError.stack);
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

  if (req.method === 'PUT') {
    try {
      const updatedBooking = req.body;

      if (!updatedBooking.id) {
        return res.status(400).json({ error: 'Booking ID is required' });
      }

      // Get existing bookings
      const client = await getRedisClient();
      const bookingsData = await client.get('bookings');
      const bookings = bookingsData ? JSON.parse(bookingsData) : [];

      // Find and update the booking
      const bookingIndex = bookings.findIndex(b => b.id === updatedBooking.id);

      if (bookingIndex === -1) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      // Store old booking details for email
      const oldBooking = bookings[bookingIndex];

      // Update the booking
      bookings[bookingIndex] = updatedBooking;
      await client.set('bookings', JSON.stringify(bookings));

      // Update TickTick task (don't fail update if TickTick fails)
      try {
        if (tickTickService.isEnabled() && oldBooking.tickTickTaskId) {
          console.log('Updating TickTick task for rescheduled booking...');
          const tickTickTask = await tickTickService.updateTask(oldBooking.tickTickTaskId, updatedBooking);
          if (tickTickTask && tickTickTask.id) {
            updatedBooking.tickTickTaskId = tickTickTask.id;
            bookings[bookingIndex] = updatedBooking;
            await client.set('bookings', JSON.stringify(bookings));
            console.log('✓ TickTick task updated:', tickTickTask.id);
          }
        } else if (tickTickService.isEnabled() && !oldBooking.tickTickTaskId) {
          // If there was no TickTick task before, create one now
          console.log('Creating TickTick task for rescheduled booking (no previous task)...');
          const tickTickTask = await tickTickService.createTask(updatedBooking);
          if (tickTickTask && tickTickTask.id) {
            updatedBooking.tickTickTaskId = tickTickTask.id;
            bookings[bookingIndex] = updatedBooking;
            await client.set('bookings', JSON.stringify(bookings));
            console.log('✓ TickTick task created:', tickTickTask.id);
          }
        }
      } catch (tickTickError) {
        console.error('❌ Error updating TickTick task (booking still updated):', tickTickError);
        console.error('TickTick error details:', tickTickError.message);
      }

      // Send reschedule notification emails (don't fail update if email fails)
      try {
        console.log('Attempting to send reschedule notification emails...');
        await sendRescheduleNotificationEmail(updatedBooking, oldBooking);
        console.log('✓ Reschedule notification sent to customer successfully');

        await sendBarberRescheduleNotification(updatedBooking, oldBooking);
        console.log('✓ Reschedule notification sent to barber successfully');
      } catch (emailError) {
        console.error('❌ Error sending reschedule emails (booking still updated):', emailError);
        console.error('Email error details:', emailError.message);
      }

      return res.status(200).json({ success: true, booking: updatedBooking });
    } catch (error) {
      console.error('Error updating booking:', error);
      console.error('Error details:', error.message);
      return res.status(500).json({ error: 'Failed to update booking', details: error.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const bookingId = req.query.id;

      // Get existing bookings
      const client = await getRedisClient();
      const bookingsData = await client.get('bookings');
      const bookings = bookingsData ? JSON.parse(bookingsData) : [];

      // Find the booking to cancel
      const booking = bookings.find(b => b.id === bookingId);

      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      // Remove booking
      const updatedBookings = bookings.filter(b => b.id !== bookingId);
      await client.set('bookings', JSON.stringify(updatedBookings));

      // Delete TickTick task (don't fail cancellation if TickTick fails)
      try {
        if (tickTickService.isEnabled() && booking.tickTickTaskId) {
          console.log('Deleting TickTick task for cancelled booking...');
          const deleted = await tickTickService.deleteTask(booking.tickTickTaskId);
          if (deleted) {
            console.log('✓ TickTick task deleted:', booking.tickTickTaskId);
          }
        }
      } catch (tickTickError) {
        console.error('❌ Error deleting TickTick task (booking still cancelled):', tickTickError);
        console.error('TickTick error details:', tickTickError.message);
      }

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
  const icsContent = generateCalendarEvent(booking);

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
        <p style="color: #2563eb; font-weight: bold;">📅 Calendar event attached - Add to your calendar!</p>
      </div>
    `,
    attachments: [
      {
        filename: 'appointment.ics',
        content: icsContent,
        contentType: 'text/calendar; charset=utf-8; method=REQUEST'
      }
    ]
  };

  const result = await transporter.sendMail(emailContent);
  console.log('Booking email sent:', result.messageId);
  return result;
}

async function sendCustomerConfirmationEmail(booking) {
  // Only send if we have a valid email
  if (!booking.customerEmail || !booking.customerEmail.includes('@')) {
    console.log('Skipping customer email - no valid email address provided');
    return;
  }

  const icsContent = generateCalendarEvent(booking);

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
        <p style="color: #2563eb; font-weight: bold;">📅 Calendar event attached - Add to your calendar for automatic reminders!</p>
        <p style="color: #666;">
          If you need to cancel or reschedule, please contact us:<br>
          Email: chinblends@gmail.com<br>
          Instagram: @chin_blends
        </p>
      </div>
    `,
    attachments: [
      {
        filename: 'appointment.ics',
        content: icsContent,
        contentType: 'text/calendar; charset=utf-8; method=REQUEST'
      }
    ]
  };

  const result = await transporter.sendMail(customerEmail);
  console.log('Customer confirmation email sent:', result.messageId);
  return result;
}

async function sendCancellationEmail(booking) {
  const icsCancellation = generateCancellationEvent(booking);

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
        <p style="color: #dc2626; font-weight: bold;">📅 Calendar cancellation attached - This will automatically remove the event from your calendar!</p>
        <p>Please contact us to reschedule your appointment.</p>
        <p style="color: #666;">
          Contact: chinblends@gmail.com<br>
          Instagram: @chin_blends
        </p>
      </div>
    `,
    attachments: [
      {
        filename: 'cancellation.ics',
        content: icsCancellation,
        contentType: 'text/calendar; charset=utf-8; method=CANCEL'
      }
    ]
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
  const icsCancellation = generateCancellationEvent(booking);

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
        <p style="color: #dc2626; font-weight: bold;">📅 Calendar cancellation attached - This will automatically remove the event from your calendar!</p>
        <p style="color: #666;">This time slot is now available for other bookings.</p>
      </div>
    `,
    attachments: [
      {
        filename: 'cancellation.ics',
        content: icsCancellation,
        contentType: 'text/calendar; charset=utf-8; method=CANCEL'
      }
    ]
  };

  try {
    await transporter.sendMail(barberEmail);
  } catch (error) {
    console.error('Error sending barber cancellation notification:', error);
  }
}

async function sendRescheduleNotificationEmail(updatedBooking, oldBooking) {
  // Only send if we have a valid email
  if (!updatedBooking.customerEmail || !updatedBooking.customerEmail.includes('@')) {
    console.log('Skipping customer reschedule email - no valid email address provided');
    return;
  }

  // Generate cancellation for old appointment
  const icsCancellation = generateCancellationEvent(oldBooking);
  // Generate new event for rescheduled appointment
  const icsNewEvent = generateCalendarEvent(updatedBooking);

  // Email to customer notifying them of the reschedule
  const customerEmail = {
    from: process.env.EMAIL_USER,
    to: updatedBooking.customerEmail,
    subject: 'Appointment Rescheduled - Chinblends',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Appointment Rescheduled</h2>
        <p>Hi ${updatedBooking.customerName},</p>
        <p>Your appointment has been rescheduled. Here are the updated details:</p>

        <div style="background: #fee; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
          <h3 style="margin-top: 0; color: #dc2626;">Previous Appointment:</h3>
          <p><strong>Date:</strong> ${new Date(oldBooking.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p><strong>Time:</strong> ${oldBooking.time}</p>
        </div>

        <div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
          <h3 style="margin-top: 0; color: #2563eb;">New Appointment:</h3>
          <p><strong>Service:</strong> ${updatedBooking.service}</p>
          <p><strong>Duration:</strong> ${updatedBooking.duration}</p>
          <p><strong>Date:</strong> ${new Date(updatedBooking.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p><strong>Time:</strong> ${updatedBooking.time}</p>
        </div>

        <p style="color: #2563eb; font-weight: bold;">📅 Calendar events attached - Your calendar will automatically update!</p>
        <p>We look forward to seeing you at the new time!</p>
        <p style="color: #666;">
          If you have any questions or need to make changes, please contact us:<br>
          Email: chinblends@gmail.com<br>
          Instagram: @chin_blends
        </p>
      </div>
    `,
    attachments: [
      {
        filename: 'cancellation.ics',
        content: icsCancellation,
        contentType: 'text/calendar; charset=utf-8; method=CANCEL'
      },
      {
        filename: 'new-appointment.ics',
        content: icsNewEvent,
        contentType: 'text/calendar; charset=utf-8; method=REQUEST'
      }
    ]
  };

  const result = await transporter.sendMail(customerEmail);
  console.log('Customer reschedule notification sent:', result.messageId);
  return result;
}

async function sendBarberRescheduleNotification(updatedBooking, oldBooking) {
  // Generate cancellation for old appointment
  const icsCancellation = generateCancellationEvent(oldBooking);
  // Generate new event for rescheduled appointment
  const icsNewEvent = generateCalendarEvent(updatedBooking);

  // Email to barber notifying them of the reschedule
  const barberEmail = {
    from: process.env.EMAIL_USER,
    to: 'chinblends@gmail.com',
    subject: `Booking Rescheduled: ${updatedBooking.service} - ${updatedBooking.customerName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Booking Rescheduled</h2>
        <p>A booking has been rescheduled:</p>

        <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Customer:</strong> ${updatedBooking.customerName}</p>
          <p><strong>Phone:</strong> ${updatedBooking.customerPhone}</p>
          <p><strong>Email:</strong> ${updatedBooking.customerEmail}</p>
          <p><strong>Service:</strong> ${updatedBooking.service}</p>
          <p><strong>Duration:</strong> ${updatedBooking.duration}</p>
        </div>

        <div style="background: #fee; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
          <h3 style="margin-top: 0; color: #dc2626;">Previous Time:</h3>
          <p><strong>Date:</strong> ${new Date(oldBooking.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p><strong>Time:</strong> ${oldBooking.time}</p>
        </div>

        <div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
          <h3 style="margin-top: 0; color: #2563eb;">New Time:</h3>
          <p><strong>Date:</strong> ${new Date(updatedBooking.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p><strong>Time:</strong> ${updatedBooking.time}</p>
        </div>

        <p style="color: #2563eb; font-weight: bold;">📅 Calendar events attached - Your calendar will automatically update!</p>
        <p style="color: #666;">Your schedule has been updated accordingly.</p>
      </div>
    `,
    attachments: [
      {
        filename: 'cancellation.ics',
        content: icsCancellation,
        contentType: 'text/calendar; charset=utf-8; method=CANCEL'
      },
      {
        filename: 'new-appointment.ics',
        content: icsNewEvent,
        contentType: 'text/calendar; charset=utf-8; method=REQUEST'
      }
    ]
  };

  try {
    const result = await transporter.sendMail(barberEmail);
    console.log('Barber reschedule notification sent:', result.messageId);
    return result;
  } catch (error) {
    console.error('Error sending barber reschedule notification:', error);
  }
}
