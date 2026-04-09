/**
 * src/types/entities.js
 *
 * JSDoc type definitions for core domain entities.
 * These are documentation-only — they have no runtime cost.
 * Import in any file to get IDE autocompletion and type checking.
 *
 * @example
 * // In your component or API route:
 * // @param {User} user
 */

/**
 * @typedef {Object} User
 * @property {number}  id
 * @property {string}  name
 * @property {string}  email
 * @property {string}  role        - One of: super_admin | company_admin | manager | employee | vendor_user
 * @property {number}  company_id
 * @property {boolean} is_active
 * @property {string}  created_at
 */

/**
 * @typedef {Object} Company
 * @property {number} id
 * @property {string} name
 * @property {string} [industry]
 * @property {string} [size]
 * @property {string} status      - active | suspended | pending
 * @property {string} created_at
 */

/**
 * @typedef {Object} Vendor
 * @property {number}  id
 * @property {number}  company_id
 * @property {string}  name
 * @property {string}  email
 * @property {string}  [phone]
 * @property {string}  [category]
 * @property {string}  status      - active | inactive | pending
 * @property {string}  created_at
 */

/**
 * @typedef {Object} RFQ
 * @property {number}  id
 * @property {number}  company_id
 * @property {string}  title
 * @property {string}  [description]
 * @property {string}  status       - draft | published | closed | awarded | cancelled
 * @property {string}  deadline
 * @property {string}  created_by
 * @property {string}  created_at
 */

/**
 * @typedef {Object} Bid
 * @property {number}  id
 * @property {number}  rfq_id
 * @property {number}  vendor_id
 * @property {number}  company_id
 * @property {string}  status       - draft | submitted | withdrawn | awarded | rejected
 * @property {number}  [total_amount]
 * @property {string}  created_at
 * @property {string}  updated_at
 */

/**
 * @typedef {Object} Contract
 * @property {number}  id
 * @property {number}  rfq_id
 * @property {number}  bid_id
 * @property {number}  vendor_id
 * @property {number}  company_id
 * @property {string}  status       - active | completed | terminated
 * @property {string}  awarded_at
 */

/**
 * @typedef {Object} Notification
 * @property {number}      id
 * @property {number}      company_id
 * @property {number}      user_id
 * @property {string}      type
 * @property {string}      title
 * @property {string|null} body
 * @property {string|null} link
 * @property {boolean}     is_read
 * @property {string}      created_at
 */

export {};
