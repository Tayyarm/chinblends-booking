import { useState, useEffect } from 'react';

function TimeSlotPicker({ service, onSelect, onBack }) {
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [weekDates, setWeekDates] = useState([]);

  useEffect(() => {
    // Generate next 7 days starting from today
    const generateWeekDates = () => {
      const dates = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset to start of day

      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        dates.push(date);
      }
      return dates;
    };

    const dates = generateWeekDates();
    setWeekDates(dates);
    setSelectedDate(dates[0]);

    // Update the week every day at midnight to remove past days
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const msUntilMidnight = tomorrow - now;

    const midnightTimer = setTimeout(() => {
      const newDates = generateWeekDates();
      setWeekDates(newDates);
      setSelectedDate(newDates[0]);

      // Set up daily interval after first midnight
      const dailyInterval = setInterval(() => {
        const refreshedDates = generateWeekDates();
        setWeekDates(refreshedDates);
        setSelectedDate(refreshedDates[0]);
      }, 24 * 60 * 60 * 1000); // 24 hours

      return () => clearInterval(dailyInterval);
    }, msUntilMidnight);

    return () => clearTimeout(midnightTimer);
  }, []);

  useEffect(() => {
    if (selectedDate) {
      loadAvailableSlots(selectedDate);
    }
  }, [selectedDate]);

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

  const isTimeInPast = (date, timeSlot) => {
    const now = new Date();
    const slotDateTime = new Date(date);
    const [hours, minutes] = convertTo24Hour(timeSlot).split(':');
    slotDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    return slotDateTime < now;
  };

  const loadAvailableSlots = (date) => {
    console.log('=== LOADING SLOTS FOR CUSTOMER ===');
    console.log('Selected date:', date.toDateString());

    // Get barber's availability from localStorage
    const availabilityJSON = localStorage.getItem('availability');
    console.log('Raw availability from localStorage:', availabilityJSON);

    if (!availabilityJSON) {
      console.log('❌ No availability set by barber');
      setAvailableSlots([]);
      return;
    }

    const availability = JSON.parse(availabilityJSON);
    console.log('Parsed availability object:', availability);

    // Get available times for this specific date
    const dateStr = date.toISOString().split('T')[0];
    console.log('Looking for availability on:', dateStr);

    const dateSlots = availability[dateStr] || [];
    console.log(`Slots for ${dateStr}:`, dateSlots);

    if (dateSlots.length === 0) {
      console.log(`❌ Barber has no availability set for ${dateStr}`);
      setAvailableSlots([]);
      return;
    }

    // Get already booked slots
    const bookingsJSON = localStorage.getItem('bookings');
    const bookings = bookingsJSON ? JSON.parse(bookingsJSON) : [];
    console.log('All bookings:', bookings);

    const bookedTimes = bookings
      .filter(b => {
        console.log('Checking booking:', b.date, '===', dateStr, '?', b.date === dateStr);
        return b.date === dateStr;
      })
      .map(b => b.time);

    console.log('Booked times for this date:', bookedTimes);

    // Filter out booked times AND past times for today
    const today = new Date();
    const isSelectedDateToday = date.toDateString() === today.toDateString();

    const finalSlots = dateSlots.filter(slot => {
      // Filter out booked slots
      if (bookedTimes.includes(slot)) return false;

      // Filter out past times if it's today
      if (isSelectedDateToday && isTimeInPast(date, slot)) {
        console.log(`⏰ Filtering out past time: ${slot}`);
        return false;
      }

      return true;
    });

    console.log('✅ Final available slots:', finalSlots);

    setAvailableSlots(finalSlots);
  };

  const formatDate = (date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return {
      day: days[date.getDay()],
      date: date.getDate(),
      month: months[date.getMonth()],
      fullDate: date
    };
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isTomorrow = (date) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return date.toDateString() === tomorrow.toDateString();
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">Choose a Time</h2>
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-gray-600 text-center">
          <span className="font-semibold text-lg">{service.name}</span> • {service.duration}
        </p>
      </div>

      {/* Date Selector */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Select a Date</h3>
        <div className="grid grid-cols-7 gap-2">
          {weekDates.map((date, index) => {
            const formatted = formatDate(date);
            const isSelected = selectedDate && selectedDate.toDateString() === date.toDateString();
            const today = isToday(date);
            const tomorrow = isTomorrow(date);

            return (
              <button
                key={index}
                onClick={() => setSelectedDate(date)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  isSelected
                    ? 'bg-black text-white border-black shadow-lg scale-105'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-500'
                }`}
              >
                <div className="text-xs font-medium mb-1">{formatted.day}</div>
                <div className="text-2xl font-bold mb-1">{formatted.date}</div>
                <div className="text-xs">
                  {today ? 'Today' : tomorrow ? 'Tomorrow' : formatted.month}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Time Slots */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Available Times for {selectedDate && formatDate(selectedDate).day}, {selectedDate && formatDate(selectedDate).month} {selectedDate && formatDate(selectedDate).date}
          </h3>
          <span className={`text-sm font-bold px-3 py-1 rounded-full ${
            availableSlots.length > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {availableSlots.length} {availableSlots.length === 1 ? 'slot' : 'slots'} available
          </span>
        </div>

        {availableSlots.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
            <div className="text-gray-400 mb-4">
              <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-xl font-semibold text-gray-700 mb-2">No available times for this date</p>
            <p className="text-sm text-gray-500">Try selecting another day</p>
          </div>
        ) : (
          <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {availableSlots.map((slot, index) => (
                <button
                  key={index}
                  onClick={() => onSelect({ date: selectedDate, time: slot })}
                  className="p-4 rounded-lg border-2 font-bold text-base transition-all bg-white text-gray-900 border-gray-300 hover:border-black hover:bg-black hover:text-white hover:scale-105 hover:shadow-lg"
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <button
        onClick={onBack}
        className="mt-8 w-full py-4 px-6 bg-gray-100 text-gray-700 rounded-lg font-bold text-lg hover:bg-gray-200 transition-colors"
      >
        ← Back to Services
      </button>
    </div>
  );
}

export default TimeSlotPicker;
