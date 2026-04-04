// src/lib/mailer.js
// Uses Resend (https://resend.com) — install: npm install resend
// Set RESEND_API_KEY and INVITE_FROM_EMAIL in your .env.local

import { Resend } from 'resend';

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
// sendPasswordResetEmail — send a newly-generated temporary password to user
// ─────────────────────────────────────────────────────────────────────────────
export async function sendPasswordResetEmail({ to, name, tempPassword }) {
  const loginUrl = `${BASE_URL}/login`;

  const html = buildPasswordResetHtml({ name, tempPassword, loginUrl, appName: APP_NAME });

  const { data, error } = await getResend().emails.send({
    from:    FROM,
    to,
    subject: `Your ${APP_NAME} password has been reset`,
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
          <tr>
            <td style="background:#0f0e0d;padding:28px 36px;">
              <p style="margin:0;font-size:18px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">${appName}</p>
            </td>
          </tr>
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
                This invitation expires in <strong>7 days</strong>. If you weren't expecting this, you can safely ignore it.
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
          <tr>
            <td style="background:#0d5c46;padding:28px 36px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin:0;font-size:18px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">${appName}</p>
                  </td>
                  <td align="right">
                    <span style="display:inline-block;background:rgba(255,255,255,.15);border-radius:20px;padding:4px 12px;font-size:11px;font-weight:600;color:#a7f3d0;letter-spacing:.05em;text-transform:uppercase;">
                      Vendor Portal
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
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
                This invitation expires in <strong>7 days</strong>.<br/>
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
          <tr>
            <td style="background:#0f0e0d;padding:0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:26px 32px;">
                    <p style="margin:0;font-size:19px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">${appName}</p>
                  </td>
                  <td align="right" style="padding:0 32px 0 0;">
                    <span style="font-size:22px;letter-spacing:4px;">🎉</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

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
          <tr>
            <td style="background:#0f0e0d;padding:28px 36px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td><p style="margin:0;font-size:18px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">${appName}</p></td>
                  <td align="right"><span style="display:inline-block;background:rgba(200,80,26,.25);border-radius:20px;padding:4px 12px;font-size:11px;font-weight:600;color:#f5a07a;letter-spacing:.05em;text-transform:uppercase;">RFQ Invitation</span></td>
                </tr>
              </table>
            </td>
          </tr>
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
          <tr>
            <td style="background:#0f0e0d;padding:28px 36px;">
              <p style="margin:0;font-size:18px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">${appName}</p>
            </td>
          </tr>
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
