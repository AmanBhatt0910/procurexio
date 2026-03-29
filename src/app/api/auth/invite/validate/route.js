// src/app/api/auth/invite/validate/route.js
//
// GET /api/auth/invite/validate?token=<token>
// Returns the invitation details (email, role, company) so the
// register page can pre-fill fields and confirm the token is valid.

import pool from '@/lib/db';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return Response.json({ error: 'Token is required' }, { status: 400 });
  }

  try {
    const [rows] = await pool.query(
      `SELECT i.email, i.role, i.expires_at, i.accepted_at,
              c.name AS company_name
       FROM   invitations i
       JOIN   companies   c ON c.id = i.company_id
       WHERE  i.token = ?
       LIMIT  1`,
      [token]
    );

    if (!rows.length) {
      return Response.json({ error: 'Invalid invitation link' }, { status: 404 });
    }

    const invite = rows[0];

    if (invite.accepted_at) {
      return Response.json({ error: 'This invitation has already been used' }, { status: 410 });
    }

    if (new Date(invite.expires_at) < new Date()) {
      return Response.json({ error: 'This invitation has expired' }, { status: 410 });
    }

    return Response.json({
      data: {
        email:       invite.email,
        role:        invite.role,
        companyName: invite.company_name,
      },
    });

  } catch (err) {
    console.error('[GET /api/auth/invite/validate]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}