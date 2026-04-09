// src/app/api/admin/subscriptions/route.js
//
// Super-admin endpoint for managing company subscription plans.
//
// PATCH /api/admin/subscriptions
//   Body: { company_id, plan_name }
//   - Assigns the named plan to the company
//   - Logs the change via audit.js
//   - Sends an email notification to the company admin

import pool from '@/lib/db';
import { assignPlanToCompany, getCompanyPlan } from '@/lib/subscription';
import { logAction, ACTION } from '@/lib/audit';
import { sendPlanChangeEmail } from '@/lib/mailer';

// GET /api/admin/subscriptions?company_id=X — fetch current plan for a company
export async function GET(request) {
  const role = request.headers.get('x-user-role');
  if (role !== 'super_admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get('company_id');
  if (!companyId) {
    return Response.json({ error: 'company_id is required' }, { status: 400 });
  }

  try {
    const plan = await getCompanyPlan(companyId);
    return Response.json({ message: 'OK', data: { plan } });
  } catch (err) {
    console.error('[GET /api/admin/subscriptions]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/admin/subscriptions — assign a plan to a company
export async function PATCH(request) {
  const role      = request.headers.get('x-user-role');
  const adminId   = request.headers.get('x-user-id');
  const adminEmail = request.headers.get('x-user-email');

  if (role !== 'super_admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body;
  try { body = await request.json(); }
  catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { company_id, plan_name } = body;

  if (!company_id) {
    return Response.json({ error: 'company_id is required' }, { status: 400 });
  }
  if (!['free', 'pro'].includes(plan_name)) {
    return Response.json({ error: "plan_name must be 'free' or 'pro'" }, { status: 400 });
  }

  try {
    // Fetch company info (for email + old plan)
    const [[company]] = await pool.execute(
      `SELECT id, name, email, plan FROM companies WHERE id = ? LIMIT 1`,
      [company_id]
    );
    if (!company) {
      return Response.json({ error: 'Company not found' }, { status: 404 });
    }

    const oldPlan = company.plan || 'free';

    // Assign new plan
    const { subscription } = await assignPlanToCompany(company_id, plan_name);

    // Audit log
    await logAction(request, {
      userId:       parseInt(adminId, 10) || null,
      userEmail:    adminEmail || null,
      actionType:   ACTION.SUBSCRIPTION_PLAN_CHANGED,
      resourceType: 'company',
      resourceId:   company_id,
      resourceName: company.name,
      changes:      { before: { plan: oldPlan }, after: { plan: plan_name } },
      status:       'success',
    });

    // Find company admin email to notify
    const [[companyAdmin]] = await pool.execute(
      `SELECT name, email FROM users
        WHERE company_id = ? AND role = 'company_admin' AND is_active = 1
        ORDER BY created_at ASC LIMIT 1`,
      [company_id]
    );

    if (companyAdmin?.email) {
      try {
        await sendPlanChangeEmail({
          to:          companyAdmin.email,
          adminName:   companyAdmin.name,
          companyName: company.name,
          oldPlan,
          newPlan:     plan_name,
          changedBy:   adminEmail || 'Super Admin',
        });
      } catch (emailErr) {
        // Non-fatal — email failure must never break the API response
        console.error('[PATCH /api/admin/subscriptions] email error:', emailErr.message);
      }
    }

    return Response.json({
      message: `Plan updated to '${plan_name}' for ${company.name}`,
      data:    { subscription },
    });
  } catch (err) {
    console.error('[PATCH /api/admin/subscriptions]', err);
    return Response.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
