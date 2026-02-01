/**
 * Escapes special characters in search strings for PostgREST ILIKE queries.
 * Prevents SQL wildcard abuse and unintended pattern matching.
 * 
 * @param value - The raw search string from user input
 * @returns The escaped string safe for use in ILIKE patterns
 */
export function escapePostgRESTFilter(value: string): string {
  return value
    .replace(/\\/g, '\\\\')  // Escape backslash first
    .replace(/%/g, '\\%')    // Escape SQL wildcard %
    .replace(/_/g, '\\_');   // Escape SQL wildcard _
}
