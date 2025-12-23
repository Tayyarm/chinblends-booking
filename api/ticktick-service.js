import axios from 'axios';

const TICKTICK_API_BASE = 'https://api.ticktick.com/open/v1';

class TickTickService {
  constructor() {
    this.accessToken = process.env.TICKTICK_ACCESS_TOKEN;
    this.projectId = process.env.TICKTICK_PROJECT_ID || null;
    this.enabled = !!this.accessToken;
  }

  isEnabled() {
    return this.enabled;
  }

  async createTask(booking) {
    if (!this.enabled) {
      console.log('TickTick integration disabled - missing access token');
      return null;
    }

    try {
      const taskData = this.formatBookingAsTask(booking);
      console.log('TickTick task payload:', JSON.stringify(taskData, null, 2));

      const response = await axios.post(
        `${TICKTICK_API_BASE}/task`,
        taskData,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`TickTick task created for booking ${booking.id}`);
      return response.data;
    } catch (error) {
      console.error('Error creating TickTick task:', error.response?.data || error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
      }
      return null;
    }
  }

  async updateTask(tickTickTaskId, updatedBooking) {
    if (!this.enabled) {
      console.log('TickTick integration disabled - missing access token');
      return null;
    }

    if (!tickTickTaskId) {
      console.log('No TickTick task ID provided for update');
      return await this.createTask(updatedBooking);
    }

    try {
      const taskData = this.formatBookingAsTask(updatedBooking);

      const response = await axios.post(
        `${TICKTICK_API_BASE}/task/${tickTickTaskId}`,
        taskData,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`TickTick task ${tickTickTaskId} updated for booking ${updatedBooking.id}`);
      return response.data;
    } catch (error) {
      console.error('Error updating TickTick task:', error.response?.data || error.message);
      return null;
    }
  }

  async deleteTask(tickTickTaskId) {
    if (!this.enabled) {
      console.log('TickTick integration disabled - missing access token');
      return null;
    }

    if (!tickTickTaskId) {
      console.log('No TickTick task ID provided for deletion');
      return null;
    }

    try {
      await axios.delete(
        `${TICKTICK_API_BASE}/task/${tickTickTaskId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );

      console.log(`TickTick task ${tickTickTaskId} deleted`);
      return true;
    } catch (error) {
      console.error('Error deleting TickTick task:', error.response?.data || error.message);
      return false;
    }
  }

  formatBookingAsTask(booking) {
    console.log('formatBookingAsTask input:', { date: booking.date, time: booking.time, duration: booking.duration });

    // Convert 12-hour time to 24-hour format
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

    // Parse the booking date and time properly
    const bookingDate = new Date(booking.date);
    console.log('bookingDate:', bookingDate);

    const time24 = convertTo24Hour(booking.time);
    console.log('time24:', time24);

    const [hours, minutes] = time24.split(':');
    console.log('hours:', hours, 'minutes:', minutes);

    // Set the start time
    const startDateTime = new Date(bookingDate);
    startDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    console.log('startDateTime:', startDateTime, 'ISO:', startDateTime.toISOString());

    // Calculate end time based on duration
    // Duration might be a string like "20 mins" or a number, so parse it
    const durationMinutes = typeof booking.duration === 'string'
      ? parseInt(booking.duration)
      : booking.duration;
    console.log('durationMinutes:', durationMinutes);

    const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60000);
    console.log('endDateTime:', endDateTime, 'ISO:', endDateTime.toISOString());

    const title = `${booking.service} - ${booking.customerName}`;
    const content = `Customer: ${booking.customerName}\nPhone: ${booking.customerPhone}\nEmail: ${booking.customerEmail}\nService: ${booking.service}\nDuration: ${booking.duration} minutes\nPrice: £${booking.price}`;

    const taskData = {
      title: title,
      content: content,
      startDate: startDateTime.toISOString(),
      dueDate: endDateTime.toISOString(),
      isAllDay: false,
      reminders: [
        'TRIGGER:PT15M'
      ],
      priority: 1
    };

    if (this.projectId) {
      taskData.projectId = this.projectId;
    }

    return taskData;
  }
}

export default new TickTickService();
