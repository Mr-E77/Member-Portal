import { Resend } from 'resend';
import * as Sentry from '@sentry/nextjs';

if (!process.env.RESEND_API_KEY) {
  console.warn('RESEND_API_KEY not set, emails will not be sent');
}

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

/**
 * Send email using Resend
 */
export async function sendEmail(options: EmailOptions) {
  try {
    const { to, subject, html, from, replyTo } = options;

    const response = await resend.emails.send({
      from: from || process.env.EMAIL_FROM || 'noreply@yourdomain.com',
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      replyTo,
    });

    Sentry.addBreadcrumb({
      category: 'email',
      message: `Email sent to ${Array.isArray(to) ? to.join(', ') : to}`,
      level: 'info',
      data: { subject, emailId: response.data?.id },
    });

    return response;
  } catch (error) {
    Sentry.captureException(error, {
      tags: { context: 'email-send' },
      extra: { to: options.to, subject: options.subject },
    });
    throw error;
  }
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(email: string, name?: string) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4f46e5; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; padding: 12px 24px; background: #4f46e5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to the Platform!</h1>
          </div>
          <div class="content">
            <p>Hi ${name || 'there'},</p>
            <p>Welcome to our membership platform! We're excited to have you as part of our community.</p>
            <p>You're currently on the <strong>Tier 1</strong> membership. You can explore premium features by upgrading to higher tiers.</p>
            <a href="${process.env.NEXTAUTH_URL}/dashboard" class="button">Go to Dashboard</a>
            <p>If you have any questions, feel free to reach out to our support team.</p>
            <p>Best regards,<br>The Team</p>
          </div>
          <div class="footer">
            <p>You received this email because you signed up for an account.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Welcome to the Platform!',
    html,
  });
}

/**
 * Send payment receipt email
 */
export async function sendPaymentReceiptEmail(
  email: string,
  amount: number,
  tierName: string,
  invoiceUrl?: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .receipt { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
          .receipt-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .button { display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Payment Successful</h1>
          </div>
          <div class="content">
            <p>Your payment has been processed successfully!</p>
            <div class="receipt">
              <div class="receipt-row">
                <span><strong>Plan:</strong></span>
                <span>${tierName}</span>
              </div>
              <div class="receipt-row">
                <span><strong>Amount:</strong></span>
                <span>$${amount.toFixed(2)}</span>
              </div>
              <div class="receipt-row">
                <span><strong>Status:</strong></span>
                <span style="color: #10b981;">Paid</span>
              </div>
            </div>
            ${invoiceUrl ? `<a href="${invoiceUrl}" class="button">View Invoice</a>` : ''}
            <p>Thank you for your subscription!</p>
            <p>Best regards,<br>The Team</p>
          </div>
          <div class="footer">
            <p>This is an automated receipt for your payment.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Payment Receipt - ${tierName}`,
    html,
  });
}

/**
 * Send subscription renewal reminder
 */
export async function sendRenewalReminderEmail(
  email: string,
  tierName: string,
  renewalDate: Date,
  amount: number
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f59e0b; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .info-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .button { display: inline-block; padding: 12px 24px; background: #f59e0b; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔔 Subscription Renewal Reminder</h1>
          </div>
          <div class="content">
            <p>Your <strong>${tierName}</strong> subscription will renew soon.</p>
            <div class="info-box">
              <p><strong>Renewal Date:</strong> ${renewalDate.toLocaleDateString()}</p>
              <p><strong>Amount:</strong> $${amount.toFixed(2)}</p>
            </div>
            <p>Your payment method will be automatically charged. No action is needed unless you want to update your payment details or cancel your subscription.</p>
            <a href="${process.env.NEXTAUTH_URL}/dashboard" class="button">Manage Subscription</a>
            <p>Best regards,<br>The Team</p>
          </div>
          <div class="footer">
            <p>You can cancel anytime from your dashboard.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Subscription Renewal Reminder - ${tierName}`,
    html,
  });
}

/**
 * Send subscription canceled email
 */
export async function sendSubscriptionCanceledEmail(
  email: string,
  tierName: string,
  accessUntil: Date
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #6b7280; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .info-box { background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .button { display: inline-block; padding: 12px 24px; background: #4f46e5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Subscription Canceled</h1>
          </div>
          <div class="content">
            <p>Your <strong>${tierName}</strong> subscription has been canceled.</p>
            <div class="info-box">
              <p><strong>Access Until:</strong> ${accessUntil.toLocaleDateString()}</p>
              <p>You'll continue to have access to premium features until this date.</p>
            </div>
            <p>We're sorry to see you go! If you change your mind, you can resubscribe anytime.</p>
            <a href="${process.env.NEXTAUTH_URL}/dashboard" class="button">Resubscribe</a>
            <p>Best regards,<br>The Team</p>
          </div>
          <div class="footer">
            <p>Thank you for being a member.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Subscription Canceled - ${tierName}`,
    html,
  });
}

/**
 * Send payment failed email
 */
export async function sendPaymentFailedEmail(
  email: string,
  tierName: string,
  amount: number
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ef4444; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .alert-box { background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .button { display: inline-block; padding: 12px 24px; background: #ef4444; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Payment Failed</h1>
          </div>
          <div class="content">
            <p>We were unable to process your payment for <strong>${tierName}</strong>.</p>
            <div class="alert-box">
              <p><strong>Amount:</strong> $${amount.toFixed(2)}</p>
              <p><strong>Action Required:</strong> Please update your payment method to continue your subscription.</p>
            </div>
            <p>Your subscription is currently <strong>past due</strong>. To avoid service interruption, please update your payment information.</p>
            <a href="${process.env.NEXTAUTH_URL}/dashboard" class="button">Update Payment Method</a>
            <p>If you have questions, please contact support.</p>
            <p>Best regards,<br>The Team</p>
          </div>
          <div class="footer">
            <p>This is an automated notification.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Payment Failed - Action Required`,
    html,
  });
}
