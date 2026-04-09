'use client';

/**
 * src/hooks/useForm.js
 *
 * Generic form-state management hook. Handles field values, dirty tracking,
 * per-field validation errors, and async submission with loading/error states.
 *
 * @template {Record<string, unknown>} T
 * @param {T} initialValues          - Initial field values
 * @param {(values: T) => Partial<Record<keyof T, string>>} [validate]
 *   Optional synchronous validator: return a map of fieldName → error message.
 * @returns {FormBag<T>}
 */

import { useState, useCallback } from 'react';

/**
 * @template T
 * @param {T} initialValues
 * @param {(values: T) => Partial<Record<keyof T, string>>} [validate]
 * @returns {{
 *   values: T,
 *   errors: Partial<Record<keyof T, string>>,
 *   touched: Partial<Record<keyof T, boolean>>,
 *   isSubmitting: boolean,
 *   submitError: string|null,
 *   handleChange: (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) => void,
 *   handleBlur:   (e: React.FocusEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) => void,
 *   setFieldValue: (name: keyof T, value: unknown) => void,
 *   setErrors: (errors: Partial<Record<keyof T, string>>) => void,
 *   handleSubmit: (onSubmit: (values: T) => Promise<void>) => (e: React.FormEvent) => Promise<void>,
 *   reset: () => void,
 * }}
 */
export function useForm(initialValues, validate) {
  const [values, setValues]         = useState(initialValues);
  const [errors, setErrors]         = useState({});
  const [touched, setTouched]       = useState({});
  const [isSubmitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setValues(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear field error when user starts editing
    setErrors(prev => ({ ...prev, [name]: undefined }));
  }, []);

  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    if (validate) {
      const fieldErrors = validate(values);
      setErrors(prev => ({ ...prev, [name]: fieldErrors[name] }));
    }
  }, [validate, values]);

  const setFieldValue = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: undefined }));
  }, []);

  const handleSubmit = useCallback((onSubmit) => async (e) => {
    e.preventDefault();
    setSubmitError(null);

    if (validate) {
      const fieldErrors = validate(values);
      if (Object.values(fieldErrors).some(Boolean)) {
        setErrors(fieldErrors);
        // Mark all fields as touched so errors are visible
        const allTouched = Object.fromEntries(
          Object.keys(values).map(k => [k, true])
        );
        setTouched(allTouched);
        return;
      }
    }

    setSubmitting(true);
    try {
      await onSubmit(values);
    } catch (err) {
      setSubmitError(err.message || 'An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  }, [validate, values]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setSubmitting(false);
    setSubmitError(null);
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    submitError,
    handleChange,
    handleBlur,
    setFieldValue,
    setErrors,
    handleSubmit,
    reset,
  };
}
