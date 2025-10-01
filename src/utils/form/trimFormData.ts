/**
 * Form data trimming utilities
 *
 * These utilities automatically trim whitespace from string values in form data
 * before submission, while preserving password fields and providing good UX.
 */

/**
 * Recursively trims all string values in an object, excluding specified fields
 *
 * @param data - The form data object to trim
 * @param excludeFields - Array of field names to exclude from trimming (defaults to password fields)
 * @returns A new object with all string values trimmed
 *
 * @example
 * ```typescript
 * const data = { username: '  john  ', password: '  pass123  ' };
 * const trimmed = trimFormData(data);
 * // Result: { username: 'john', password: '  pass123  ' }
 * ```
 */
export const trimFormData = <T extends Record<string, any>>(
  data: T,
  excludeFields: string[] = ['password', 'confirmPassword', 'newPassword', 'passwordConfirmation']
): T => {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const trimmed: Record<string, any> = { ...data };

  Object.keys(trimmed).forEach((key) => {
    const value = trimmed[key];

    // Skip excluded fields (like passwords)
    if (excludeFields.includes(key)) {
      return;
    }

    // Handle null and undefined
    if (value === null || value === undefined) {
      return;
    }

    // Trim strings
    if (typeof value === 'string') {
      trimmed[key] = value.trim();
      return;
    }

    // Recursively handle nested objects (but not arrays or dates)
    if (typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      trimmed[key] = trimFormData(value, excludeFields);
    }
  });

  return trimmed as T;
};

/**
 * Creates a wrapper for form submit handlers that automatically trims data
 *
 * This is useful for wrapping async submit handlers to avoid repetition.
 *
 * @param onSubmit - The original submit handler
 * @param excludeFields - Optional array of field names to exclude from trimming
 * @returns A wrapped submit handler that trims data before calling the original
 *
 * @example
 * ```typescript
 * const onSubmit = withTrimming(async (data: LoginFormInputs) => {
 *   // data is already trimmed here
 *   await login(data).unwrap();
 * });
 * ```
 */
export const withTrimming = <T extends Record<string, any>>(
  onSubmit: (data: T) => void | Promise<void>,
  excludeFields?: string[]
) => {
  return (data: T) => {
    const trimmedData = trimFormData(data, excludeFields);
    return onSubmit(trimmedData);
  };
};
