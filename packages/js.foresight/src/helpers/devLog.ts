/**
 * Logs a styled dev message to the console.
 * Callers are responsible for checking `enableManagerLogging` first.
 */
export const devLogMessage = (name: string, message: string, color: string): void => {
  console.log(`%c${name}: ${message}`, `color: ${color}; font-weight: bold;`)
}
