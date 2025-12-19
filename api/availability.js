import { createClient } from 'redis';

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

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      // Get barber's weekly availability
      const client = await getRedisClient();
      const availabilityData = await client.get('availability');
      let availability = availabilityData ? JSON.parse(availabilityData) : {};

      // Migrate old format to new format if needed
      if (availability && !availability.defaultSchedule && !availability.dateOverrides) {
        // Old format detected - migrate to new structure
        availability = {
          defaultSchedule: availability,
          dateOverrides: {}
        };
        // Save migrated data back
        await client.set('availability', JSON.stringify(availability));
        console.log('Migrated old availability format to new structure');
      }

      return res.status(200).json({ availability });
    } catch (error) {
      console.error('Error fetching availability:', error);
      return res.status(500).json({ error: 'Failed to fetch availability' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { availability } = req.body;

      // Ensure proper structure
      const structuredAvailability = {
        defaultSchedule: availability.defaultSchedule || {},
        dateOverrides: availability.dateOverrides || {}
      };

      // Save availability
      const client = await getRedisClient();
      await client.set('availability', JSON.stringify(structuredAvailability));

      return res.status(200).json({ success: true, availability: structuredAvailability });
    } catch (error) {
      console.error('Error saving availability:', error);
      return res.status(500).json({ error: 'Failed to save availability' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { date, timeSlots } = req.body;

      if (!date) {
        return res.status(400).json({ error: 'Date is required' });
      }

      // Get current availability
      const client = await getRedisClient();
      const availabilityData = await client.get('availability');
      let availability = availabilityData ? JSON.parse(availabilityData) : { defaultSchedule: {}, dateOverrides: {} };

      // Ensure structure exists
      if (!availability.defaultSchedule) availability.defaultSchedule = {};
      if (!availability.dateOverrides) availability.dateOverrides = {};

      // Update or remove date override
      if (timeSlots === null || (Array.isArray(timeSlots) && timeSlots.length === 0)) {
        // Remove override (will use default schedule)
        delete availability.dateOverrides[date];
      } else {
        // Set date-specific override
        availability.dateOverrides[date] = timeSlots;
      }

      // Save updated availability
      await client.set('availability', JSON.stringify(availability));

      return res.status(200).json({ success: true, availability });
    } catch (error) {
      console.error('Error updating date override:', error);
      return res.status(500).json({ error: 'Failed to update date override' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { date } = req.query;

      if (!date) {
        return res.status(400).json({ error: 'Date is required' });
      }

      // Get current availability
      const client = await getRedisClient();
      const availabilityData = await client.get('availability');
      let availability = availabilityData ? JSON.parse(availabilityData) : { defaultSchedule: {}, dateOverrides: {} };

      // Ensure structure exists
      if (!availability.dateOverrides) availability.dateOverrides = {};

      // Remove date override
      delete availability.dateOverrides[date];

      // Save updated availability
      await client.set('availability', JSON.stringify(availability));

      return res.status(200).json({ success: true, availability });
    } catch (error) {
      console.error('Error deleting date override:', error);
      return res.status(500).json({ error: 'Failed to delete date override' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
