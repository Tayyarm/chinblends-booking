import { useState, useEffect } from 'react';

function TimeSlotPicker({ service, onSelect, onBack }) {
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState([]);

  useEffect(() => {
    generateCalendar(currentMonth);
  }, [currentMonth]);

  const generateCalendar = (month) => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();

    // First day of the month
    const firstDay = new Date(year, monthIndex, 1);
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday

    // Last day of the month
    const lastDay = new Date(year, monthIndex + 1, 0);
    const daysInMonth = lastDay.getDate();

    const days = [];

    // Add empty slots for days before the month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, monthIndex, day);
      date.setHours(0, 0, 0, 0);

      // Only add if date is today or in the future
      if (date >= today) {
        days.push(date);
      } else {
        days.push(null); // Past dates shown as disabled
      }
    }

    setCalendarDays(days);

    // Set initial selected date to today if in current month, otherwise first available day
    if (!selectedDate) {
      const firstAvailable = days.find(d => d !== null);
      if (firstAvailable) {
        setSelectedDate(firstAvailable);
      }
    }
  };

  const goToPreviousMonth = () => {
    const today = new Date();
    const prevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);

    // Don't go to months before current month
    if (prevMonth.getFullYear() > today.getFullYear() ||
        (prevMonth.getFullYear() === today.getFullYear() && prevMonth.getMonth() >= today.getMonth())) {
      setCurrentMonth(prevMonth);
    }
  };

  const goToNextMonth = () => {
    const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    setCurrentMonth(nextMonth);
  };

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

    // Create a new date object using the date's year, month, and day to avoid timezone issues
    const slotDateTime = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );

    const [hours, minutes] = convertTo24Hour(timeSlot).split(':');
    slotDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    return slotDateTime < now;
  };

  const loadAvailableSlots = async (date) => {
    console.log('=== LOADING SLOTS FOR CUSTOMER ===');
    console.log('Selected date:', date.toDateString());

    try {
      // Get barber's weekly schedule from database
      const availResponse = await fetch('/api/availability');
      const availData = await availResponse.json();
      const weeklySchedule = availData.availability || {};
      console.log('Loaded weekly schedule from database:', weeklySchedule);

      // Get day of week (0 = Sunday, 6 = Saturday)
      const dayOfWeek = date.getDay();
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      console.log('Day of week:', dayOfWeek, dayNames[dayOfWeek]);

      // Get available times for this day of the week from recurring schedule
      const dateSlots = weeklySchedule[dayOfWeek] || [];
      console.log(`Recurring slots for ${dayNames[dayOfWeek]}s:`, dateSlots);

      // Get the actual date string for checking bookings
      const dateStr = date.toISOString().split('T')[0];
      console.log('Date string for booking check:', dateStr);

      if (dateSlots.length === 0) {
        console.log(`❌ Barber is closed on ${dayNames[dayOfWeek]}s`);
        setAvailableSlots([]);
        return;
      }

      // Get already booked slots from database
      const bookingsResponse = await fetch('/api/bookings');
      const bookingsData = await bookingsResponse.json();
      const bookings = bookingsData.bookings || [];
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
    } catch (error) {
      console.error('Error loading slots:', error);
      // Fallback to localStorage for local development
      const weeklyScheduleJSON = localStorage.getItem('weeklySchedule');
      const bookingsJSON = localStorage.getItem('bookings');

      if (!weeklyScheduleJSON) {
        console.log('❌ No weekly schedule set by barber');
        setAvailableSlots([]);
        return;
      }

      const weeklySchedule = JSON.parse(weeklyScheduleJSON);
      const dayOfWeek = date.getDay();
      const dateSlots = weeklySchedule[dayOfWeek] || [];
      const dateStr = date.toISOString().split('T')[0];

      if (dateSlots.length === 0) {
        setAvailableSlots([]);
        return;
      }

      const bookings = bookingsJSON ? JSON.parse(bookingsJSON) : [];
      const bookedTimes = bookings
        .filter(b => b.date === dateStr)
        .map(b => b.time);

      const today = new Date();
      const isSelectedDateToday = date.toDateString() === today.toDateString();

      const finalSlots = dateSlots.filter(slot => {
        if (bookedTimes.includes(slot)) return false;
        if (isSelectedDateToday && isTimeInPast(date, slot)) return false;
        return true;
      });

      setAvailableSlots(finalSlots);
    }
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

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">Choose a Time</h2>
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-gray-600 text-center">
          <span className="font-semibold text-lg">{service.name}</span> • {service.duration}
        </p>
      </div>

      {/* Calendar */}
      <div className="mb-8">
        <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={goToPreviousMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={currentMonth.getMonth() === new Date().getMonth() && currentMonth.getFullYear() === new Date().getFullYear()}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h3 className="text-2xl font-bold text-gray-900">
              {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>
            <button
              onClick={goToNextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Day Labels */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {dayLabels.map(day => (
              <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((date, index) => {
              if (!date) {
                return <div key={index} className="p-4"></div>;
              }

              const isSelected = selectedDate && selectedDate.toDateString() === date.toDateString();
              const today = isToday(date);

              return (
                <button
                  key={index}
                  onClick={() => setSelectedDate(date)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'bg-black text-white border-black shadow-lg scale-105'
                      : today
                      ? 'bg-green-50 text-gray-900 border-green-300 hover:border-green-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-gray-500'
                  }`}
                >
                  <div className="text-xl font-bold">
                    {date.getDate()}
                  </div>
                  {today && <div className="text-xs mt-1">Today</div>}
                </button>
              );
            })}
          </div>
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
