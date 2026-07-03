/**
 * Firebase Cloud Functions for Moti Mahal Delux
 * 
 * Handles:
 * 1. Razorpay order creation (server-side)
 * 2. Razorpay payment verification (server-side signature check)
 * 3. Razorpay webhook handler
 * 4. Email notifications (order confirmations, status updates)
 * 5. Rate limiting for security
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';

admin.initializeApp();
const db = admin.firestore();

// ==================== RAZORPAY SETUP ====================

// Initialize Razorpay with keys from Firebase config
// Set these with: firebase functions:config:set razorpay.key_id="rzp_xxx" razorpay.key_secret="xxx"
const getRazorpay = () => {
  const config = functions.config();
  return new Razorpay({
    key_id: config.razorpay?.key_id || process.env.RAZORPAY_KEY_ID || '',
    key_secret: config.razorpay?.key_secret || process.env.RAZORPAY_KEY_SECRET || '',
  });
};

// ==================== EMAIL SETUP ====================

// Initialize Nodemailer with Gmail SMTP
// Set these with: firebase functions:config:set gmail.email="xxx" gmail.password="xxx"
const getTransporter = () => {
  const config = functions.config();
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: config.gmail?.email || process.env.GMAIL_EMAIL || '',
      pass: config.gmail?.password || process.env.GMAIL_PASSWORD || '', // Use App Password for Gmail
    },
  });
};

// ==================== RATE LIMITING ====================

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(userId: string, maxRequests: number = 5, windowMs: number = 60000): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count++;
  return true;
}

// ==================== 1. CREATE RAZORPAY ORDER ====================

/**
 * Creates a Razorpay order for the given amount.
 * Called from frontend before opening Razorpay checkout modal.
 * 
 * Input: { amount: number (in INR), orderId: string, customerName: string }
 * Output: { razorpayOrderId: string, amount: number, currency: string }
 */
export const createRazorpayOrder = functions
  .region('asia-south1')
  .https.onCall(async (data: any, context: functions.https.CallableContext) => {
    // Auth check
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'You must be logged in to place an order.');
    }

    const userId = context.auth.uid;

    // Rate limiting: max 5 orders per minute per user
    if (!checkRateLimit(userId, 5, 60000)) {
      throw new functions.https.HttpsError('resource-exhausted', 'Too many requests. Please wait before trying again.');
    }

    const { amount, orderId, customerName } = data;

    // Validate input
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid order amount.');
    }

    if (!orderId || typeof orderId !== 'string') {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid order ID.');
    }

    try {
      const razorpay = getRazorpay();

      // Create Razorpay order (amount in paise = INR * 100)
      const razorpayOrder = await razorpay.orders.create({
        amount: Math.round(amount * 100), // Convert INR to paise
        currency: 'INR',
        receipt: orderId,
        notes: {
          orderId: orderId,
          customerName: customerName || '',
          userId: userId,
        },
      });

      // Store Razorpay order ID in Firestore
      await db.collection('orders').doc(orderId).update({
        razorpayOrderId: razorpayOrder.id,
        updatedAt: new Date().toISOString(),
      });

      return {
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      };
    } catch (error: any) {
      console.error('Razorpay order creation failed:', error);
      throw new functions.https.HttpsError('internal', 'Failed to create payment order. Please try again.');
    }
  });

// ==================== 2. VERIFY RAZORPAY PAYMENT ====================

/**
 * Verifies Razorpay payment signature server-side.
 * This is CRITICAL for security — never verify on the frontend.
 * 
 * Input: { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId }
 * Output: { success: boolean, message: string }
 */
export const verifyRazorpayPayment = functions
  .region('asia-south1')
  .https.onCall(async (data: any, context: functions.https.CallableContext) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = data;

    // Validate all required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing payment verification data.');
    }

    try {
      const config = functions.config();
      const keySecret = config.razorpay?.key_secret || process.env.RAZORPAY_KEY_SECRET || '';

      // Generate expected signature using HMAC SHA256
      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(body)
        .digest('hex');

      // Compare signatures
      const isValid = expectedSignature === razorpay_signature;

      if (isValid) {
        // Update order in Firestore
        await db.collection('orders').doc(orderId).update({
          paymentStatus: 'paid',
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          status: 'confirmed',
          updatedAt: new Date().toISOString(),
        });

        // Trigger confirmation email (async, don't await)
        sendOrderConfirmationEmail(orderId).catch(console.error);

        return { success: true, message: 'Payment verified successfully.' };
      } else {
        // Payment verification failed — potential fraud
        console.error('PAYMENT VERIFICATION FAILED', {
          orderId,
          razorpay_order_id,
          razorpay_payment_id,
          userId: context.auth.uid,
        });

        await db.collection('orders').doc(orderId).update({
          paymentStatus: 'failed',
          updatedAt: new Date().toISOString(),
        });

        throw new functions.https.HttpsError('failed-precondition', 'Payment verification failed. Please contact support.');
      }
    } catch (error: any) {
      if (error instanceof functions.https.HttpsError) throw error;
      console.error('Payment verification error:', error);
      throw new functions.https.HttpsError('internal', 'Payment verification failed.');
    }
  });

// ==================== 3. RAZORPAY WEBHOOK ====================

/**
 * Handles Razorpay webhook events for payment status updates.
 * Set webhook URL in Razorpay Dashboard → Settings → Webhooks
 * URL: https://<region>-<project>.cloudfunctions.net/razorpayWebhook
 */
export const razorpayWebhook = functions
  .region('asia-south1')
  .https.onRequest(async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).send('Method not allowed');
      return;
    }

    try {
      const config = functions.config();
      const webhookSecret = config.razorpay?.webhook_secret || process.env.RAZORPAY_WEBHOOK_SECRET || '';

      // Verify webhook signature
      const shasum = crypto.createHmac('sha256', webhookSecret);
      shasum.update(JSON.stringify(req.body));
      const digest = shasum.digest('hex');

      const razorpaySignature = req.headers['x-razorpay-signature'] as string;

      if (digest !== razorpaySignature) {
        console.error('Webhook signature verification failed');
        res.status(400).send('Invalid signature');
        return;
      }

      const event = req.body.event;
      const payload = req.body.payload;

      switch (event) {
        case 'payment.captured': {
          const paymentId = payload.payment.entity.id;
          const orderId = payload.payment.entity.notes?.orderId;

          if (orderId) {
            await db.collection('orders').doc(orderId).update({
              paymentStatus: 'paid',
              razorpayPaymentId: paymentId,
              status: 'confirmed',
              updatedAt: new Date().toISOString(),
            });
          }
          break;
        }

        case 'payment.failed': {
          const orderId = payload.payment.entity.notes?.orderId;
          if (orderId) {
            await db.collection('orders').doc(orderId).update({
              paymentStatus: 'failed',
              updatedAt: new Date().toISOString(),
            });
          }
          break;
        }

        case 'refund.processed': {
          const orderId = payload.refund.entity.notes?.orderId;
          if (orderId) {
            await db.collection('orders').doc(orderId).update({
              paymentStatus: 'refunded',
              updatedAt: new Date().toISOString(),
            });
          }
          break;
        }

        default:
          console.log('Unhandled webhook event:', event);
      }

      res.status(200).json({ status: 'ok' });
    } catch (error) {
      console.error('Webhook processing error:', error);
      res.status(500).send('Internal error');
    }
  });

// ==================== 4. EMAIL NOTIFICATIONS ====================

/**
 * Send order confirmation email to customer
 */
async function sendOrderConfirmationEmail(orderId: string): Promise<void> {
  try {
    const orderDoc = await db.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) return;

    const order = orderDoc.data()!;
    const customerEmail = order.customerEmail;

    if (!customerEmail) return;

    const transporter = getTransporter();
    const config = functions.config();
    const senderEmail = config.gmail?.email || process.env.GMAIL_EMAIL || 'noreply@motimahal.com';

    const itemsList = (order.items || [])
      .map((item: any) => `• ${item.menuItem?.name || 'Item'} x${item.quantity} — ₹${(item.menuItem?.price * item.quantity).toFixed(2)}`)
      .join('\n');

    await transporter.sendMail({
      from: `"Moti Mahal Delux" <${senderEmail}>`,
      to: customerEmail,
      subject: `Order Confirmed — #${orderId.slice(-8).toUpperCase()}`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #faf8f5; padding: 40px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="font-size: 24px; letter-spacing: 4px; color: #1a1a1a; margin: 0;">MOTI MAHAL DELUX</h1>
            <p style="font-size: 10px; letter-spacing: 3px; color: #C9A96E; text-transform: uppercase; margin: 5px 0 0;">EST. 1920</p>
          </div>
          
          <div style="background: white; border: 1px solid #e8e2d8; padding: 30px;">
            <h2 style="font-size: 18px; color: #1a1a1a; margin: 0 0 10px;">Your Order is Confirmed! ✨</h2>
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
              Thank you, <strong>${order.customerName}</strong>. We've received your order and our chefs are getting ready.
            </p>
            
            <div style="border-top: 1px solid #e8e2d8; margin: 20px 0; padding-top: 20px;">
              <p style="font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 2px;">Order Details</p>
              <p style="font-size: 13px; color: #333; margin: 5px 0;"><strong>Order ID:</strong> #${orderId.slice(-8).toUpperCase()}</p>
              <p style="font-size: 13px; color: #333; margin: 5px 0;"><strong>Type:</strong> ${order.orderType || 'Delivery'}</p>
              <p style="font-size: 13px; color: #333; margin: 5px 0;"><strong>Delivery Time:</strong> ${order.deliveryTime || 'ASAP'}</p>
            </div>

            <div style="border-top: 1px solid #e8e2d8; margin: 20px 0; padding-top: 20px;">
              <p style="font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 2px;">Items Ordered</p>
              <pre style="font-size: 13px; color: #333; line-height: 1.8; white-space: pre-wrap; font-family: inherit;">${itemsList}</pre>
            </div>

            <div style="border-top: 2px solid #C9A96E; margin: 20px 0; padding-top: 15px;">
              <p style="font-size: 16px; color: #1a1a1a; text-align: right;">
                <strong>Total: ₹${(order.total || 0).toFixed(2)}</strong>
              </p>
            </div>
          </div>

          <p style="text-align: center; font-size: 11px; color: #999; margin-top: 20px;">
            Moti Mahal Delux • Dabwali Gurumukhi Chowk, Bathinda
          </p>
        </div>
      `,
    });

    console.log('Order confirmation email sent to:', customerEmail);
  } catch (error) {
    console.error('Failed to send order confirmation email:', error);
  }
}

// ==================== 5. ORDER STATUS CHANGE TRIGGER ====================

/**
 * Firestore trigger: Send email when order status changes
 */
export const onOrderStatusChange = functions
  .region('asia-south1')
  .firestore.document('orders/{orderId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Only trigger if status actually changed
    if (before.status === after.status) return;

    const customerEmail = after.customerEmail;
    if (!customerEmail) return;

    const orderId = context.params.orderId;
    const statusMessages: Record<string, string> = {
      confirmed: 'Your order has been confirmed! Our chefs will begin preparation shortly.',
      preparing: 'Your order is now being prepared by our master chefs. 🍳',
      ready: 'Your order is ready! It will be dispatched shortly.',
      on_the_way: 'Your order is on its way to you! 🚗',
      delivered: 'Your order has been delivered! Enjoy your meal. 🎉',
      cancelled: `Your order has been cancelled. ${after.cancelReason ? 'Reason: ' + after.cancelReason : 'Please contact us for details.'}`,
    };

    const message = statusMessages[after.status];
    if (!message) return;

    try {
      const transporter = getTransporter();
      const config = functions.config();
      const senderEmail = config.gmail?.email || process.env.GMAIL_EMAIL || 'noreply@motimahal.com';

      await transporter.sendMail({
        from: `"Moti Mahal Delux" <${senderEmail}>`,
        to: customerEmail,
        subject: `Order Update — #${orderId.slice(-8).toUpperCase()} — ${after.status.replace(/_/g, ' ').toUpperCase()}`,
        html: `
          <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #faf8f5; padding: 40px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="font-size: 24px; letter-spacing: 4px; color: #1a1a1a; margin: 0;">MOTI MAHAL DELUX</h1>
              <p style="font-size: 10px; letter-spacing: 3px; color: #C9A96E; text-transform: uppercase;">EST. 1920</p>
            </div>
            <div style="background: white; border: 1px solid #e8e2d8; padding: 30px;">
              <h2 style="font-size: 18px; color: #1a1a1a;">Order Status Update</h2>
              <p style="color: #666; font-size: 14px; line-height: 1.6;">
                Hi <strong>${after.customerName}</strong>,
              </p>
              <p style="color: #333; font-size: 14px; line-height: 1.6;">
                ${message}
              </p>
              <p style="font-size: 13px; color: #999; margin-top: 20px;">
                Order #${orderId.slice(-8).toUpperCase()} • ₹${(after.total || 0).toFixed(2)}
              </p>
            </div>
          </div>
        `,
      });
    } catch (error) {
      console.error('Failed to send status update email:', error);
    }
  });

// ==================== 6. NEW RESERVATION NOTIFICATION ====================

/**
 * Firestore trigger: Notify admin when new reservation is created
 */
export const onNewReservation = functions
  .region('asia-south1')
  .firestore.document('reservations/{reservationId}')
  .onCreate(async (snap, context) => {
    const reservation = snap.data();

    // Create an admin notification in Firestore
    await db.collection('notifications').add({
      type: 'reservation',
      title: 'New Table Reservation',
      message: `${reservation.name} has requested a table for ${reservation.guests} guests on ${reservation.date} at ${reservation.time}.`,
      isRead: false,
      link: `/admin/reservations`,
      createdAt: new Date().toISOString(),
    });
  });

// ==================== 7. NEW ORDER NOTIFICATION ====================

/**
 * Firestore trigger: Notify admin when new order is placed
 */
export const onNewOrder = functions
  .region('asia-south1')
  .firestore.document('orders/{orderId}')
  .onCreate(async (snap, context) => {
    const order = snap.data();

    await db.collection('notifications').add({
      type: 'order',
      title: 'New Order Received',
      message: `${order.customerName} placed a ₹${(order.total || 0).toFixed(2)} ${order.orderType || 'delivery'} order.`,
      isRead: false,
      link: `/admin/orders`,
      createdAt: new Date().toISOString(),
    });
  });
