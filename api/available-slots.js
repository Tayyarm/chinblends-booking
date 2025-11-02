import { kv } from '@vercel/kv';

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const { date } = req.query;

      // Get the day of week for the requested date
      const requestedDate = new Date(date + 'T00:00:00');
      const dayName = daysOfWeek[requestedDate.getDay()];

      // Get barber's weekly availability
      const weeklyAvailability = await kv.get('weekly_availability') || {};
      const daySlots = weeklyAvailability[dayName] || [];

      // If barber hasn't set availability for this day, return empty
      if (daySlots.length === 0) {
        return res.status(200).json({
          date,
          availableSlots: [],
          bookedSlots: [],
        });
      }

      // Get all bookings
      const bookings = await kv.get('bookings') || [];

      // Find bookings for the requested date
      const bookedSlots = bookings
        .filter(booking => booking.date === date)
        .map(booking => booking.time);

      // Return available slots (barber's set times excluding booked ones)
      const availableSlots = daySlots.filter(slot => !bookedSlots.includes(slot));

      return res.status(200).json({
        date,
        availableSlots,
        bookedSlots,
      });
    } catch (error) {
      console.error('Error fetching available slots:', error);
      return res.status(500).json({ error: 'Failed to fetch available slots' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
