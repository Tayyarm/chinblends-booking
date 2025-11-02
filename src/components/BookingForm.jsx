import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function BookingForm({ service, timeSlot, onBack }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const booking = {
      id: `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      service: service.name,
      duration: service.duration,
      date: timeSlot.date.toISOString().split('T')[0],
      time: timeSlot.time,
      customerName: formData.name,
      customerPhone: formData.phone,
      createdAt: new Date().toISOString()
    };

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(booking),
      });

      if (!response.ok) {
        throw new Error('Failed to create booking');
      }

      navigate('/success');
    } catch (err) {
      console.error('Booking error:', err);
      // Fallback to localStorage for local development
      const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
      bookings.push(booking);
      localStorage.setItem('bookings', JSON.stringify(bookings));
      navigate('/success');
    } finally {
      setLoading(false);
    }
  };

  const formatDisplayDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">Your Details</h2>
      <p className="text-gray-600 mb-8 text-center">Just a few more details to confirm your booking</p>

      {/* Booking Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Booking Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Service:</span>
            <span className="font-medium">{service.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Duration:</span>
            <span className="font-medium">{service.duration}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Date:</span>
            <span className="font-medium">{formatDisplayDate(timeSlot.date)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Time:</span>
            <span className="font-medium">{timeSlot.time}</span>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Full Name *
          </label>
          <input
            type="text"
            id="name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-black focus:outline-none transition-colors"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number *
          </label>
          <input
            type="tel"
            id="phone"
            required
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-black focus:outline-none transition-colors"
            placeholder="(555) 123-4567"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 px-6 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Booking...' : 'Confirm Booking'}
        </button>

        <button
          type="button"
          onClick={onBack}
          className="w-full py-3 px-6 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
        >
          ← Back to Time Selection
        </button>
      </form>
    </div>
  );
}

export default BookingForm;
