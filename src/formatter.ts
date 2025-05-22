import { DiffOptions, DiffResult, DiffType } from './types';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  gray: '\x1b[90m',
};

/**
 * Format a diff result as a string with optional colors and formatting
 * @param diff - The diff result to format
 * @param options - Formatting options
 * @returns A formatted string representation of the diff
 */
export function formatDiff(
  diff: DiffResult,
  options: DiffOptions = {},
): string {
  const { color = true, full = false } = options;

  // For unchanged values with no children, we may skip them unless full output is requested
  if (
    diff.type === DiffType.UNCHANGED &&
    !full &&
    (!diff.children || diff.children.length === 0)
  ) {
    return '';
  }

  // Handle primitive values
  if (!diff.children || diff.children.length === 0) {
    return formatValue(diff, color);
  }

  // Handle objects and arrays
  return formatComplex(diff, options);
}


/**
 * Format a primitive value diff (added, removed, changed)
 */
function formatValue(diff: DiffResult, useColor: boolean): string {
  const prefix = getPrefix(diff.type);
  let value = '';

  switch (diff.type) {
    case DiffType.ADDED:
      value = formatPrimitive(diff.newValue);
      return useColor
        ? `${colors.green}${prefix} ${value}${colors.reset}`
        : `${prefix} ${value}`;

    case DiffType.REMOVED:
      value = formatPrimitive(diff.oldValue);
      return useColor
        ? `${colors.red}${prefix} ${value}${colors.reset}`
        : `${prefix} ${value}`;

    case DiffType.CHANGED:
      const oldVal = formatPrimitive(diff.oldValue);
      const newVal = formatPrimitive(diff.newValue);

      // Add similarity information for strings if available
      let similarityInfo = '';
      if (
        diff.meta?.similarity !== undefined &&
        typeof diff.oldValue === 'string' &&
        typeof diff.newValue === 'string'
      ) {
        const similarity = Math.round(diff.meta.similarity * 100);
        similarityInfo = useColor
          ? `${colors.gray} (${similarity}% similar)${colors.reset}`
          : ` (${similarity}% similar)`;
      }

      // Git-style diff format: -old value followed by +new value
      const oldLine = useColor
        ? `${colors.red}- ${oldVal}${colors.reset}`
        : `- ${oldVal}`;

      const newLine = useColor
        ? `${colors.green}+ ${newVal}${similarityInfo}${colors.reset}`
        : `+ ${newVal}${similarityInfo}`;

      return `${oldLine}\n${newLine}`;

    default:
      return formatPrimitive(diff.newValue ?? diff.oldValue);
  }
}

/**
 * Format complex objects and arrays
 */
function formatComplex(diff: DiffResult, options: DiffOptions): string {
  const { color = true, full = false, outputKeys = [] } = options;

  // Skip unchanged nested values unless full output is requested
  if (diff.type === DiffType.UNCHANGED && !full) {
    return '';
  }

  // Check if this is a key-value object with simple changes
  const isSimpleObjectWithChanges =
    !Array.isArray(diff.oldValue) &&
    !Array.isArray(diff.newValue) &&
    typeof diff.oldValue === 'object' &&
    typeof diff.newValue === 'object';

  if (diff.type === DiffType.CHANGED && diff.children && isSimpleObjectWithChanges) {
    // For objects, use Git-like diff format with JSON-style indentation
    let result = '';
    const isArray = Array.isArray(diff.oldValue || diff.newValue);
    const openBracket = isArray ? '[' : '{';
    const closeBracket = isArray ? ']' : '}';

    // Add opening bracket
    result += openBracket;
    // Add newline if we have content
    if (diff.children && diff.children.length > 0) {
      result += '\n';
    }

    if (diff.children) {
      const relevantChildren = diff.children
        .filter((child) => {
          // Always include outputKeys
          if (child.path && outputKeys.includes(child.path[child.path.length - 1])) {
            return true;
          }
          // Include changed values or everything if full output is requested
          return child.type !== DiffType.UNCHANGED || full;
        });

      const childLines = relevantChildren.map((child) => {
        if (!child.path || child.path.length === 0) return '';

        const key = child.path[child.path.length - 1];

        if (child.type === DiffType.UNCHANGED) {
          // Unchanged property with proper indentation
          const value = formatPrimitive(child.newValue ?? child.oldValue);
          return `  "${key}": ${value},`;
        } else if (child.type === DiffType.ADDED) {
          // Added property with proper indentation
          const value = formatPrimitive(child.newValue);
          const formattedValue = formatMultilineValue(value, 4);
          const line = color
            ? `${colors.green}+  "${key}": ${formattedValue},${colors.reset}`
            : `+  "${key}": ${formattedValue},`;
          return line;
        } else if (child.type === DiffType.REMOVED) {
          // Removed property with proper indentation
          const value = formatPrimitive(child.oldValue);
          const formattedValue = formatMultilineValue(value, 4);
          const line = color
            ? `${colors.red}-  "${key}": ${formattedValue},${colors.reset}`
            : `-  "${key}": ${formattedValue},`;
          return line;
        } else if (child.type === DiffType.CHANGED) {
          const oldVal = formatPrimitive(child.oldValue);
          const newVal = formatPrimitive(child.newValue);

          // Check if child has its own children (nested object/array)
          if (child.children && child.children.length > 0) {
            // For nested objects/arrays, format them separately with proper indentation
            const nestedFormat = formatDiff(child, options);
            if (nestedFormat) {
              return `  "${key}": ${nestedFormat},`;
            }
          }

          // For simple changes, show both old and new values on separate lines with proper indentation
          const formattedOldVal = formatMultilineValue(oldVal, 4);
          const formattedNewVal = formatMultilineValue(newVal, 4);

          const oldLine = color
            ? `${colors.red}-  "${key}": ${formattedOldVal},${colors.reset}`
            : `-  "${key}": ${formattedOldVal},`;
          const newLine = color
            ? `${colors.green}+  "${key}": ${formattedNewVal},${colors.reset}`
            : `+  "${key}": ${formattedNewVal},`;
          return `${oldLine}\n${newLine}`;
        }
        return '';
      }).filter(line => line.length > 0);

      result += childLines.join('\n');
    }

    // Add closing bracket
    if (diff.children && diff.children.length > 0) {
      result += `\n${closeBracket}`;
    } else {
      result += closeBracket;
    }

    return result;
  }

  // Standard formatting for arrays and non-simple objects with JSON-style indentation
  let result = '';
  const isArray = Array.isArray(diff.oldValue || diff.newValue);
  const openBracket = isArray ? '[' : '{';
  const closeBracket = isArray ? ']' : '}';

  // Add opening bracket
  result += openBracket;
  // Add newline if we have content
  if (diff.children && diff.children.length > 0) {
    result += '\n';
  }

  // Process children
  if (diff.children) {
    const childLines = diff.children
      .filter((child) => {
        // Always include outputKeys
        if (
          child.path &&
          outputKeys.includes(child.path[child.path.length - 1])
        ) {
          return true;
        }

        // Include changed values or everything if full output is requested
        return child.type !== DiffType.UNCHANGED || full;
      })
      .map((child) => {
        const childFormat = formatDiff(child, options);
        if (!childFormat) return '';

        // For objects, include the key with proper JSON format
        if (!isArray && child.path && child.path.length > 0) {
          const key = child.path[child.path.length - 1];

          if (child.type === DiffType.UNCHANGED) {
            return `  "${key}": ${childFormat},`;
          } else if (child.type === DiffType.ADDED) {
            const formattedFormat = formatMultilineValue(childFormat, 4);
            return color
              ? `${colors.green}+  "${key}": ${formattedFormat},${colors.reset}`
              : `+  "${key}": ${formattedFormat},`;
          } else if (child.type === DiffType.REMOVED) {
            const formattedFormat = formatMultilineValue(childFormat, 4);
            return color
              ? `${colors.red}-  "${key}": ${formattedFormat},${colors.reset}`
              : `-  "${key}": ${formattedFormat},`;
          } else {
            // For CHANGED
            return `  "${key}": ${childFormat},`;
          }
        }

        // For arrays, format with proper indentation
        return `  ${childFormat}`;
      })
      .filter((line) => line.length > 0);

    result += childLines.join('\n');
  }

  // Add closing bracket
  if (diff.children && diff.children.length > 0) {
    result += `\n${closeBracket}`;
  } else {
    result += closeBracket;
  }

  return result;
}

/**
 * Format multi-line values with proper indentation
 */
function formatMultilineValue(value: string, baseIndent: number): string {
  // If the value contains newlines (like in pretty-printed JSON objects)
  if (value.includes('\n')) {
    // Add proper indentation to each line
    return value.split('\n').map((line, i) => {
      // Don't indent the first line as it's already indented by the caller
      if (i === 0) return line;
      return ' '.repeat(baseIndent) + line;
    }).join('\n');
  }

  return value;
}

/**
 * Get the prefix for a diff type
 */
function getPrefix(type: DiffType | string): string {
  switch (type) {
    case DiffType.ADDED:
      return '+';
    case DiffType.REMOVED:
      return '-';
    case DiffType.CHANGED:
      return '!';
    default:
      return ' ';
  }
}

/**
 * Format a primitive value for output
 */
function formatPrimitive(value: any): string {
  if (value === undefined) {
    return 'undefined';
  }

  if (value === null) {
    return 'null';
  }

  if (typeof value === 'string') {
    return `"${value}"`;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value.toString();
  }

  // For objects and arrays, use pretty JSON format
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }

  return String(value);
}
