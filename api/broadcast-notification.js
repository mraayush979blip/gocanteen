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

  const { title, body, link } = req.body;

  if (!title || !body) {
    return res.status(400).json({ error: 'Missing required fields: title, body' });
  }

  // Gracefully handle missing server environment credentials
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
    // 1. Fetch all distinct active FCM tokens from Supabase profiles
    const { data: profiles, error: dbError } = await supabaseAdmin
      .from('profiles')
      .select('id, fcm_token')
      .not('fcm_token', 'is', null);

    if (dbError) {
      console.error('Error fetching FCM profiles:', dbError);
      return res.status(200).json({ success: false, reason: 'Database fetch failed', error: dbError.message });
    }

    // Filter out duplicates and empty values
    const tokenMap = new Map();
    profiles.forEach(p => {
      const token = p.fcm_token?.trim();
      if (token && token.length > 10) {
        tokenMap.set(token, p.id);
      }
    });

    const tokens = Array.from(tokenMap.keys());

    if (tokens.length === 0) {
      return res.status(200).json({ success: true, sentCount: 0, reason: 'No registered FCM tokens found' });
    }

    // 2. Prepare message
    const message = {
      notification: {
        title,
        body,
      },
      data: {
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
        link: link || 'https://gocanteen.in/#/offers',
      },
      tokens: tokens,
      webpush: {
        fcmOptions: {
          link: link || 'https://gocanteen.in/#/offers',
        },
      },
    };

    // 3. Send multicast message via Firebase Admin
    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`📡 Broadcast sent to ${tokens.length} tokens. Success: ${response.successCount}, Failures: ${response.failureCount}`);

    // 4. Auto-clean expired/invalid tokens from profiles
    const deadTokens = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success && resp.error) {
        const errCode = resp.error.code;
        if (
          errCode === 'messaging/registration-token-not-registered' ||
          errCode === 'messaging/invalid-registration-token'
        ) {
          const badToken = tokens[idx];
          const userId = tokenMap.get(badToken);
          if (userId) {
            deadTokens.push(userId);
          }
        }
      }
    });

    if (deadTokens.length > 0) {
      try {
        await supabaseAdmin
          .from('profiles')
          .update({ fcm_token: null })
          .in('id', deadTokens);
        console.log(`🧹 Cleaned up ${deadTokens.length} stale FCM tokens from DB.`);
      } catch (cleanErr) {
        console.error('FCM stale tokens cleanup error:', cleanErr);
      }
    }

    return res.status(200).json({
      success: true,
      totalCount: tokens.length,
      successCount: response.successCount,
      failureCount: response.failureCount,
      cleanedCount: deadTokens.length
    });

  } catch (err) {
    console.error('Broadcast notification handler error:', err);
    return res.status(200).json({ success: false, reason: 'Broadcast exception', error: err.message });
  }
}
