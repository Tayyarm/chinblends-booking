import { kv } from '@vercel/kv';

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
      const availability = await kv.get('weekly_availability') || {};
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
      await kv.set('weekly_availability', availability);

      return res.status(200).json({ success: true, availability });
    } catch (error) {
      console.error('Error saving availability:', error);
      return res.status(500).json({ error: 'Failed to save availability' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
