// src/config/rfq.js
//
// RFQ-related constants shared between frontend filters and backend validation.
// Values must match the rfqs.status DB ENUM.

/**
 * All RFQ statuses, in display order.
 * Used to build filter dropdowns and validate status transitions.
 */
export const RFQ_STATUSES = ['draft', 'published', 'closed', 'cancelled'];

/**
 * Status filter options for the RFQ list view.
 * 'all' is a UI-only sentinel (not a DB value).
 */
export const RFQ_STATUS_FILTERS = ['all', ...RFQ_STATUSES];
