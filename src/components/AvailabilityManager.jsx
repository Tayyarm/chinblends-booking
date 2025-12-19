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
  const [viewMode, setViewMode] = useState('general'); // 'general' or 'specificdates'
  const [defaultSchedule, setDefaultSchedule] = useState({});
  const [dateOverrides, setDateOverrides] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAvailability();
  }, []);

  useEffect(() => {
    if (viewMode === 'specificdates') {
      generateCalendar(currentMonth);
    }
  }, [currentMonth, viewMode]);

  const loadAvailability = async () => {
    console.log('Loading availability from database...');
    try {
      const response = await fetch('/api/availability');
      const data = await response.json();
      console.log('Loaded availability:', data.availability);

      const availability = data.availability || {};

      // Handle both old and new format
      if (availability.defaultSchedule) {
        setDefaultSchedule(availability.defaultSchedule);
        setDateOverrides(availability.dateOverrides || {});
      } else {
        // Old format - treat as default schedule
        setDefaultSchedule(availability);
        setDateOverrides({});
      }
    } catch (error) {
      console.error('Error loading availability:', error);
      // Fallback to localStorage for local development
      const availabilityJSON = localStorage.getItem('availability');
      if (availabilityJSON) {
        try {
          const availability = JSON.parse(availabilityJSON);
          console.log('Loaded from localStorage (fallback):', availability);

          // Handle both old and new format
          if (availability.defaultSchedule) {
            setDefaultSchedule(availability.defaultSchedule);
            setDateOverrides(availability.dateOverrides || {});
          } else {
            // Old format - treat as default schedule
            setDefaultSchedule(availability);
            setDateOverrides({});
          }
        } catch (parseError) {
          console.error('Error parsing localStorage:', parseError);
          setDefaultSchedule({});
          setDateOverrides({});
        }
      } else {
        console.log('No availability found, starting fresh');
        setDefaultSchedule({});
        setDateOverrides({});
      }
    }
  };

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
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, monthIndex, day);
      date.setHours(0, 0, 0, 0);
      days.push(date);
    }

    setCalendarDays(days);

    // Auto-select today if in current month, otherwise first day of month
    if (!selectedDate || selectedDate.getMonth() !== monthIndex || selectedDate.getFullYear() !== year) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (today.getMonth() === monthIndex && today.getFullYear() === year) {
        setSelectedDate(today);
      } else {
        setSelectedDate(new Date(year, monthIndex, 1));
      }
    }
  };

  const goToPreviousMonth = () => {
    const prevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    setCurrentMonth(prevMonth);
  };

  const goToNextMonth = () => {
    const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    setCurrentMonth(nextMonth);
  };

  const getDateString = (date) => {
    return date.toISOString().split('T')[0];
  };

  const getSlotsForDate = (date) => {
    const dateStr = getDateString(date);

    // Check if there's an override for this specific date
    if (dateOverrides[dateStr]) {
      return dateOverrides[dateStr];
    }

    // Fall back to default schedule for this day of week
    const dayOfWeek = date.getDay();
    return defaultSchedule[dayOfWeek] || [];
  };

  const hasOverride = (date) => {
    const dateStr = getDateString(date);
    return dateOverrides.hasOwnProperty(dateStr);
  };

  const toggleTimeSlot = (dayOfWeek, time) => {
    setDefaultSchedule(prev => {
      const daySlots = prev[dayOfWeek] || [];
      const isSelected = daySlots.includes(time);

      const newDaySlots = isSelected
        ? daySlots.filter(t => t !== time)
        : [...daySlots, time].sort((a, b) => timeSlots.indexOf(a) - timeSlots.indexOf(b));

      return {
        ...prev,
        [dayOfWeek]: newDaySlots
      };
    });
  };

  const toggleThisWeekTimeSlot = (date, time) => {
    const dateStr = getDateString(date);
    const currentSlots = getSlotsForDate(date);
    const isSelected = currentSlots.includes(time);

    const newSlots = isSelected
      ? currentSlots.filter(t => t !== time)
      : [...currentSlots, time].sort((a, b) => timeSlots.indexOf(a) - timeSlots.indexOf(b));

    console.log(`Toggling time slot for ${dateStr}:`, {
      time,
      isSelected,
      currentSlots,
      newSlots
    });

    setDateOverrides(prev => {
      const updated = {
        ...prev,
        [dateStr]: newSlots
      };
      console.log('Updated dateOverrides:', updated);
      return updated;
    });
  };

  const selectAllForDay = (dayOfWeek) => {
    setDefaultSchedule(prev => ({
      ...prev,
      [dayOfWeek]: [...timeSlots]
    }));
  };

  const clearAllForDay = (dayOfWeek) => {
    setDefaultSchedule(prev => ({
      ...prev,
      [dayOfWeek]: []
    }));
  };

  const selectAllThisWeekDay = (date) => {
    const dateStr = getDateString(date);
    setDateOverrides(prev => ({
      ...prev,
      [dateStr]: [...timeSlots]
    }));
  };

  const clearAllThisWeekDay = (date) => {
    const dateStr = getDateString(date);
    console.log(`Clearing all slots for ${dateStr}`);
    setDateOverrides(prev => ({
      ...prev,
      [dateStr]: []
    }));
  };

  const saveSchedule = async () => {
    setSaving(true);
    const dataToSave = {
      defaultSchedule,
      dateOverrides
    };
    console.log('Saving schedule:', dataToSave);

    try {
      // Always save with POST to update the entire structure
      const response = await fetch('/api/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          availability: dataToSave
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Save response:', data);

        if (viewMode === 'general') {
          alert('General schedule saved! These times will apply to every week.');
        } else {
          alert('This week\'s schedule saved! Custom times will only apply to this week.');
        }
        console.log('Schedule saved to database');

        // Reload to ensure we have the latest data
        await loadAvailability();
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Error saving schedule:', error);
      // Save to localStorage for local development with BOTH defaultSchedule and dateOverrides
      localStorage.setItem('availability', JSON.stringify(dataToSave));

      if (viewMode === 'general') {
        alert('General schedule saved locally! (API not available)');
      } else {
        alert('This week\'s schedule saved locally! (API not available)');
      }
      console.log('Schedule saved to localStorage (fallback):', dataToSave);
    } finally {
      setSaving(false);
    }
  };

  const isPastDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  return (
    <div className="space-y-6">
      {/* View Mode Toggle */}
      <div className="flex justify-center gap-4">
        <button
          onClick={() => setViewMode('general')}
          className={`px-8 py-4 rounded-lg font-bold text-xl transition-all ${
            viewMode === 'general'
              ? 'bg-black text-white shadow-lg scale-105'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          General Schedule
        </button>
        <button
          onClick={() => setViewMode('specificdates')}
          className={`px-8 py-4 rounded-lg font-bold text-xl transition-all ${
            viewMode === 'specificdates'
              ? 'bg-purple-600 text-white shadow-lg scale-105'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Specific Dates
        </button>
      </div>

      {/* GENERAL SCHEDULE VIEW */}
      {viewMode === 'general' && (
        <>
          {/* Header */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">General Weekly Schedule</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Set your regular hours for each day of the week</li>
                    <li>These times apply to every week automatically</li>
                    <li>Use "Specific Dates" to override individual days (vacations, holidays, etc.)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button - Top */}
          <div className="flex justify-end">
            <button
              onClick={saveSchedule}
              disabled={saving}
              className="px-8 py-3 bg-black text-white rounded-lg font-bold text-lg hover:bg-gray-800 transition-colors disabled:bg-gray-400 shadow-lg"
            >
              {saving ? 'Saving...' : 'Save General Schedule'}
            </button>
          </div>

          {/* Days of Week */}
          <div className="space-y-6">
            {daysOfWeek.map(day => {
              const daySlots = defaultSchedule[day.id] || [];
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
                            <span className="text-red-600 font-semibold">Closed every {day.name}</span>
                          ) : (
                            <span className="text-green-600 font-semibold">{selectedCount} time slots every {day.name}</span>
                          )}
                        </p>
                      </div>
                      <div className="flex space-x-3">
                        <button
                          onClick={() => selectAllForDay(day.id)}
                          className="px-4 py-2 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg border-2 border-green-200 transition-colors"
                        >
                          Select All
                        </button>
                        <button
                          onClick={() => clearAllForDay(day.id)}
                          className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg border-2 border-red-200 transition-colors"
                        >
                          Clear All
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
              onClick={saveSchedule}
              disabled={saving}
              className="px-12 py-4 bg-black text-white rounded-lg font-bold text-xl hover:bg-gray-800 transition-colors disabled:bg-gray-400 shadow-xl"
            >
              {saving ? 'Saving...' : 'Save General Schedule'}
            </button>
          </div>
        </>
      )}

      {/* SPECIFIC DATES VIEW */}
      {viewMode === 'specificdates' && (
        <>
          {/* Header */}
          <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-purple-800">Customize Specific Dates</h3>
                <div className="mt-2 text-sm text-purple-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Select any date from the calendar to override its schedule</li>
                    <li>Perfect for vacations, holidays, or special hours</li>
                    <li>By default, all dates use your General Schedule</li>
                    <li>Changes only affect the selected date</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button - Top */}
          <div className="flex justify-end">
            <button
              onClick={saveSchedule}
              disabled={saving}
              className="px-8 py-3 bg-purple-600 text-white rounded-lg font-bold text-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400 shadow-lg"
            >
              {saving ? 'Saving...' : 'Save Custom Schedule'}
            </button>
          </div>

          {/* Calendar */}
          <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={goToPreviousMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h3 className="text-2xl font-bold text-gray-900">
                {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
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
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-2 mb-6">
              {calendarDays.map((date, index) => {
                if (!date) {
                  return <div key={index} className="p-4"></div>;
                }

                const isSelected = selectedDate && selectedDate.toDateString() === date.toDateString();
                const isToday = date.toDateString() === new Date().toDateString();
                const isCustom = hasOverride(date);

                return (
                  <button
                    key={index}
                    onClick={() => setSelectedDate(date)}
                    className={`p-3 rounded-lg border-2 transition-all relative ${
                      isSelected
                        ? 'bg-purple-600 text-white border-purple-600 shadow-lg scale-105'
                        : isToday
                        ? 'bg-green-50 text-gray-900 border-green-300 hover:border-green-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400'
                    }`}
                  >
                    <div className="text-lg font-bold">
                      {date.getDate()}
                    </div>
                    {isToday && !isSelected && <div className="text-xs mt-1">Today</div>}
                    {isCustom && (
                      <div className="absolute top-1 right-1 w-2 h-2 bg-purple-500 rounded-full"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Date Time Slots */}
          {selectedDate && (() => {
            const date = selectedDate;
            const dayOfWeek = date.getDay();
            const dayName = daysOfWeek[dayOfWeek].name;
            const dateSlots = getSlotsForDate(date);
            const selectedCount = dateSlots.length;
            const isToday = date.toDateString() === new Date().toDateString();
            const isPast = isPastDate(date);
            const isCustom = hasOverride(date);

            return (
              <div
                className={`bg-white border-2 rounded-lg overflow-hidden ${
                  isCustom ? 'border-purple-400' : 'border-gray-200'
                } ${isPast ? 'opacity-50' : ''}`}
              >
                {/* Day Header */}
                <div className={`px-6 py-4 border-b-2 ${
                  isCustom ? 'bg-purple-50 border-purple-200' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">
                          {dayName}
                        </h3>
                        <span className="text-sm text-gray-600">
                          {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        {isToday && (
                          <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">
                            TODAY
                          </span>
                        )}
                        {isCustom && (
                          <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-bold rounded-full">
                            CUSTOM
                          </span>
                        )}
                        {isPast && (
                          <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full">
                            PAST
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {selectedCount === 0 ? (
                          <span className="text-red-600 font-semibold">Closed this day</span>
                        ) : isCustom ? (
                          <span className="text-purple-600 font-semibold">{selectedCount} custom time slots for this date only</span>
                        ) : (
                          <span className="text-gray-600">{selectedCount} time slots (from General Schedule)</span>
                        )}
                      </p>
                    </div>
                    {!isPast && (
                      <div className="flex space-x-3">
                        <button
                          onClick={() => selectAllThisWeekDay(date)}
                          className="px-4 py-2 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg border-2 border-green-200 transition-colors"
                        >
                          Select All
                        </button>
                        <button
                          onClick={() => clearAllThisWeekDay(date)}
                          className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg border-2 border-red-200 transition-colors"
                        >
                          Clear All
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Time Slots Grid */}
                <div className="p-6">
                  {isPast ? (
                    <div className="text-center py-8 text-gray-400">
                      <p>This date has passed</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                      {timeSlots.map(time => {
                        const isSelected = dateSlots.includes(time);
                        return (
                          <button
                            key={time}
                            onClick={() => toggleThisWeekTimeSlot(date, time)}
                            className={`p-3 rounded-lg text-sm font-bold transition-all border-2 ${
                              isSelected
                                ? isCustom
                                  ? 'bg-purple-600 text-white border-purple-600 shadow-md scale-105'
                                  : 'bg-black text-white border-black shadow-md scale-105'
                                : 'bg-white text-gray-600 border-gray-300 hover:border-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {time}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Save Button - Bottom */}
          <div className="flex justify-center pt-4">
            <button
              onClick={saveSchedule}
              disabled={saving}
              className="px-12 py-4 bg-purple-600 text-white rounded-lg font-bold text-xl hover:bg-purple-700 transition-colors disabled:bg-gray-400 shadow-xl"
            >
              {saving ? 'Saving...' : 'Save Custom Schedule'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default AvailabilityManager;
