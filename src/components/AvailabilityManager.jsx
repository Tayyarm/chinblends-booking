import { useState, useEffect } from 'react';

const timeSlots = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
  '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM',
  '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM', '08:00 PM'
];

const daysOfWeek = [
  { id: 0, name: 'Sunday', short: 'Sun' },
  { id: 1, name: 'Monday', short: 'Mon' },
  { id: 2, name: 'Tuesday', short: 'Tue' },
  { id: 3, name: 'Wednesday', short: 'Wed' },
  { id: 4, name: 'Thursday', short: 'Thu' },
  { id: 5, name: 'Friday', short: 'Fri' },
  { id: 6, name: 'Saturday', short: 'Sat' }
];

function AvailabilityManager() {
  const [weeklySchedule, setWeeklySchedule] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadWeeklySchedule();
  }, []);

  const loadWeeklySchedule = async () => {
    console.log('Loading weekly schedule from database...');
    try {
      const response = await fetch('/api/availability');
      const data = await response.json();
      console.log('Loaded weekly schedule:', data.availability);
      setWeeklySchedule(data.availability || {});
    } catch (error) {
      console.error('Error loading weekly schedule:', error);
      // Fallback to localStorage for local development
      const saved = localStorage.getItem('weeklySchedule');
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('Loaded weekly schedule from localStorage (fallback):', parsed);
        setWeeklySchedule(parsed);
      } else {
        console.log('No weekly schedule found, starting fresh');
        setWeeklySchedule({});
      }
    }
  };

  const toggleTimeSlot = (dayOfWeek, time) => {
    setWeeklySchedule(prev => {
      const daySlots = prev[dayOfWeek] || [];
      const isSelected = daySlots.includes(time);

      const newDaySlots = isSelected
        ? daySlots.filter(t => t !== time)
        : [...daySlots, time].sort((a, b) => timeSlots.indexOf(a) - timeSlots.indexOf(b));

      const newSchedule = {
        ...prev,
        [dayOfWeek]: newDaySlots
      };

      console.log(`Toggled ${time} for ${daysOfWeek[dayOfWeek].name}:`, newDaySlots);
      return newSchedule;
    });
  };

  const selectAllForDay = (dayOfWeek) => {
    setWeeklySchedule(prev => ({
      ...prev,
      [dayOfWeek]: [...timeSlots]
    }));
  };

  const clearAllForDay = (dayOfWeek) => {
    setWeeklySchedule(prev => ({
      ...prev,
      [dayOfWeek]: []
    }));
  };

  const saveWeeklySchedule = async () => {
    setSaving(true);
    console.log('Saving weekly schedule:', weeklySchedule);

    try {
      const response = await fetch('/api/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ availability: weeklySchedule }),
      });

      if (response.ok) {
        alert('Weekly schedule saved! This schedule will repeat every week. Customers can now see these times on all devices.');
        console.log('Weekly schedule saved to database');
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Error saving weekly schedule:', error);
      // Fallback to localStorage for local development
      localStorage.setItem('weeklySchedule', JSON.stringify(weeklySchedule));
      alert('Weekly schedule saved locally!');
      console.log('Weekly schedule saved to localStorage (fallback)');
    } finally {
      setSaving(false);
    }
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
            <h3 className="text-sm font-medium text-blue-800">How it works - Recurring Weekly Schedule</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Set your availability for each day of the week (Sunday - Saturday)</li>
                <li>This schedule repeats every week automatically</li>
                <li>Customers will see these times for all future weeks</li>
                <li>Already booked times won't show to customers</li>
                <li>Change anytime to update your weekly schedule</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button - Top */}
      <div className="flex justify-end">
        <button
          onClick={saveWeeklySchedule}
          disabled={saving}
          className="px-8 py-3 bg-black text-white rounded-lg font-bold text-lg hover:bg-gray-800 transition-colors disabled:bg-gray-400 shadow-lg"
        >
          {saving ? 'Saving...' : '💾 Save Weekly Schedule'}
        </button>
      </div>

      {/* Days of Week */}
      <div className="space-y-6">
        {daysOfWeek.map(day => {
          const daySlots = weeklySchedule[day.id] || [];
          const selectedCount = daySlots.length;
          const today = new Date().getDay();
          const isToday = day.id === today;

          return (
            <div key={day.id} className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden">
              {/* Day Header */}
              <div className="bg-gray-50 px-6 py-4 border-b-2 border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">
                        {day.name}
                      </h3>
                      {isToday && (
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">
                          TODAY
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {selectedCount === 0 ? (
                        <span className="text-red-600 font-semibold">⚠️ No times selected - Closed on {day.name}s</span>
                      ) : (
                        <span className="text-green-600 font-semibold">✓ {selectedCount} time slots available every {day.name}</span>
                      )}
                    </p>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => selectAllForDay(day.id)}
                      className="px-4 py-2 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg border-2 border-green-200 transition-colors"
                    >
                      ✓ Select All
                    </button>
                    <button
                      onClick={() => clearAllForDay(day.id)}
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
                    const isSelected = daySlots.includes(time);
                    return (
                      <button
                        key={time}
                        onClick={() => toggleTimeSlot(day.id, time)}
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
          onClick={saveWeeklySchedule}
          disabled={saving}
          className="px-12 py-4 bg-black text-white rounded-lg font-bold text-xl hover:bg-gray-800 transition-colors disabled:bg-gray-400 shadow-xl"
        >
          {saving ? 'Saving...' : '💾 Save Weekly Schedule'}
        </button>
      </div>

      {/* Footer Note */}
      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
        <p className="text-sm text-yellow-800">
          <strong>Remember:</strong> This is your recurring weekly schedule. Set your hours for each day and they'll repeat every week. Customers will see these times on all future dates.
        </p>
      </div>
    </div>
  );
}

export default AvailabilityManager;
