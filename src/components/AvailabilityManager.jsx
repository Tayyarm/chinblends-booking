import { useState, useEffect } from 'react';

const timeSlots = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
  '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM',
  '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM', '08:00 PM'
];

function AvailabilityManager() {
  const [availability, setAvailability] = useState({});
  const [weekDates, setWeekDates] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Generate next 7 days starting from today
    const generateWeekDates = () => {
      const dates = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        dates.push(date);
      }
      return dates;
    };

    const dates = generateWeekDates();
    setWeekDates(dates);
    loadAvailability();

    // Update the week every day at midnight
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const msUntilMidnight = tomorrow - now;

    const midnightTimer = setTimeout(() => {
      const newDates = generateWeekDates();
      setWeekDates(newDates);

      // Clean up past dates from availability
      const saved = localStorage.getItem('availability');
      if (saved) {
        const availability = JSON.parse(saved);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0];

        // Remove dates before today
        const cleaned = {};
        Object.keys(availability).forEach(dateStr => {
          if (dateStr >= todayStr) {
            cleaned[dateStr] = availability[dateStr];
          }
        });
        localStorage.setItem('availability', JSON.stringify(cleaned));
        setAvailability(cleaned);
      }

      // Set up daily interval
      const dailyInterval = setInterval(() => {
        const refreshedDates = generateWeekDates();
        setWeekDates(refreshedDates);

        // Clean up availability again
        const saved = localStorage.getItem('availability');
        if (saved) {
          const availability = JSON.parse(saved);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const todayStr = today.toISOString().split('T')[0];

          const cleaned = {};
          Object.keys(availability).forEach(dateStr => {
            if (dateStr >= todayStr) {
              cleaned[dateStr] = availability[dateStr];
            }
          });
          localStorage.setItem('availability', JSON.stringify(cleaned));
          setAvailability(cleaned);
        }
      }, 24 * 60 * 60 * 1000);

      return () => clearInterval(dailyInterval);
    }, msUntilMidnight);

    return () => clearTimeout(midnightTimer);
  }, []);

  const loadAvailability = () => {
    console.log('Loading availability from localStorage...');
    const saved = localStorage.getItem('availability');
    if (saved) {
      const parsed = JSON.parse(saved);
      console.log('Loaded availability:', parsed);
      setAvailability(parsed);
    } else {
      console.log('No availability found, starting fresh');
      setAvailability({});
    }
  };

  const toggleTimeSlot = (dateStr, time) => {
    setAvailability(prev => {
      const dateSlots = prev[dateStr] || [];
      const isSelected = dateSlots.includes(time);

      const newDateSlots = isSelected
        ? dateSlots.filter(t => t !== time)
        : [...dateSlots, time].sort((a, b) => timeSlots.indexOf(a) - timeSlots.indexOf(b));

      const newAvailability = {
        ...prev,
        [dateStr]: newDateSlots
      };

      console.log(`Toggled ${time} for ${dateStr}:`, newDateSlots);
      return newAvailability;
    });
  };

  const selectAllForDate = (dateStr) => {
    setAvailability(prev => ({
      ...prev,
      [dateStr]: [...timeSlots]
    }));
  };

  const clearAllForDate = (dateStr) => {
    setAvailability(prev => ({
      ...prev,
      [dateStr]: []
    }));
  };

  const saveAvailability = () => {
    setSaving(true);
    console.log('Saving availability:', availability);

    // Save to localStorage
    localStorage.setItem('availability', JSON.stringify(availability));

    // Show confirmation
    setTimeout(() => {
      setSaving(false);
      alert('Availability saved! Customers can now see these times.');
      console.log('Availability saved to localStorage');
    }, 500);
  };

  const formatDate = (date) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return {
      dayName: days[date.getDay()],
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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">How it works</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Click time slots to mark yourself as available for specific dates</li>
                <li>Set your availability for the next 7 days</li>
                <li>Past days automatically disappear at midnight</li>
                <li>Customers will ONLY see the times you select</li>
                <li>Already booked times won't show to customers</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button - Top */}
      <div className="flex justify-end">
        <button
          onClick={saveAvailability}
          disabled={saving}
          className="px-8 py-3 bg-black text-white rounded-lg font-bold text-lg hover:bg-gray-800 transition-colors disabled:bg-gray-400 shadow-lg"
        >
          {saving ? 'Saving...' : '💾 Save Availability'}
        </button>
      </div>

      {/* Dates */}
      <div className="space-y-6">
        {weekDates.map(date => {
          const dateStr = date.toISOString().split('T')[0];
          const dateSlots = availability[dateStr] || [];
          const selectedCount = dateSlots.length;
          const formatted = formatDate(date);
          const today = isToday(date);
          const tomorrow = isTomorrow(date);

          return (
            <div key={dateStr} className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden">
              {/* Date Header */}
              <div className="bg-gray-50 px-6 py-4 border-b-2 border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">
                        {formatted.dayName}, {formatted.month} {formatted.date}
                      </h3>
                      {today && (
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">
                          TODAY
                        </span>
                      )}
                      {tomorrow && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">
                          TOMORROW
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {selectedCount === 0 ? (
                        <span className="text-red-600 font-semibold">⚠️ No times selected - You're unavailable</span>
                      ) : (
                        <span className="text-green-600 font-semibold">✓ {selectedCount} time slots available</span>
                      )}
                    </p>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => selectAllForDate(dateStr)}
                      className="px-4 py-2 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg border-2 border-green-200 transition-colors"
                    >
                      ✓ Select All
                    </button>
                    <button
                      onClick={() => clearAllForDate(dateStr)}
                      className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg border-2 border-red-200 transition-colors"
                    >
                      ✗ Clear All
                    </button>
                  </div>
                </div>
              </div>

              {/* Time Slots Grid */}
              <div className="p-6">
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                  {timeSlots.map(time => {
                    const isSelected = dateSlots.includes(time);
                    return (
                      <button
                        key={time}
                        onClick={() => toggleTimeSlot(dateStr, time)}
                        className={`p-3 rounded-lg text-sm font-bold transition-all border-2 ${
                          isSelected
                            ? 'bg-black text-white border-black shadow-md scale-105'
                            : 'bg-white text-gray-600 border-gray-300 hover:border-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Save Button - Bottom */}
      <div className="flex justify-center pt-4">
        <button
          onClick={saveAvailability}
          disabled={saving}
          className="px-12 py-4 bg-black text-white rounded-lg font-bold text-xl hover:bg-gray-800 transition-colors disabled:bg-gray-400 shadow-xl"
        >
          {saving ? 'Saving...' : '💾 Save Availability'}
        </button>
      </div>

      {/* Footer Note */}
      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
        <p className="text-sm text-yellow-800">
          <strong>Remember:</strong> Click "Save Availability" after making changes. Your customers will only see the times you've selected and saved.
        </p>
      </div>
    </div>
  );
}

export default AvailabilityManager;
