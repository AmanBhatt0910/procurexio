// src/app/api/settings/preferences/route.js
// GET /api/settings/preferences — fetch user UI preferences
// PUT /api/settings/preferences — update user UI preferences

import { NextResponse } from 'next/server';
import { getPreferences, updatePreferences } from '@/lib/settingsService';

const VALID_THEMES = ['light', 'dark', 'system'];

export async function GET(request) {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await getPreferences(Number(userId));
    return NextResponse.json({ message: 'OK', data });
  } catch (err) {
    console.error('[GET /api/settings/preferences]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { theme, language, timezone, default_dashboard_view, items_per_page } = body;

  if (theme && !VALID_THEMES.includes(theme)) {
    return NextResponse.json(
      { error: `theme must be one of: ${VALID_THEMES.join(', ')}` },
      { status: 400 }
    );
  }

  if (items_per_page !== undefined) {
    const n = Number(items_per_page);
    if (!Number.isInteger(n) || n < 5 || n > 100) {
      return NextResponse.json({ error: 'items_per_page must be an integer between 5 and 100.' }, { status: 400 });
    }
  }

  try {
    await updatePreferences(Number(userId), {
      language,
      timezone,
      theme,
      default_dashboard_view,
      items_per_page,
    });
    return NextResponse.json({ message: 'Preferences updated' });
  } catch (err) {
    console.error('[PUT /api/settings/preferences]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
