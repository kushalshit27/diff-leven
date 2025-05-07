import { DiffResult, DiffOptions } from './types';

/**
 * ANSI color codes for terminal output
 */
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  dim: '\x1b[2m',
  gray: '\x1b[90m',
};

/**
 * Format a value for display in the diff output
 */
function formatValue(value: any): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return `"${value}"`;
  return String(value);
}

/**
 * Format a diff result as a string with optional colors
 */
export function formatDiff(
  diffResult: DiffResult,
  indent = 0,
  options: DiffOptions = {},
): string {
  const useColor = options.color !== false;
  const indentation = '  '.repeat(indent);

  // Handle direct value changes
  if ('__old' in diffResult && '__new' in diffResult) {
    const oldValue = formatValue(diffResult.__old);
    const newValue = formatValue(diffResult.__new);

    if (useColor) {
      return [
        `${indentation}${colors.red}- ${oldValue}${colors.reset}`,
        `${indentation}${colors.green}+ ${newValue}${colors.reset}`,
      ].join('\n');
    }

    return [`${indentation}- ${oldValue}`, `${indentation}+ ${newValue}`].join(
      '\n',
    );
  }

  // Handle objects/arrays
  const lines: string[] = [];
  const isArray = Array.isArray(diffResult);

  // Opening bracket
  lines.push(`${indentation}${isArray ? '[' : '{'}`);

  // Process each key/index
  Object.keys(diffResult).forEach((key) => {
    const value = diffResult[key];

    // Skip internal properties
    if (key === '__old' || key === '__new') return;

    // Process nested diff result
    if (
      typeof value === 'object' &&
      value !== null &&
      (value.__old !== undefined || value.__new !== undefined)
    ) {
      const propName = isArray ? '' : `${key}: `;

      if ('__old' in value && '__new' in value) {
        // Direct property change
        const oldValue = formatValue(value.__old);
        const newValue = formatValue(value.__new);

        if (useColor) {
          lines.push(
            `${indentation}  ${colors.red}- ${propName}${oldValue}${colors.reset}`,
          );
          lines.push(
            `${indentation}  ${colors.green}+ ${propName}${newValue}${colors.reset}`,
          );
        } else {
          lines.push(`${indentation}  - ${propName}${oldValue}`);
          lines.push(`${indentation}  + ${propName}${newValue}`);
        }
      } else {
        // Nested object with changes
        lines.push(
          `${indentation}  ${propName}${formatDiff(value, indent + 1, options)}`,
        );
      }
    } else {
      // Unchanged property
      const propName = isArray ? '' : `${key}: `;
      const formattedValue =
        typeof value === 'object' && value !== null
          ? formatDiff(value, indent + 1, options)
          : formatValue(value);

      if (useColor) {
        lines.push(
          `${indentation}  ${colors.dim}${propName}${formattedValue}${colors.reset}`,
        );
      } else {
        lines.push(`${indentation}  ${propName}${formattedValue}`);
      }
    }
  });

  // Closing bracket
  lines.push(`${indentation}${isArray ? ']' : '}'}`);

  return lines.join('\n');
}

/**
 * Format the result of a diff operation as a string
 */
export function diffToString(
  oldObj: any,
  newObj: any,
  diffResult: DiffResult,
  options: DiffOptions = {},
): string {
  return formatDiff(diffResult, 0, options);
}
