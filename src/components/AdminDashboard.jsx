import { useState, useEffect } from 'react';
import AvailabilityManager from './AvailabilityManager';

function AdminDashboard({ onLogout }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('availability');
  const [bookingsView, setBookingsView] = useState('upcoming');

  const convertTo24Hour = (time12) => {
    const [time, period] = time12.split(' ');
    let [hours, minutes] = time.split(':');
    hours = parseInt(hours);

    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }

    return `${hours.toString().padStart(2, '0')}:${minutes}:00`;
  };

  useEffect(() => {
    fetchBookings();

    // Refresh bookings every minute to update the display
    const interval = setInterval(() => {
      fetchBookings();
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/bookings');
      const data = await response.json();
      setBookings(data.bookings || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      // Fallback to localStorage for local development
      const localBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
      setBookings(localBookings);
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async (bookingId) => {
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      const response = await fetch(`/api/bookings?id=${bookingId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Booking cancelled successfully. Customer has been notified.');
        fetchBookings();
      } else {
        throw new Error('API failed');
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      // Fallback to localStorage for local development
      const localBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
      const updatedBookings = localBookings.filter(b => b.id !== bookingId);
      localStorage.setItem('bookings', JSON.stringify(updatedBookings));

      // Update state immediately
      setBookings(updatedBookings);
      alert('Booking cancelled successfully!');
    }
  };

  const upcomingBookings = bookings.filter(b => {
    // Parse date in local timezone by creating date parts separately
    const [year, month, day] = b.date.split('-').map(Number);
    const time24 = convertTo24Hour(b.time);
    const [hours, minutes] = time24.split(':').map(Number);
    const bookingDate = new Date(year, month - 1, day, hours, minutes);
    const now = new Date();
    return bookingDate >= now;
  });

  const pastBookings = bookings.filter(b => {
    // Parse date in local timezone by creating date parts separately
    const [year, month, day] = b.date.split('-').map(Number);
    const time24 = convertTo24Hour(b.time);
    const [hours, minutes] = time24.split(':').map(Number);
    const bookingDate = new Date(year, month - 1, day, hours, minutes);
    const now = new Date();
    return bookingDate < now;
  });

  const getRelativeDate = (dateStr) => {
    // Parse date in local timezone to avoid timezone issues
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to compare dates only
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0); // Reset time to compare dates only

    if (dateOnly.getTime() === today.getTime()) {
      return 'Today';
    } else if (dateOnly.getTime() === tomorrow.getTime()) {
      return 'Tomorrow';
    } else {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
    }
  };

  const displayBookings = bookingsView === 'upcoming' ? upcomingBookings : pastBookings;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
                <span className="text-white font-bold">CB</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Chinblends Admin</h1>
                <p className="text-sm text-gray-500">Manage your business</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="px-4 py-2 text-sm text-gray-600 hover:text-black transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('availability')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'availability'
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Set Availability
              </button>
              <button
                onClick={() => setActiveTab('bookings')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'bookings'
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Bookings ({upcomingBookings.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'availability' ? (
          <AvailabilityManager />
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="text-sm text-gray-600 mb-1">Total Bookings</div>
                <div className="text-3xl font-bold text-gray-900">{bookings.length}</div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="text-sm text-gray-600 mb-1">Upcoming</div>
                <div className="text-3xl font-bold text-blue-600">{upcomingBookings.length}</div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="text-sm text-gray-600 mb-1">Completed</div>
                <div className="text-3xl font-bold text-green-600">{pastBookings.length}</div>
              </div>
            </div>

            {/* Bookings Tabs */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="border-b border-gray-200">
                <div className="flex">
                  <button
                    onClick={() => setBookingsView('upcoming')}
                    className={`flex-1 px-6 py-4 text-sm font-medium ${
                      bookingsView === 'upcoming'
                        ? 'bg-black text-white'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Upcoming ({upcomingBookings.length})
                  </button>
                  <button
                    onClick={() => setBookingsView('past')}
                    className={`flex-1 px-6 py-4 text-sm font-medium ${
                      bookingsView === 'past'
                        ? 'bg-black text-white'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Past ({pastBookings.length})
                  </button>
                </div>
              </div>

              {/* Bookings List */}
              <div className="divide-y divide-gray-200">
                {loading ? (
                  <div className="p-8 text-center text-gray-500">Loading bookings...</div>
                ) : displayBookings.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    No {bookingsView} bookings
                  </div>
                ) : (
                  displayBookings.map((booking) => {
                    // Parse date in local timezone
                    const [year, month, day] = booking.date.split('-').map(Number);
                    const time24 = convertTo24Hour(booking.time);
                    const [hours, minutes] = time24.split(':').map(Number);
                    const bookingDateTime = new Date(year, month - 1, day, hours, minutes);
                    const isToday = bookingDateTime.toDateString() === new Date().toDateString();
                    const isTomorrow = bookingDateTime.toDateString() === new Date(Date.now() + 86400000).toDateString();
                    const relativeDate = getRelativeDate(booking.date);

                    return (
                      <div key={booking.id} className="p-6 bg-white hover:bg-gray-50 transition-all border-2 border-gray-200 rounded-xl mb-4 hover:shadow-lg hover:border-black">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            {/* Date and Time Header */}
                            <div className="flex items-center gap-3 mb-4">
                              <span className={`inline-flex items-center px-4 py-2 rounded-lg text-base font-bold ${
                                isToday ? 'bg-green-100 text-green-900 border-2 border-green-300' :
                                isTomorrow ? 'bg-blue-100 text-blue-900 border-2 border-blue-300' :
                                'bg-gray-100 text-gray-900 border-2 border-gray-300'
                              }`}>
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {relativeDate}
                              </span>
                              <span className="inline-flex items-center px-4 py-2 rounded-lg text-base font-bold bg-black text-white">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {booking.time}
                              </span>
                            </div>

                            {/* Customer Info */}
                            <div className="mb-3">
                              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                {booking.customerName}
                              </h3>
                              <div className="flex items-center gap-3">
                                <span className="px-4 py-1.5 bg-gray-900 text-white text-sm rounded-full font-semibold">
                                  {booking.service}
                                </span>
                                <a
                                  href={`tel:${booking.customerPhone}`}
                                  className="inline-flex items-center px-4 py-1.5 bg-blue-50 text-blue-700 text-sm rounded-full font-semibold hover:bg-blue-100 transition-colors border-2 border-blue-200"
                                >
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                  </svg>
                                  {booking.customerPhone}
                                </a>
                              </div>
                            </div>
                          </div>
                          {bookingsView === 'upcoming' && (
                            <button
                              onClick={() => cancelBooking(booking.id)}
                              className="ml-4 px-6 py-3 text-base font-bold text-red-700 bg-red-50 hover:bg-red-100 border-2 border-red-300 rounded-lg transition-colors"
                            >
                              Cancel Booking
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
