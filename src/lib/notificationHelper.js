/**
 * Helper to trigger a secure push notification via Vercel serverless function
 */
export const sendPushNotification = async (userId, orderId, title, body, status = '') => {
  if (!userId) {
    console.warn('Skipping push notification: userId is required');
    return { success: false, error: 'userId is required' };
  }

  try {
    console.log(`📡 [FCM] Dispatched push request for user: ${userId}`, { orderId, title, body, status });
    const response = await fetch('/api/send-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, orderId, title, body, status }),
    });

    const result = await response.json();
    console.log(`🛰️ [FCM] Response for user ${userId}:`, result);
    return result;
  } catch (err) {
    console.error(`❌ [FCM] Failed for user ${userId}:`, err);
    return { success: false, error: err.message };
  }
};
