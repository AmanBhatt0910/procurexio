// src/lib/mailer.js
// Uses Resend (https://resend.com) — install: npm install resend
// Set RESEND_API_KEY and INVITE_FROM_EMAIL in your .env.local

import { Resend } from 'resend';
import { INVITATION_EXPIRY_DAYS, PASSWORD_RESET_EXPIRY_HOURS } from '@/config/constants';
import { BASE_URL } from '@/config/api';
import { EMAIL_FROM, APP_NAME } from '@/config/email';

// Lazy initialization — avoids build-time errors when RESEND_API_KEY is absent
let _resend = null;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
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

  const { data, error } = await getResend().emails.send({
    from:    FROM,
    to,
    subject: `You've been invited to join ${companyName} on ${APP_NAME}`,
    html,
  });

  if (error) throw new Error(`Resend error: ${error.message}`);
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// sendPasswordResetTokenEmail — send a secure token-based reset link to user
// ─────────────────────────────────────────────────────────────────────────────
export async function sendPasswordResetTokenEmail({ to, name, token }) {
  const resetUrl = `${BASE_URL}/reset-password?token=${token}`;

  const html = buildPasswordResetTokenHtml({ name, resetUrl, appName: APP_NAME });

  const { data, error } = await getResend().emails.send({
    from:    FROM,
    to,
    subject: `Reset your ${APP_NAME} password`,
    html,
  });

  if (error) throw new Error(`Resend error: ${error.message}`);
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// sendVendorInviteEmail — vendor portal access invite
// ─────────────────────────────────────────────────────────────────────────────
export async function sendVendorInviteEmail({ to, token, vendorName, companyName, invitedBy }) {
  const inviteUrl = `${BASE_URL}/register?token=${token}`;

  const html = buildVendorInviteHtml({ inviteUrl, vendorName, companyName, invitedBy, appName: APP_NAME });

  const { data, error } = await getResend().emails.send({
    from:    FROM,
    to,
    subject: `${companyName} has invited ${vendorName} to join ${APP_NAME}`,
    html,
  });

  if (error) throw new Error(`Resend error: ${error.message}`);
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// sendWelcomeEmail — fired immediately after a new company registers
// ─────────────────────────────────────────────────────────────────────────────
export async function sendWelcomeEmail({ to, name, companyName }) {
  const dashboardUrl = `${BASE_URL}/dashboard`;
  const vendorsUrl   = `${BASE_URL}/dashboard/vendors/new`;
  const rfqUrl       = `${BASE_URL}/dashboard/rfqs/new`;

  const html = buildWelcomeHtml({ name, companyName, dashboardUrl, vendorsUrl, rfqUrl, appName: APP_NAME });

  const { data, error } = await getResend().emails.send({
    from:    FROM,
    to,
    subject: `Welcome to ${APP_NAME}, ${name.split(' ')[0]}! Your workspace is ready.`,
    html,
  });

  if (error) throw new Error(`Resend error: ${error.message}`);
  return data;
}

export default function buildLogoHeader(bgColor = '#0f0e0d', extraContent = '') {
  // LOGO_DATA_URI — the full Procurexio logo (icon + wordmark), transparent background,
  // embedded as base64 so it renders in all email clients without a CDN dependency.
  // Rendered at 126x36 CSS px (252x72 physical px for retina).
  const LOGO_DATA_URI = 'data:image/png;base64,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';
  const logoUrl = `${BASE_URL}/logo.png`;

  return `
    <tr>
      <td style="background:${bgColor};padding:22px 36px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <!--[if mso]>
                <img src="${logoUrl}" alt="${APP_NAME}" width="126" height="36"
                  style="display:block;border:0;outline:none;text-decoration:none;" />
              <![endif]-->
              <!--[if !mso]><!-- -->
              <img src="${LOGO_DATA_URI}"
                alt="${APP_NAME}"
                width="126" height="36"
                style="display:block;border:0;outline:none;text-decoration:none;max-width:100%;" />
              <!--<![endif]-->
            </td>
            ${extraContent ? `<td align="right">${extraContent}</td>` : ''}
          </tr>
        </table>
      </td>
    </tr>`;
}


// ─────────────────────────────────────────────────────────────────────────────
// HTML: Internal team invite
// ─────────────────────────────────────────────────────────────────────────────
function buildTeamInviteHtml({ inviteUrl, companyName, invitedBy, formattedRole, appName }) {
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
          ${buildLogoHeader()}
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
                This invitation expires in <strong>${INVITATION_EXPIRY_DAYS} days</strong>. If you weren't expecting this, you can safely ignore it.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 36px 28px;">
              <p style="margin:0;font-size:12px;color:#b8b4b0;">
                Or copy this link:<br />
                <a href="${inviteUrl}" style="color:#0f0e0d;word-break:break-all;">${inviteUrl}</a>
              </p>
            </td>
          </tr>
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


// ─────────────────────────────────────────────────────────────────────────────
// HTML: Vendor portal invite
// ─────────────────────────────────────────────────────────────────────────────
function buildVendorInviteHtml({ inviteUrl, vendorName, companyName, invitedBy, appName }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Vendor Portal Invitation</title>
</head>
<body style="margin:0;padding:0;background:#f0f7f4;font-family:'DM Sans',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f7f4;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #c3ddd5;">
          ${buildLogoHeader('#0d5c46', '<span style="display:inline-block;background:rgba(255,255,255,.15);border-radius:20px;padding:4px 12px;font-size:11px;font-weight:600;color:#a7f3d0;letter-spacing:.05em;text-transform:uppercase;">Vendor Portal</span>')}
          <tr>
            <td style="padding:36px 36px 0;text-align:center;">
              <div style="display:inline-block;width:56px;height:56px;background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:14px;line-height:56px;font-size:28px;">
                🤝
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 36px 28px;">
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f0e0d;letter-spacing:-0.4px;text-align:center;">
                Vendor Portal Access
              </h1>
              <p style="margin:0 0 20px;font-size:15px;color:#6b6660;line-height:1.6;text-align:center;">
                <strong style="color:#0f0e0d;">${invitedBy}</strong> at
                <strong style="color:#0f0e0d;">${companyName}</strong> has invited
                <strong style="color:#0f0e0d;">${vendorName}</strong> to access their
                procurement portal on ${appName}.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 18px;">
                    <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#059669;letter-spacing:.06em;text-transform:uppercase;">
                      What you'll get access to
                    </p>
                    <p style="margin:0;font-size:13.5px;color:#374151;line-height:1.7;">
                      ✓ &nbsp;View and respond to RFQs from ${companyName}<br/>
                      ✓ &nbsp;Submit bids and track their status<br/>
                      ✓ &nbsp;Manage your vendor profile and contacts<br/>
                      ✓ &nbsp;Receive real-time procurement notifications
                    </p>
                  </td>
                </tr>
              </table>
              <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="background:#0d5c46;border-radius:8px;">
                    <a href="${inviteUrl}"
                       style="display:inline-block;padding:14px 32px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:-0.1px;">
                      Set Up Your Vendor Account &rarr;
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;font-size:13px;color:#9d9894;text-align:center;">
                This invitation expires in <strong>${INVITATION_EXPIRY_DAYS} days</strong>.<br/>
                If ${vendorName} wasn't expecting this, this email can be safely ignored.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 36px 28px;">
              <p style="margin:0;font-size:12px;color:#b8b4b0;">
                Or copy this link:<br />
                <a href="${inviteUrl}" style="color:#0d5c46;word-break:break-all;">${inviteUrl}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f0f7f4;padding:18px 36px;border-top:1px solid #c3ddd5;">
              <p style="margin:0;font-size:12px;color:#b8b4b0;">
                &copy; ${new Date().getFullYear()} ${appName}. All rights reserved.<br/>
                This invitation was sent on behalf of ${companyName}.
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


// ─────────────────────────────────────────────────────────────────────────────
// HTML: Welcome email — sent after new company registration
// ─────────────────────────────────────────────────────────────────────────────
function buildWelcomeHtml({ name, companyName, dashboardUrl, vendorsUrl, rfqUrl, appName }) {
  const firstName = name.split(' ')[0];
  const year      = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to ${appName}</title>
</head>
<body style="margin:0;padding:0;background:#f5f4f2;font-family:'DM Sans',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f2;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e5e3df;">

          <!-- Header -->
          ${buildLogoHeader('#0f0e0d', '<span style="font-size:22px;letter-spacing:4px;">🎉</span>')}

          <!-- Hero band -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a1816 0%,#2d2a27 100%);padding:40px 32px 36px;">
              <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#c8501a;letter-spacing:.08em;text-transform:uppercase;">
                Workspace created
              </p>
              <h1 style="margin:0 0 10px;font-size:28px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;line-height:1.2;">
                Welcome aboard,<br />${firstName}!
              </h1>
              <p style="margin:0;font-size:15px;color:rgba(255,255,255,.5);line-height:1.6;">
                Your procurement workspace for
                <strong style="color:rgba(255,255,255,.8);">${companyName}</strong>
                is live and ready to use.
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 32px 28px;">
              <p style="margin:0 0 24px;font-size:15px;color:#4b4845;line-height:1.7;">
                Hi <strong style="color:#0f0e0d;">${firstName}</strong>, you're all set.
                Here's how to get the most out of ${appName} in the next few minutes:
              </p>

              <!-- Step 1 -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
                <tr>
                  <td style="background:#faf9f7;border:1px solid #e5e3df;border-radius:10px;padding:18px 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:36px;vertical-align:top;padding-right:14px;">
                          <div style="width:36px;height:36px;background:#0f0e0d;border-radius:8px;text-align:center;line-height:36px;font-size:16px;">🏢</div>
                        </td>
                        <td style="vertical-align:top;">
                          <p style="margin:0 0 3px;font-size:14px;font-weight:600;color:#0f0e0d;">1. Add your vendors</p>
                          <p style="margin:0 0 10px;font-size:13px;color:#6b6660;line-height:1.5;">
                            Build your vendor directory and invite contacts so they can receive and respond to RFQs directly.
                          </p>
                          <a href="${vendorsUrl}" style="display:inline-block;font-size:12.5px;font-weight:600;color:#0f0e0d;text-decoration:none;border-bottom:1.5px solid #0f0e0d;padding-bottom:1px;">
                            Add first vendor &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Step 2 -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
                <tr>
                  <td style="background:#faf9f7;border:1px solid #e5e3df;border-radius:10px;padding:18px 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:36px;vertical-align:top;padding-right:14px;">
                          <div style="width:36px;height:36px;background:#0f0e0d;border-radius:8px;text-align:center;line-height:36px;font-size:16px;">📋</div>
                        </td>
                        <td style="vertical-align:top;">
                          <p style="margin:0 0 3px;font-size:14px;font-weight:600;color:#0f0e0d;">2. Create your first RFQ</p>
                          <p style="margin:0 0 10px;font-size:13px;color:#6b6660;line-height:1.5;">
                            Define line items, set a deadline, and invite vendors to submit competitive bids — all in one place.
                          </p>
                          <a href="${rfqUrl}" style="display:inline-block;font-size:12.5px;font-weight:600;color:#0f0e0d;text-decoration:none;border-bottom:1.5px solid #0f0e0d;padding-bottom:1px;">
                            Create an RFQ &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Step 3 -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#faf9f7;border:1px solid #e5e3df;border-radius:10px;padding:18px 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:36px;vertical-align:top;padding-right:14px;">
                          <div style="width:36px;height:36px;background:#0f0e0d;border-radius:8px;text-align:center;line-height:36px;font-size:16px;">👥</div>
                        </td>
                        <td style="vertical-align:top;">
                          <p style="margin:0 0 3px;font-size:14px;font-weight:600;color:#0f0e0d;">3. Invite your team</p>
                          <p style="margin:0 0 10px;font-size:13px;color:#6b6660;line-height:1.5;">
                            Add managers and employees so they can collaborate on bids, evaluations, and contract management.
                          </p>
                          <a href="${dashboardUrl}/company/users" style="display:inline-block;font-size:12.5px;font-weight:600;color:#0f0e0d;text-decoration:none;border-bottom:1.5px solid #0f0e0d;padding-bottom:1px;">
                            Invite team members &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:0 32px 36px;">
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="background:#0f0e0d;border-radius:10px;text-align:center;">
                    <a href="${dashboardUrl}"
                       style="display:block;padding:15px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:-0.1px;">
                      Go to your dashboard &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 32px;">
              <hr style="border:none;border-top:1px solid #e5e3df;margin:0;" />
            </td>
          </tr>

          <!-- Workspace facts -->
          <tr>
            <td style="padding:24px 32px;">
              <p style="margin:0 0 14px;font-size:11px;font-weight:600;color:#b8b4b0;letter-spacing:.08em;text-transform:uppercase;">
                Your workspace
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:50%;padding-right:6px;vertical-align:top;">
                    <table cellpadding="0" cellspacing="0" width="100%"
                      style="background:#faf9f7;border:1px solid #e5e3df;border-radius:8px;padding:12px 14px;">
                      <tr>
                        <td>
                          <p style="margin:0 0 2px;font-size:11px;color:#9d9894;text-transform:uppercase;letter-spacing:.05em;">Company</p>
                          <p style="margin:0;font-size:13px;font-weight:600;color:#0f0e0d;">${companyName}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td style="width:50%;padding-left:6px;vertical-align:top;">
                    <table cellpadding="0" cellspacing="0" width="100%"
                      style="background:#faf9f7;border:1px solid #e5e3df;border-radius:8px;padding:12px 14px;">
                      <tr>
                        <td>
                          <p style="margin:0 0 2px;font-size:11px;color:#9d9894;text-transform:uppercase;letter-spacing:.05em;">Your role</p>
                          <p style="margin:0;font-size:13px;font-weight:600;color:#0f0e0d;">Company Admin</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f5f4f2;padding:18px 32px;border-top:1px solid #e5e3df;">
              <p style="margin:0;font-size:12px;color:#b8b4b0;line-height:1.6;">
                &copy; ${year} ${appName}. All rights reserved.<br />
                You received this because you just created a workspace on ${appName}.
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
// ─────────────────────────────────────────────────────────────────────────────
// sendVendorRFQInviteEmail — notify vendor when invited to an RFQ
// ─────────────────────────────────────────────────────────────────────────────
export async function sendVendorRFQInviteEmail({ to, vendorName, companyName, rfqTitle, rfqReference, deadline, inviteLink }) {
  const html = buildVendorRFQInviteHtml({ vendorName, companyName, rfqTitle, rfqReference, deadline, inviteLink, appName: APP_NAME });

  const { data, error } = await getResend().emails.send({
    from:    FROM,
    to,
    subject: `${companyName} has invited you to bid on: ${rfqTitle}`,
    html,
  });

  if (error) throw new Error(`Resend error: ${error.message}`);
  return data;
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

  const { data, error } = await getResend().emails.send({
    from: FROM,
    to,
    subject: `New bid received on "${rfqTitle}" from ${vendorName}`,
    html,
  });
  if (error) throw new Error(`Resend error: ${error.message}`);
  return data;
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

  const { data, error } = await getResend().emails.send({
    from: FROM,
    to,
    subject: `Bid updated on "${rfqTitle}" by ${vendorName}`,
    html,
  });
  if (error) throw new Error(`Resend error: ${error.message}`);
  return data;
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

  const { data, error } = await getResend().emails.send({
    from: FROM,
    to,
    subject: `RFQ Closed — ${rfqTitle}`,
    html,
  });
  if (error) throw new Error(`Resend error: ${error.message}`);
  return data;
}

function formatDeadlineDateTime(deadline) {
  if (!deadline) return 'Not specified';
  return new Date(deadline).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
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

  const { data, error } = await getResend().emails.send({
    from: FROM,
    to,
    subject,
    html,
  });
  if (error) throw new Error(`Resend error: ${error.message}`);
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// sendRFQDeadlineReminderEmail — notify vendors before deadline (12h / 6h)
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

  const { data, error } = await getResend().emails.send({
    from: FROM,
    to,
    subject: `Reminder: ${rfqTitle} deadline in ${hoursBefore} hours`,
    html,
  });
  if (error) throw new Error(`Resend error: ${error.message}`);
  return data;
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

  const { data, error } = await getResend().emails.send({
    from: FROM,
    to,
    subject: `🏆 Contract Awarded — ${rfqTitle}`,
    html,
  });
  if (error) throw new Error(`Resend error: ${error.message}`);
  return data;
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

  const { data, error } = await getResend().emails.send({
    from: FROM,
    to,
    subject: `Contract awarded — ${rfqTitle} (${contractReference})`,
    html,
  });
  if (error) throw new Error(`Resend error: ${error.message}`);
  return data;
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

  const { data, error } = await getResend().emails.send({
    from: FROM,
    to,
    subject: `Bid status update for "${rfqTitle}"`,
    html,
  });
  if (error) throw new Error(`Resend error: ${error.message}`);
  return data;
}

function buildVendorRFQInviteHtml({ vendorName, companyName, rfqTitle, rfqReference, deadline, inviteLink, appName }) {
  const deadlineText = deadline
    ? new Date(deadline).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : 'No deadline specified';
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>RFQ Invitation</title>
</head>
<body style="margin:0;padding:0;background:#f5f4f2;font-family:'DM Sans',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f2;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e3df;">
          ${buildLogoHeader('#0f0e0d', '<span style="display:inline-block;background:rgba(200,80,26,.25);border-radius:20px;padding:4px 12px;font-size:11px;font-weight:600;color:#f5a07a;letter-spacing:.05em;text-transform:uppercase;">RFQ Invitation</span>')}
          <tr>
            <td style="padding:36px 36px 28px;">
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f0e0d;letter-spacing:-0.4px;">You've been invited to bid</h1>
              <p style="margin:0 0 24px;font-size:15px;color:#6b6660;line-height:1.6;">
                <strong style="color:#0f0e0d;">${companyName}</strong> has invited
                <strong style="color:#0f0e0d;">${vendorName}</strong> to submit a quotation for the following RFQ.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="background:#faf9f7;border:1px solid #e4e0db;border-radius:8px;padding:18px 20px;">
                    <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#b8b3ae;letter-spacing:.06em;text-transform:uppercase;">RFQ Title</p>
                    <p style="margin:0 0 14px;font-size:15px;font-weight:600;color:#0f0e0d;">${rfqTitle}</p>
                    <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#b8b3ae;letter-spacing:.06em;text-transform:uppercase;">Reference</p>
                    <p style="margin:0 0 14px;font-size:14px;color:#6b6660;font-family:monospace;">${rfqReference}</p>
                    <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#b8b3ae;letter-spacing:.06em;text-transform:uppercase;">Submission Deadline</p>
                    <p style="margin:0;font-size:14px;color:#0f0e0d;font-weight:500;">${deadlineText}</p>
                  </td>
                </tr>
              </table>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#c8501a;border-radius:8px;">
                    <a href="${inviteLink}" style="display:inline-block;padding:13px 28px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:-0.1px;">
                      View RFQ &amp; Submit Bid &rarr;
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;font-size:13px;color:#9d9894;">
                Log in to the ${appName} vendor portal to review the RFQ details and submit your quotation before the deadline.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 36px 28px;">
              <p style="margin:0;font-size:12px;color:#b8b4b0;">
                Or copy this link:<br />
                <a href="${inviteLink}" style="color:#0f0e0d;word-break:break-all;">${inviteLink}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f5f4f2;padding:18px 36px;border-top:1px solid #e5e3df;">
              <p style="margin:0;font-size:12px;color:#b8b4b0;">&copy; ${year} ${appName}. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// HTML: Password reset (temporary password)
// ─────────────────────────────────────────────────────────────────────────────
function buildPasswordResetHtml({ name, tempPassword, loginUrl, appName }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Password Reset</title>
</head>
<body style="margin:0;padding:0;background:#f5f4f2;font-family:'DM Sans',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f2;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e3df;">
          ${buildLogoHeader()}
          <tr>
            <td style="padding:36px 36px 28px;">
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f0e0d;letter-spacing:-0.4px;">
                Password Reset
              </h1>
              <p style="margin:0 0 20px;font-size:15px;color:#6b6660;line-height:1.6;">
                Hi <strong style="color:#0f0e0d;">${name}</strong>, a temporary password has been generated for your account.
                Use it to sign in, then change your password from your account settings.
              </p>
              <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px;">
                <tr>
                  <td style="background:#faf9f7;border:1.5px dashed #e4e0db;border-radius:8px;padding:16px 20px;text-align:center;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#b8b3ae;">
                      Temporary Password
                    </p>
                    <p style="margin:0;font-size:22px;font-weight:700;color:#0f0e0d;letter-spacing:.1em;font-family:monospace;">
                      ${tempPassword}
                    </p>
                  </td>
                </tr>
              </table>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#c8501a;border-radius:8px;">
                    <a href="${loginUrl}"
                       style="display:inline-block;padding:13px 28px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:-0.1px;">
                      Sign in to ${appName} &rarr;
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;font-size:13px;color:#9d9894;">
                If you did not request a password reset, please contact support immediately.
              </p>
            </td>
          </tr>
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

// ─────────────────────────────────────────────────────────────────────────────
// HTML: Password reset (token-based link)
// ─────────────────────────────────────────────────────────────────────────────
function buildPasswordResetTokenHtml({ name, resetUrl, appName }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset Your Password</title>
</head>
<body style="margin:0;padding:0;background:#f5f4f2;font-family:'DM Sans',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f2;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e3df;">
          ${buildLogoHeader()}
          <tr>
            <td style="padding:36px 36px 28px;">
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f0e0d;letter-spacing:-0.4px;">
                Reset your password
              </h1>
              <p style="margin:0 0 24px;font-size:15px;color:#6b6660;line-height:1.6;">
                Hi <strong style="color:#0f0e0d;">${name}</strong>, we received a request to reset your password.
                Click the button below to choose a new password. This link expires in <strong>${PASSWORD_RESET_EXPIRY_HOURS} hours</strong>.
              </p>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#c8501a;border-radius:8px;">
                    <a href="${resetUrl}"
                       style="display:inline-block;padding:13px 28px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:-0.1px;">
                      Reset password &rarr;
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;font-size:13px;color:#9d9894;">
                If you didn&rsquo;t request a password reset, you can safely ignore this email.
                Your password will not change.
              </p>
              <p style="margin:12px 0 0;font-size:12px;color:#b8b3ae;word-break:break-all;">
                Or copy this link into your browser:<br />
                <a href="${resetUrl}" style="color:#c8501a;">${resetUrl}</a>
              </p>
            </td>
          </tr>
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

  const { data, error } = await getResend().emails.send({
    from:    FROM,
    to,
    subject: `Your ${APP_NAME} plan has been ${actionLabel} to ${newPlan}`,
    html,
  });

  if (error) throw new Error(`Resend error: ${error.message}`);
  return data;
}
