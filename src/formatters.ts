import { DiffResult, DiffOptions, DiffValue, isDiffChange } from './types';

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
function formatValue(value: DiffValue): string {
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
  if (isDiffChange(diffResult)) {
    const oldValue = formatValue(diffResult.__old ?? undefined);
    const newValue = formatValue(diffResult.__new ?? undefined);

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

  // Exit if diffResult is a primitive or null/undefined
  if (
    diffResult === null ||
    diffResult === undefined ||
    typeof diffResult !== 'object'
  ) {
    return formatValue(diffResult as DiffValue);
  }

  const isArray = Array.isArray(diffResult);

  // Opening bracket
  lines.push(`${indentation}${isArray ? '[' : '{'}`);

  // Process each key/index
  const diffResultObj = diffResult as Record<string, DiffResult>;

  Object.keys(diffResultObj).forEach((key) => {
    const value = diffResultObj[key];

    // Skip internal properties
    if (key === '__old' || key === '__new') return;

    // Process nested diff result
    if (typeof value === 'object' && value !== null && isDiffChange(value)) {
      const propName = isArray ? '' : `${key}: `;

      if ('__old' in value && '__new' in value) {
        // Direct property change
        const oldValue = formatValue(value.__old ?? undefined);
        const newValue = formatValue(value.__new ?? undefined);

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
  oldObj: DiffValue,
  newObj: DiffValue,
  diffResult: DiffResult,
  options: DiffOptions = {},
): string {
  return formatDiff(diffResult, 0, options);
}
