import admin from 'firebase-admin';
import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client with service_role key
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

let initError = null;

function initFirebase() {
  if (admin.apps.length > 0) return true;
  
  try {
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (privateKey) {
      privateKey = privateKey.trim();
      if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.slice(1, -1);
      }
      if (privateKey.startsWith("'") && privateKey.endsWith("'")) {
        privateKey = privateKey.slice(1, -1);
      }
      // Reconstruct PEM format by removing all formatting junk and rebuilding the wrapper
      const cleanKey = privateKey
        .replace(/-----BEGIN PRIVATE KEY-----/, '')
        .replace(/-----END PRIVATE KEY-----/, '')
        .replace(/\\n/g, '')
        .replace(/\n/g, '')
        .replace(/\r/g, '')
        .replace(/\\/g, '') // Strip any remaining backslashes (like typos \z, \u, etc)
        .replace(/\s+/g, '');
      privateKey = `-----BEGIN PRIVATE KEY-----\n${cleanKey}\n-----END PRIVATE KEY-----\n`;
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID?.trim(),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL?.trim(),
        privateKey: privateKey,
      }),
    });
    return true;
  } catch (error) {
    initError = error;
    console.error('Firebase Admin initialization error:', error);
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, orderId, title, body, status } = req.body;

  if (!userId || !title || !body) {
    return res.status(400).json({ error: 'Missing required fields: userId, title, body' });
  }

  // Gracefully handle missing server environment credentials (setup stage)
  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
    console.warn('FCM credentials are not configured in Vercel environment variables.');
    return res.status(200).json({ success: false, reason: 'FCM environment variables not configured yet' });
  }

  // Trigger Firebase Initialization
  const isInitialized = initFirebase();
  if (!isInitialized) {
    return res.status(200).json({ 
      success: false, 
      reason: 'Firebase Admin initialization failed', 
      error: initError ? initError.message : 'Unknown initialization error' 
    });
  }

  try {
    // 1. Fetch user profile to get fcm_token (using maybeSingle to handle empty records)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('fcm_token')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      console.warn('Profile fetch warning (check if SQL migration was run):', profileError.message);
      return res.status(200).json({ success: false, reason: 'FCM token fetch failed', error: profileError.message });
    }

    const fcmToken = profile?.fcm_token;

    if (!fcmToken) {
      console.log(`User ${userId} does not have an active FCM token. Skipping notification.`);
      return res.status(200).json({ success: false, reason: 'No FCM token registered' });
    }

    // 2. Prepare high-reliability cross-platform message payload (Android + iOS Safari APNs + Web)
    const message = {
      notification: {
        title,
        body,
      },
      data: {
        title,
        body,
        orderId: orderId || '',
        status: status || '',
        link: 'https://gocanteen.in/#/orders',
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          defaultSound: true,
          defaultVibrateTimings: true,
          notificationPriority: 'PRIORITY_MAX',
          visibility: 'PUBLIC'
        }
      },
      webpush: {
        headers: {
          Urgency: 'high'
        },
        notification: {
          title,
          body,
          icon: 'https://gocanteen.in/app-icon.png',
          badge: 'https://gocanteen.in/logo.png',
          requireInteraction: true
        },
        fcmOptions: {
          link: 'https://gocanteen.in/#/orders',
        },
      },
      token: fcmToken,
    };

    // 3. Send message via Firebase Admin
    const response = await admin.messaging().send(message);
    console.log(`✅ Push notification sent successfully to user ${userId}:`, response);
    return res.status(200).json({ success: true, response });

  } catch (err) {
    console.error('send-notification handler error:', err);
    return res.status(200).json({ success: false, reason: 'Internal exception', error: err.message });
  }
}
