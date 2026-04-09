// src/lib/deadline.js
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Returns an effective deadline date.
 * If a deadline is date-only (YYYY-MM-DD) or stored at 00:00:00, we treat it
 * as end-of-day so that the full deadline day remains valid.
 */
export function getEffectiveDeadlineDate(deadline) {
  if (!deadline) return null;

  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) return null;

  const isDateOnlyString =
    typeof deadline === 'string' && DATE_ONLY_PATTERN.test(deadline.trim());
  const isMidnightTime =
    date.getHours() === 0 &&
    date.getMinutes() === 0 &&
    date.getSeconds() === 0 &&
    date.getMilliseconds() === 0;

  if (isDateOnlyString || isMidnightTime) {
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 1);
  }

  return date;
}

export function isDeadlinePassed(deadline, now = new Date()) {
  const effective = getEffectiveDeadlineDate(deadline);
  return !!effective && now.getTime() > effective.getTime();
}

export function getDeadlineTimeLeftMs(deadline, now = new Date()) {
  const effective = getEffectiveDeadlineDate(deadline);
  if (!effective) return null;
  return effective.getTime() - now.getTime();
}
