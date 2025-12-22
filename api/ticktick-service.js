const axios = require('axios');

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

  async completeTask(tickTickTaskId) {
    if (!this.enabled) {
      console.log('TickTick integration disabled - missing access token');
      return null;
    }

    if (!tickTickTaskId) {
      console.log('No TickTick task ID provided for completion');
      return null;
    }

    try {
      const response = await axios.post(
        `${TICKTICK_API_BASE}/task/${tickTickTaskId}/complete`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`TickTick task ${tickTickTaskId} marked as complete`);
      return response.data;
    } catch (error) {
      console.error('Error completing TickTick task:', error.response?.data || error.message);
      return null;
    }
  }

  formatBookingAsTask(booking) {
    const startDateTime = new Date(`${booking.date}T${booking.time}`);
    const endDateTime = new Date(startDateTime.getTime() + booking.duration * 60000);

    const title = `${booking.service} - ${booking.customerName}`;
    const content = `Customer: ${booking.customerName}\nPhone: ${booking.customerPhone}\nEmail: ${booking.customerEmail}\nService: ${booking.service}\nDuration: ${booking.duration} minutes\nPrice: £${booking.price}`;

    const taskData = {
      title: title,
      content: content,
      startDate: startDateTime.toISOString(),
      dueDate: endDateTime.toISOString(),
      isAllDay: false,
      reminders: [
        {
          trigger: 'TRIGGER:PT15M'
        }
      ],
      priority: 1
    };

    if (this.projectId) {
      taskData.projectId = this.projectId;
    }

    return taskData;
  }
}

module.exports = new TickTickService();
