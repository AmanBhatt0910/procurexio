// src/lib/mailer.js
// Uses Resend (https://resend.com) — install: npm install resend
// Set RESEND_API_KEY and INVITE_FROM_EMAIL in your .env.local

import { Resend } from 'resend';
import { INVITATION_EXPIRY_DAYS, PASSWORD_RESET_EXPIRY_HOURS } from '@/config/constants';
import buildLogoHeader from './buildLogoHeader';

// Lazy initialization — avoids build-time errors when RESEND_API_KEY is absent
let _resend = null;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

const FROM      = process.env.INVITE_FROM_EMAIL || 'Procurexio <no-reply@procurexio.com>';
const APP_NAME  = process.env.NEXT_PUBLIC_APP_NAME  || 'Procurexio';
const BASE_URL  = process.env.NEXT_PUBLIC_BASE_URL  || 'http://localhost:3001';

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
