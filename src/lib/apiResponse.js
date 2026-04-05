/**
 * src/lib/apiResponse.js
 *
 * Utility functions for creating consistent API responses.
 *
 * All successful responses follow the envelope pattern:
 *   { message: string, data: any }
 *
 * All error responses follow:
 *   { error: string }
 */

/**
 * Create a successful JSON response with a standardized envelope.
 *
 * @param {any}    data             - Response payload (placed under `data`)
 * @param {string} [message='OK']   - Human-readable success message
 * @param {number} [status=200]     - HTTP status code
 * @returns {Response}
 */
export function successResponse(data, message = 'OK', status = 200) {
  return Response.json({ message, data }, { status });
}

/**
 * Create an error JSON response.
 *
 * @param {string} error        - Human-readable error message
 * @param {number} [status=500] - HTTP status code
 * @returns {Response}
 */
export function errorResponse(error, status = 500) {
  return Response.json({ error }, { status });
}
