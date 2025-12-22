# TickTick Integration Setup Guide

This guide explains how to set up TickTick integration for your Chinblends booking system. With this integration, appointments will automatically sync to TickTick as tasks.

## What Gets Synced

- **New Bookings**: Creates a new task in TickTick
- **Rescheduled Appointments**: Updates the existing task with new date/time
- **Cancelled Appointments**: Deletes the task from TickTick

## Prerequisites

- A TickTick account
- Access to TickTick Developer Portal

## Setup Instructions

### Step 1: Create a TickTick Developer Application

1. Go to [TickTick Developer Portal](https://developer.ticktick.com/)
2. Sign in with your TickTick account
3. Click **+App Name** to create a new application
4. Fill in the required fields:
   - **Name**: Chinblends Booking System (or any name you prefer)
   - **OAuth Redirect URL**: You can use any URL (e.g., `http://localhost:3000/callback`)
5. Click **Create**
6. You'll receive your **Client ID** and **Client Secret** - save these securely

### Step 2: Get Your Access Token

To get your access token, you'll need to go through the OAuth flow:

1. Visit the following URL in your browser (replace `YOUR_CLIENT_ID` with your actual Client ID):

```
https://ticktick.com/oauth/authorize?client_id=YOUR_CLIENT_ID&scope=tasks:write&response_type=code&redirect_uri=YOUR_REDIRECT_URL
```

2. Authorize the application
3. You'll be redirected to your redirect URL with a `code` parameter
4. Exchange the code for an access token by making a POST request:

```bash
curl -X POST https://ticktick.com/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "code=YOUR_CODE" \
  -d "grant_type=authorization_code" \
  -d "redirect_uri=YOUR_REDIRECT_URL"
```

5. The response will include your `access_token`

### Step 3: (Optional) Get Your Project ID

If you want appointments to be created in a specific TickTick project/list:

1. Open TickTick and navigate to the project you want to use
2. The project ID is in the URL: `https://ticktick.com/webapp/#/project/PROJECT_ID/tasks`
3. Copy the `PROJECT_ID`

If you don't specify a project ID, tasks will be created in your default inbox.

### Step 4: Configure Environment Variables

Add the following to your `.env` file:

```env
# TickTick Integration (Optional - leave blank to disable)
TICKTICK_ACCESS_TOKEN=your_access_token_here
TICKTICK_PROJECT_ID=your_project_id_here  # Optional
```

### Step 5: Deploy to Vercel

If you're using Vercel, add these environment variables to your Vercel project:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** > **Environment Variables**
3. Add:
   - `TICKTICK_ACCESS_TOKEN` = your access token
   - `TICKTICK_PROJECT_ID` = your project ID (optional)

## How It Works

### Task Format

Each booking creates a TickTick task with:

- **Title**: `[Service] - [Customer Name]`
- **Description**: Customer details (name, phone, email, service, duration, price)
- **Start Date**: Appointment date and time
- **Due Date**: Appointment end time (start + duration)
- **Reminder**: 15 minutes before the appointment
- **Priority**: High (1)

### Example Task

```
Title: Haircut - John Doe

Description:
Customer: John Doe
Phone: 07123456789
Email: john@example.com
Service: Haircut
Duration: 30 minutes
Price: £25

Start: 2025-12-22 10:00 AM
Due: 2025-12-22 10:30 AM
Reminder: 15 minutes before
```

## Testing

To verify the integration is working:

1. Create a test booking through your booking system
2. Check your TickTick app - you should see a new task
3. Try rescheduling the booking - the task should update
4. Try cancelling the booking - the task should be deleted

## Troubleshooting

### Tasks Not Creating

- Check that `TICKTICK_ACCESS_TOKEN` is set correctly in your environment variables
- Check the server logs for any TickTick-related errors
- Verify your access token hasn't expired

### Tasks Creating in Wrong Project

- Double-check your `TICKTICK_PROJECT_ID` value
- Make sure the project ID is from the correct TickTick account

### Access Token Expired

TickTick access tokens may expire. If tasks stop syncing:

1. Go through the OAuth flow again (Step 2)
2. Get a new access token
3. Update your environment variables

## Disabling TickTick Integration

To disable the integration, simply remove or leave blank the `TICKTICK_ACCESS_TOKEN` environment variable. The booking system will continue to work normally without TickTick sync.

## API Reference

- [TickTick Developer Portal](https://developer.ticktick.com/)
- [TickTick API Documentation](https://developer.ticktick.com/api)
- OAuth Authorization URL: `https://ticktick.com/oauth/authorize`
- OAuth Token URL: `https://ticktick.com/oauth/token`
- API Base URL: `https://api.ticktick.com/open/v1`

## Support

If you encounter issues with the TickTick integration:

1. Check the server logs in Vercel
2. Verify your environment variables are set correctly
3. Ensure your TickTick access token is valid
4. Contact TickTick support for API-related issues
