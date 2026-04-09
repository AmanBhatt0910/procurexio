/**
 * src/types/common.js
 *
 * JSDoc type definitions for shared/common utility types.
 * Documentation-only — no runtime cost.
 */

/**
 * Generic callback with no arguments.
 * @typedef {() => void} VoidCallback
 */

/**
 * Async handler that may throw.
 * @typedef {() => Promise<void>} AsyncVoidCallback
 */

/**
 * Common status values used across entities.
 * @typedef {'active'|'inactive'|'pending'|'suspended'} Status
 */

/**
 * Children prop — accept any valid React content.
 * @typedef {import('react').ReactNode} ReactChildren
 */

/**
 * Form field change event.
 * @typedef {import('react').ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>} FieldChangeEvent
 */

export {};
