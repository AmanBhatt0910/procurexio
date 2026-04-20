// src/lib/email/mailer.js
// Uses Nodemailer with SMTP transport (smtp.hostinger.com:465 SSL)
// Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in your .env.local

import nodemailer from 'nodemailer';
import { BASE_URL } from '@/config/api';
import { EMAIL_FROM, APP_NAME } from '@/config/email';
import buildLogoHeader, {
  buildTeamInviteHtml,
  buildVendorInviteHtml,
  buildWelcomeHtml,
  buildVendorRFQInviteHtml,
  buildPasswordResetHtml,
  buildPasswordResetTokenHtml,
  formatDeadlineDateTime,
} from './templates';

// Lazy initialization — avoids build-time errors when SMTP credentials are absent
let _transporter = null;
function getTransporter() {
  if (!_transporter) {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error(
        'SMTP credentials are not configured. Set SMTP_USER and SMTP_PASS in your environment variables.'
      );
    }
    _transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST || 'smtp.hostinger.com',
      port:   parseInt(process.env.SMTP_PORT, 10) || 465,
      secure: true, // SSL on port 465
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return _transporter;
}

const FROM = EMAIL_FROM;

// ─────────────────────────────────────────────────────────────────────────────
// sendInviteEmail — internal team member invite (company_admin / manager / employee)
// ─────────────────────────────────────────────────────────────────────────────
export async function sendInviteEmail({ to, token, role, companyName, invitedBy }) {
  const inviteUrl     = `${BASE_URL}/register?token=${token}`;
  const formattedRole = role
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());

  const html = buildTeamInviteHtml({ inviteUrl, companyName, invitedBy, formattedRole, appName: APP_NAME });

  const info = await getTransporter().sendMail({
    from:    FROM,
    to,
    subject: `You've been invited to join ${companyName} on ${APP_NAME}`,
    html,
  });
  return info;
}

// ─────────────────────────────────────────────────────────────────────────────
// sendPasswordResetTokenEmail — send a secure token-based reset link to user
// ─────────────────────────────────────────────────────────────────────────────
export async function sendPasswordResetTokenEmail({ to, name, token }) {
  const resetUrl = `${BASE_URL}/reset-password?token=${token}`;

  const html = buildPasswordResetTokenHtml({ name, resetUrl, appName: APP_NAME });

  const info = await getTransporter().sendMail({
    from:    FROM,
    to,
    subject: `Reset your ${APP_NAME} password`,
    html,
  });
  return info;
}

// ─────────────────────────────────────────────────────────────────────────────
// sendVendorInviteEmail — vendor portal access invite
// ─────────────────────────────────────────────────────────────────────────────
export async function sendVendorInviteEmail({ to, token, vendorName, companyName, invitedBy }) {
  const inviteUrl = `${BASE_URL}/register?token=${token}`;

  const html = buildVendorInviteHtml({ inviteUrl, vendorName, companyName, invitedBy, appName: APP_NAME });

  const info = await getTransporter().sendMail({
    from:    FROM,
    to,
    subject: `${companyName} has invited ${vendorName} to join ${APP_NAME}`,
    html,
  });
  return info;
}

// ─────────────────────────────────────────────────────────────────────────────
// sendWelcomeEmail — fired immediately after a new company registers
// ─────────────────────────────────────────────────────────────────────────────
export async function sendWelcomeEmail({ to, name, companyName }) {
  const dashboardUrl = `${BASE_URL}/dashboard`;
  const vendorsUrl   = `${BASE_URL}/dashboard/vendors/new`;
  const rfqUrl       = `${BASE_URL}/dashboard/rfqs/new`;

  const html = buildWelcomeHtml({ name, companyName, dashboardUrl, vendorsUrl, rfqUrl, appName: APP_NAME });

  const info = await getTransporter().sendMail({
    from:    FROM,
    to,
    subject: `Welcome to ${APP_NAME}, ${name.split(' ')[0]}! Your workspace is ready.`,
    html,
  });
  return info;
}

// ─────────────────────────────────────────────────────────────────────────────
// sendVendorRFQInviteEmail — notify vendor when invited to an RFQ
// ─────────────────────────────────────────────────────────────────────────────
export async function sendVendorRFQInviteEmail({ to, vendorName, companyName, rfqTitle, rfqReference, deadline, inviteLink }) {
  const html = buildVendorRFQInviteHtml({ vendorName, companyName, rfqTitle, rfqReference, deadline, inviteLink, appName: APP_NAME });

  const info = await getTransporter().sendMail({
    from:    FROM,
    to,
    subject: `${companyName} has invited you to bid on: ${rfqTitle}`,
    html,
  });
  return info;
}

// ─────────────────────────────────────────────────────────────────────────────
// sendBidSubmittedEmail — notify company managers/admins when a vendor submits
// ─────────────────────────────────────────────────────────────────────────────
export async function sendBidSubmittedEmail({ to, managerName, vendorName, rfqTitle, rfqReference, rfqLink }) {
  const year = new Date().getFullYear();
  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><title>New Bid Received</title></head>
<body style="margin:0;padding:0;background:#f5f4f2;font-family:'DM Sans',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f2;padding:40px 16px;">
  <tr><td align="center">
    <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e3df;">
      ${buildLogoHeader()}
      <tr><td style="padding:36px 36px 28px;">
        <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f0e0d;">New Bid Received</h1>
        <p style="margin:0 0 24px;font-size:15px;color:#6b6660;line-height:1.6;">
          Hi ${managerName || 'there'},<br/>
          <strong style="color:#0f0e0d;">${vendorName}</strong> has submitted a bid for:
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
          <tr><td style="background:#faf9f7;border:1px solid #e4e0db;border-radius:8px;padding:18px 20px;">
            <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#b8b3ae;letter-spacing:.06em;text-transform:uppercase;">RFQ</p>
            <p style="margin:0 0 12px;font-size:16px;font-weight:700;color:#0f0e0d;">${rfqTitle}</p>
            <p style="margin:0;font-size:12px;color:#6b6660;">Ref: <strong>${rfqReference}</strong></p>
          </td></tr>
        </table>
        <a href="${rfqLink}" style="display:inline-block;background:#c8501a;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:15px;font-weight:600;">View Bids</a>
      </td></tr>
      <tr><td style="background:#f5f4f2;padding:20px 36px;text-align:center;">
        <p style="margin:0;font-size:12px;color:#b8b3ae;">© ${year} ${APP_NAME}. All rights reserved.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;

  const info = await getTransporter().sendMail({
    from: FROM,
    to,
    subject: `New bid received on "${rfqTitle}" from ${vendorName}`,
    html,
  });
  return info;
}

// ─────────────────────────────────────────────────────────────────────────────
// sendBidUpdatedEmail — notify company managers/admins when a vendor updates bid
// ─────────────────────────────────────────────────────────────────────────────
export async function sendBidUpdatedEmail({ to, managerName, vendorName, rfqTitle, rfqReference, rfqLink }) {
  const year = new Date().getFullYear();
  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><title>Bid Updated</title></head>
<body style="margin:0;padding:0;background:#f5f4f2;font-family:'DM Sans',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f2;padding:40px 16px;">
  <tr><td align="center">
    <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e3df;">
      ${buildLogoHeader()}
      <tr><td style="padding:36px 36px 28px;">
        <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f0e0d;">Bid Updated</h1>
        <p style="margin:0 0 24px;font-size:15px;color:#6b6660;line-height:1.6;">
          Hi ${managerName || 'there'},<br/>
          <strong style="color:#0f0e0d;">${vendorName}</strong> has updated their bid for:
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
          <tr><td style="background:#faf9f7;border:1px solid #e4e0db;border-radius:8px;padding:18px 20px;">
            <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#b8b3ae;letter-spacing:.06em;text-transform:uppercase;">RFQ</p>
            <p style="margin:0 0 12px;font-size:16px;font-weight:700;color:#0f0e0d;">${rfqTitle}</p>
            <p style="margin:0;font-size:12px;color:#6b6660;">Ref: <strong>${rfqReference}</strong></p>
          </td></tr>
        </table>
        <a href="${rfqLink}" style="display:inline-block;background:#c8501a;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:15px;font-weight:600;">View Bids</a>
      </td></tr>
      <tr><td style="background:#f5f4f2;padding:20px 36px;text-align:center;">
        <p style="margin:0;font-size:12px;color:#b8b3ae;">© ${year} ${APP_NAME}. All rights reserved.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;

  const info = await getTransporter().sendMail({
    from: FROM,
    to,
    subject: `Bid updated on "${rfqTitle}" by ${vendorName}`,
    html,
  });
  return info;
}

// ─────────────────────────────────────────────────────────────────────────────
// sendRFQClosedEmail — notify a vendor that an RFQ has been closed
// rank: 1-based position of the vendor's bid (null if they didn't bid)
// ─────────────────────────────────────────────────────────────────────────────
export async function sendRFQClosedEmail({ to, vendorName, rfqTitle, rfqReference, rank, totalBids, dashboardLink }) {
  const year = new Date().getFullYear();
  const rankText = rank != null
    ? `Your bid was ranked <strong>#${rank}</strong> out of ${totalBids} bid${totalBids !== 1 ? 's' : ''} received.`
    : 'You were invited to this RFQ but did not submit a bid.';
  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><title>RFQ Closed</title></head>
<body style="margin:0;padding:0;background:#f5f4f2;font-family:'DM Sans',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f2;padding:40px 16px;">
  <tr><td align="center">
    <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e3df;">
      ${buildLogoHeader()}
      <tr><td style="padding:36px 36px 28px;">
        <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f0e0d;">RFQ Closed</h1>
        <p style="margin:0 0 24px;font-size:15px;color:#6b6660;line-height:1.6;">
          Dear <strong style="color:#0f0e0d;">${vendorName}</strong>,<br/>
          The following RFQ has now been closed and is no longer accepting bids.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
          <tr><td style="background:#faf9f7;border:1px solid #e4e0db;border-radius:8px;padding:18px 20px;">
            <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#b8b3ae;letter-spacing:.06em;text-transform:uppercase;">RFQ Details</p>
            <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#0f0e0d;">${rfqTitle}</p>
            <p style="margin:0;font-size:12px;color:#6b6660;">Ref: <strong>${rfqReference}</strong></p>
          </td></tr>
        </table>
        <p style="font-size:14px;color:#6b6660;line-height:1.6;">${rankText}</p>
        <p style="font-size:14px;color:#6b6660;line-height:1.6;">The buyer will review all bids and announce the award shortly. We appreciate your participation.</p>
        ${dashboardLink ? `<a href="${dashboardLink}" style="display:inline-block;background:#c8501a;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:15px;font-weight:600;margin-top:8px;">View in Dashboard</a>` : ''}
      </td></tr>
      <tr><td style="background:#f5f4f2;padding:20px 36px;text-align:center;">
        <p style="margin:0;font-size:12px;color:#b8b3ae;">© ${year} ${APP_NAME}. All rights reserved.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;

  const info = await getTransporter().sendMail({
    from: FROM,
    to,
    subject: `RFQ Closed — ${rfqTitle}`,
    html,
  });
  return info;
}

// ─────────────────────────────────────────────────────────────────────────────
// sendRFQDeadlineExtendedEmail — notify invited vendors that deadline changed
// ─────────────────────────────────────────────────────────────────────────────
export async function sendRFQDeadlineExtendedEmail({
  to,
  vendorName,
  rfqTitle,
  rfqReference,
  oldDeadline,
  newDeadline,
  dashboardLink,
}) {
  const year = new Date().getFullYear();
  const hadPreviousDeadline = !!oldDeadline;
  const heading = hadPreviousDeadline ? 'RFQ Deadline Extended' : 'RFQ Deadline Updated';
  const subject = hadPreviousDeadline
    ? `RFQ deadline extended — ${rfqTitle}`
    : `RFQ deadline updated — ${rfqTitle}`;
  const intro = hadPreviousDeadline
    ? 'The deadline for the following RFQ has been extended.'
    : 'The deadline for the following RFQ has been updated.';
  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><title>RFQ Deadline Extended</title></head>
<body style="margin:0;padding:0;background:#f5f4f2;font-family:'DM Sans',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f2;padding:40px 16px;">
  <tr><td align="center">
    <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e3df;">
      ${buildLogoHeader()}
      <tr><td style="padding:36px 36px 28px;">
        <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f0e0d;">${heading}</h1>
        <p style="margin:0 0 24px;font-size:15px;color:#6b6660;line-height:1.6;">
          Dear <strong style="color:#0f0e0d;">${vendorName}</strong>,<br/>
          ${intro}
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
          <tr><td style="background:#faf9f7;border:1px solid #e4e0db;border-radius:8px;padding:18px 20px;">
            <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#b8b3ae;letter-spacing:.06em;text-transform:uppercase;">RFQ</p>
            <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#0f0e0d;">${rfqTitle}</p>
            <p style="margin:0 0 10px;font-size:12px;color:#6b6660;">Ref: <strong>${rfqReference}</strong></p>
            ${hadPreviousDeadline ? `<p style="margin:0 0 4px;font-size:12px;color:#6b6660;">Previous deadline: <strong>${formatDeadlineDateTime(oldDeadline)}</strong></p>` : ''}
            <p style="margin:0;font-size:12px;color:#0f0e0d;">New deadline: <strong>${formatDeadlineDateTime(newDeadline)}</strong></p>
          </td></tr>
        </table>
        <a href="${dashboardLink}" style="display:inline-block;background:#c8501a;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:15px;font-weight:600;">View RFQ</a>
      </td></tr>
      <tr><td style="background:#f5f4f2;padding:20px 36px;text-align:center;">
        <p style="margin:0;font-size:12px;color:#b8b3ae;">© ${year} ${APP_NAME}. All rights reserved.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;

  const info = await getTransporter().sendMail({
    from: FROM,
    to,
    subject,
    html,
  });
  return info;
}

// ─────────────────────────────────────────────────────────────────────────────
// sendRFQDeadlineReminderEmail — notify vendors before deadline (24h / 12h / 6h)
// ─────────────────────────────────────────────────────────────────────────────
export async function sendRFQDeadlineReminderEmail({
  to,
  vendorName,
  rfqTitle,
  rfqReference,
  hoursBefore,
  deadline,
  dashboardLink,
}) {
  const year = new Date().getFullYear();
  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><title>RFQ Deadline Reminder</title></head>
<body style="margin:0;padding:0;background:#f5f4f2;font-family:'DM Sans',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f2;padding:40px 16px;">
  <tr><td align="center">
    <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e3df;">
      ${buildLogoHeader()}
      <tr><td style="padding:36px 36px 28px;">
        <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f0e0d;">RFQ Deadline Reminder</h1>
        <p style="margin:0 0 24px;font-size:15px;color:#6b6660;line-height:1.6;">
          Dear <strong style="color:#0f0e0d;">${vendorName}</strong>,<br/>
          This is a reminder that the RFQ deadline is in <strong style="color:#0f0e0d;">${hoursBefore} hours or less</strong>.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
          <tr><td style="background:#faf9f7;border:1px solid #e4e0db;border-radius:8px;padding:18px 20px;">
            <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#b8b3ae;letter-spacing:.06em;text-transform:uppercase;">RFQ</p>
            <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#0f0e0d;">${rfqTitle}</p>
            <p style="margin:0 0 10px;font-size:12px;color:#6b6660;">Ref: <strong>${rfqReference}</strong></p>
            <p style="margin:0;font-size:12px;color:#0f0e0d;">Deadline: <strong>${formatDeadlineDateTime(deadline)}</strong></p>
          </td></tr>
        </table>
        <a href="${dashboardLink}" style="display:inline-block;background:#c8501a;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:15px;font-weight:600;">Open RFQ</a>
      </td></tr>
      <tr><td style="background:#f5f4f2;padding:20px 36px;text-align:center;">
        <p style="margin:0;font-size:12px;color:#b8b3ae;">© ${year} ${APP_NAME}. All rights reserved.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;

  const info = await getTransporter().sendMail({
    from: FROM,
    to,
    subject: `Reminder: ${rfqTitle} deadline in ${hoursBefore} hours`,
    html,
  });
  return info;
}

// ─────────────────────────────────────────────────────────────────────────────
// sendContractAwardedEmail — notify the winning vendor of their win
// ─────────────────────────────────────────────────────────────────────────────
export async function sendContractAwardedEmail({ to, vendorName, rfqTitle, rfqReference, contractReference, dashboardLink }) {
  const year = new Date().getFullYear();
  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><title>Congratulations — Contract Awarded</title></head>
<body style="margin:0;padding:0;background:#f5f4f2;font-family:'DM Sans',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f2;padding:40px 16px;">
  <tr><td align="center">
    <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e3df;">
      ${buildLogoHeader()}
      <tr><td style="padding:36px 36px 28px;">
        <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f0e0d;">🏆 Congratulations — You Won!</h1>
        <p style="margin:0 0 24px;font-size:15px;color:#6b6660;line-height:1.6;">
          Dear <strong style="color:#0f0e0d;">${vendorName}</strong>,<br/>
          Your bid has been selected and a contract has been awarded to you.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
          <tr><td style="background:#d1fae5;border:1px solid #6ee7b7;border-radius:8px;padding:18px 20px;">
            <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#065f46;letter-spacing:.06em;text-transform:uppercase;">Contract Details</p>
            <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#0f0e0d;">${rfqTitle}</p>
            <p style="margin:0 0 4px;font-size:13px;color:#065f46;">RFQ Ref: <strong>${rfqReference}</strong></p>
            <p style="margin:0;font-size:13px;color:#065f46;">Contract Ref: <strong>${contractReference}</strong></p>
          </td></tr>
        </table>
        <a href="${dashboardLink}" style="display:inline-block;background:#c8501a;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:15px;font-weight:600;">View Contract Details</a>
      </td></tr>
      <tr><td style="background:#f5f4f2;padding:20px 36px;text-align:center;">
        <p style="margin:0;font-size:12px;color:#b8b3ae;">© ${year} ${APP_NAME}. All rights reserved.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;

  const info = await getTransporter().sendMail({
    from: FROM,
    to,
    subject: `🏆 Contract Awarded — ${rfqTitle}`,
    html,
  });
  return info;
}

// ─────────────────────────────────────────────────────────────────────────────
// sendStaffContractAwardedEmail — notify company admins/managers when a contract is awarded
// ─────────────────────────────────────────────────────────────────────────────
export async function sendStaffContractAwardedEmail({ to, staffName, vendorName, rfqTitle, rfqReference, contractReference, dashboardLink }) {
  const year = new Date().getFullYear();
  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><title>Contract Awarded</title></head>
<body style="margin:0;padding:0;background:#f5f4f2;font-family:'DM Sans',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f2;padding:40px 16px;">
  <tr><td align="center">
    <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e3df;">
      ${buildLogoHeader()}
      <tr><td style="padding:36px 36px 28px;">
        <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f0e0d;">Contract Successfully Awarded</h1>
        <p style="margin:0 0 24px;font-size:15px;color:#6b6660;line-height:1.6;">
          Hi ${staffName || 'there'},<br/>
          A contract has been awarded for the following RFQ.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
          <tr><td style="background:#faf9f7;border:1px solid #e4e0db;border-radius:8px;padding:18px 20px;">
            <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#b8b3ae;letter-spacing:.06em;text-transform:uppercase;">Contract Details</p>
            <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#0f0e0d;">${rfqTitle}</p>
            <p style="margin:0 0 4px;font-size:13px;color:#6b6660;">RFQ Ref: <strong>${rfqReference}</strong></p>
            <p style="margin:0 0 4px;font-size:13px;color:#6b6660;">Contract Ref: <strong>${contractReference}</strong></p>
            <p style="margin:0;font-size:13px;color:#6b6660;">Awarded to: <strong style="color:#0f0e0d;">${vendorName}</strong></p>
          </td></tr>
        </table>
        <a href="${dashboardLink}" style="display:inline-block;background:#c8501a;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:15px;font-weight:600;">View Contract</a>
      </td></tr>
      <tr><td style="background:#f5f4f2;padding:20px 36px;text-align:center;">
        <p style="margin:0;font-size:12px;color:#b8b3ae;">© ${year} ${APP_NAME}. All rights reserved.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;

  const info = await getTransporter().sendMail({
    from: FROM,
    to,
    subject: `Contract awarded — ${rfqTitle} (${contractReference})`,
    html,
  });
  return info;
}

// ─────────────────────────────────────────────────────────────────────────────
// sendBidRejectedEmail — notify losing vendors
// ─────────────────────────────────────────────────────────────────────────────
export async function sendBidRejectedEmail({ to, vendorName, rfqTitle, rfqReference }) {
  const year = new Date().getFullYear();
  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><title>Bid Status Update</title></head>
<body style="margin:0;padding:0;background:#f5f4f2;font-family:'DM Sans',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f2;padding:40px 16px;">
  <tr><td align="center">
    <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e3df;">
      ${buildLogoHeader()}
      <tr><td style="padding:36px 36px 28px;">
        <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f0e0d;">Bid Status Update</h1>
        <p style="margin:0 0 24px;font-size:15px;color:#6b6660;line-height:1.6;">
          Dear <strong style="color:#0f0e0d;">${vendorName}</strong>,<br/>
          Thank you for participating in the following RFQ. We regret to inform you that another vendor has been selected for this contract.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
          <tr><td style="background:#faf9f7;border:1px solid #e4e0db;border-radius:8px;padding:18px 20px;">
            <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#b8b3ae;letter-spacing:.06em;text-transform:uppercase;">RFQ</p>
            <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#0f0e0d;">${rfqTitle}</p>
            <p style="margin:0;font-size:12px;color:#6b6660;">Ref: <strong>${rfqReference}</strong></p>
          </td></tr>
        </table>
        <p style="font-size:14px;color:#6b6660;line-height:1.6;">We appreciate your interest and encourage you to participate in future opportunities.</p>
      </td></tr>
      <tr><td style="background:#f5f4f2;padding:20px 36px;text-align:center;">
        <p style="margin:0;font-size:12px;color:#b8b3ae;">© ${year} ${APP_NAME}. All rights reserved.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;

  const info = await getTransporter().sendMail({
    from: FROM,
    to,
    subject: `Bid status update for "${rfqTitle}"`,
    html,
  });
  return info;
}

// ─────────────────────────────────────────────────────────────────────────────
// sendPlanChangeEmail — notify company admin when their subscription plan changes
// ─────────────────────────────────────────────────────────────────────────────
export async function sendPlanChangeEmail({ to, adminName, companyName, oldPlan, newPlan, changedBy }) {
  const year        = new Date().getFullYear();
  const isUpgrade   = newPlan === 'pro';
  const actionLabel = isUpgrade ? 'upgraded' : 'downgraded';
  const iconEmoji   = isUpgrade ? '🚀' : '📦';

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><title>Subscription Plan ${actionLabel}</title></head>
<body style="margin:0;padding:0;background:#f5f4f2;font-family:'DM Sans',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f2;padding:40px 16px;">
  <tr><td align="center">
    <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e3df;">
      ${buildLogoHeader('#1a1a1a')}
      <tr>
        <td style="padding:36px;">
          <p style="margin:0 0 8px;font-size:24px;">${iconEmoji}</p>
          <h1 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#1a1a1a;letter-spacing:-.3px;">
            Your plan has been ${actionLabel}
          </h1>
          <p style="margin:0 0 24px;font-size:14px;color:#5a5550;line-height:1.6;">
            Hi ${adminName || 'there'},<br/><br/>
            The subscription plan for <strong>${companyName}</strong> has been
            <strong>${actionLabel}</strong> by ${changedBy || 'a platform administrator'}.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f8f6;border-radius:8px;border:1px solid #e5e3df;margin-bottom:24px;">
            <tr>
              <td style="padding:16px 20px;border-bottom:1px solid #e5e3df;">
                <span style="font-size:12px;color:#9a9590;text-transform:uppercase;letter-spacing:.06em;">Previous Plan</span>
                <p style="margin:4px 0 0;font-size:15px;font-weight:600;color:#1a1a1a;text-transform:capitalize;">${oldPlan || '—'}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 20px;">
                <span style="font-size:12px;color:#9a9590;text-transform:uppercase;letter-spacing:.06em;">New Plan</span>
                <p style="margin:4px 0 0;font-size:15px;font-weight:700;color:#1a1a1a;text-transform:capitalize;">${newPlan}</p>
              </td>
            </tr>
          </table>
          <p style="margin:0;font-size:13px;color:#9a9590;line-height:1.6;">
            If you have any questions about your plan, please contact support.
          </p>
        </td>
      </tr>
      <tr>
        <td style="background:#f5f4f2;padding:20px 36px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#b8b3ae;">&copy; ${year} ${APP_NAME}. All rights reserved.</p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;

  const info = await getTransporter().sendMail({
    from:    FROM,
    to,
    subject: `Your ${APP_NAME} plan has been ${actionLabel} to ${newPlan}`,
    html,
  });
  return info;
}
