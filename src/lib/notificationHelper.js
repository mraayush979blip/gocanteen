/**
 * Helper to trigger a secure push notification via Vercel serverless function
 */
export const sendPushNotification = async (userId, orderId, title, body, status = '') => {
  if (!userId) {
    console.warn('Skipping push notification: userId is required');
    return { success: false, error: 'userId is required' };
  }

  try {
    const response = await fetch('/api/send-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, orderId, title, body, status }),
    });

    const result = await response.json();
    return result;
  } catch (err) {
    console.error('Failed to trigger push notification:', err);
    return { success: false, error: err.message };
  }
};
