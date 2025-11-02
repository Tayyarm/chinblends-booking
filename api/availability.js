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
      const availability = availabilityData ? JSON.parse(availabilityData) : {};
      return res.status(200).json({ availability });
    } catch (error) {
      console.error('Error fetching availability:', error);
      return res.status(500).json({ error: 'Failed to fetch availability' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { availability } = req.body;

      // Save weekly availability
      const client = await getRedisClient();
      await client.set('availability', JSON.stringify(availability));

      return res.status(200).json({ success: true, availability });
    } catch (error) {
      console.error('Error saving availability:', error);
      return res.status(500).json({ error: 'Failed to save availability' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
