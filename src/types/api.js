/**
 * src/types/api.js
 *
 * JSDoc type definitions for API request/response shapes.
 * Documentation-only — no runtime cost.
 */

/**
 * Standard success envelope returned by all API routes.
 *
 * @template T
 * @typedef {Object} ApiSuccess
 * @property {string} message
 * @property {T}      data
 */

/**
 * Standard error envelope returned by all API routes.
 *
 * @typedef {Object} ApiError
 * @property {string} error
 */

/**
 * Paginated list response.
 *
 * @template T
 * @typedef {Object} PaginatedResponse
 * @property {T[]}   items
 * @property {number} total
 * @property {number} page
 * @property {number} pageSize
 * @property {number} totalPages
 */

/**
 * Auth /me response data.
 *
 * @typedef {Object} SessionUser
 * @property {number} id
 * @property {string} name
 * @property {string} email
 * @property {string} role
 * @property {number} company_id
 * @property {string} [company_name]
 */

export {};
