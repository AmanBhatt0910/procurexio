// src/lib/mailer.js
// Uses Resend (https://resend.com) — install: npm install resend
// Set RESEND_API_KEY and INVITE_FROM_EMAIL in your .env.local

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.INVITE_FROM_EMAIL || 'Procurexio <no-reply@procurexio.com>';
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Procurexio';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';

/**
 * Send a team invitation email.
 *
 * @param {object} opts
 * @param {string} opts.to          - Recipient email
 * @param {string} opts.token       - Invitation token (stored in DB)
 * @param {string} opts.role        - Role being assigned
 * @param {string} opts.companyName - Inviting company name
 * @param {string} opts.invitedBy   - Name of the person who sent the invite
 */
export async function sendInviteEmail({ to, token, role, companyName, invitedBy }) {
  const inviteUrl = `${BASE_URL}/register?token=${token}`;

  const formattedRole = role
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());

  const html = buildInviteHtml({ inviteUrl, companyName, invitedBy, formattedRole, appName: APP_NAME });

  const { data, error } = await resend.emails.send({
    from:    FROM,
    to,
    subject: `You've been invited to join ${companyName} on ${APP_NAME}`,
    html,
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }

  return data;
}

// ─── HTML email template ──────────────────────────────────────────────────────
function buildInviteHtml({ inviteUrl, companyName, invitedBy, formattedRole, appName }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You're invited</title>
</head>
<body style="margin:0;padding:0;background:#f5f4f2;font-family:'DM Sans',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f2;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e3df;">

          <!-- Header -->
          <tr>
            <td style="background:#0f0e0d;padding:28px 36px;">
              <p style="margin:0;font-size:18px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">${appName}</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 36px 28px;">
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f0e0d;letter-spacing:-0.4px;">
                You've been invited
              </h1>
              <p style="margin:0 0 24px;font-size:15px;color:#6b6660;line-height:1.6;">
                <strong style="color:#0f0e0d;">${invitedBy}</strong> has invited you to join
                <strong style="color:#0f0e0d;">${companyName}</strong> on ${appName}
                as <strong style="color:#0f0e0d;">${formattedRole}</strong>.
              </p>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#0f0e0d;border-radius:8px;">
                    <a href="${inviteUrl}"
                       style="display:inline-block;padding:13px 28px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:-0.1px;">
                      Accept Invitation &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0;font-size:13px;color:#9d9894;">
                This invitation expires in <strong>7 days</strong>. If you weren't expecting this, you can safely ignore it.
              </p>
            </td>
          </tr>

          <!-- Link fallback -->
          <tr>
            <td style="padding:0 36px 28px;">
              <p style="margin:0;font-size:12px;color:#b8b4b0;">
                Or copy this link:<br />
                <a href="${inviteUrl}" style="color:#0f0e0d;word-break:break-all;">${inviteUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f5f4f2;padding:18px 36px;border-top:1px solid #e5e3df;">
              <p style="margin:0;font-size:12px;color:#b8b4b0;">
                &copy; ${new Date().getFullYear()} ${appName}. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}