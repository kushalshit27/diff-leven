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
  const { color = true, full = false, withSimilarity = false } = options;

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
    return formatValue(diff, color, withSimilarity);
  }

  // Handle objects and arrays
  return formatComplex(diff, options, 0);
}

/**
 * Format a primitive value diff (added, removed, changed)
 */
function formatValue(
  diff: DiffResult,
  useColor: boolean,
  withSimilarity: boolean = false,
): string {
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

      // Add similarity information for strings if available and withSimilarity is true
      let similarityInfo = '';
      if (
        withSimilarity &&
        diff.meta?.similarity !== undefined &&
        typeof diff.oldValue === 'string' &&
        typeof diff.newValue === 'string'
      ) {
        const similarity = Math.round(diff.meta.similarity * 100);
        similarityInfo = useColor
          ? `${colors.gray} (${similarity}% similar)${colors.reset}`
          : ` (${similarity}% similar)`;
      }

      // Git-style diff format: +new value followed by -old value
      const newLine = useColor
        ? `${colors.green}+ ${newVal}${similarityInfo}${colors.reset}`
        : `+ ${newVal}${similarityInfo}`;

      const oldLine = useColor
        ? `${colors.red}- ${oldVal}${colors.reset}`
        : `- ${oldVal}`;

      return `${newLine}\n${oldLine}`;

    default:
      value = formatPrimitive(diff.newValue ?? diff.oldValue);
      return useColor
        ? `${colors.gray}${prefix} ${value}${colors.reset}`
        : `${prefix} ${value}`;
  }
}

/**
 * Format complex objects and arrays
 * For objects, use Git-like diff format with JSON-style indentation
 */
function formatComplex(
  diff: DiffResult,
  options: DiffOptions,
  indent: number = 0,
): string {
  const { full = false } = options;

  // Early return for unchanged primitives
  if (
    diff.type === DiffType.UNCHANGED &&
    !full &&
    (!diff.children ||
      diff.children.length === 0 ||
      (typeof diff.oldValue !== 'object' && typeof diff.newValue !== 'object'))
  ) {
    return '';
  }

  return Array.isArray(diff.oldValue) || Array.isArray(diff.newValue)
    ? formatArrayDiff(diff, options, indent)
    : formatObjectDiff(diff, options, indent);
}

/**
 * Helper to render "+ then -" blocks for changed values.
 */
function renderChangedBlock(
  newValue: unknown,
  oldValue: unknown,
  options: { color: boolean; withSimilarity: boolean },
  indent: string,
  similarity?: number,
  key?: string,
): string {
  const { color, withSimilarity } = options;
  let similarityInfo = '';
  if (withSimilarity && similarity !== undefined) {
    similarityInfo = color
      ? `${colors.gray} (${Math.round(similarity * 100)}% similar)${colors.reset}`
      : ` (${Math.round(similarity * 100)}% similar)`;
  }

  const keyPrefix = key ? `${key}: ` : '';
  const newLine = color
    ? `${indent}${colors.green}+ ${keyPrefix}${formatPrimitive(newValue)}${similarityInfo}${colors.reset}`
    : `${indent}+ ${keyPrefix}${formatPrimitive(newValue)}${similarityInfo}`;
  const oldLine = color
    ? `${indent}${colors.red}- ${keyPrefix}${formatPrimitive(oldValue)}${colors.reset}`
    : `${indent}- ${keyPrefix}${formatPrimitive(oldValue)}`;
  return `${newLine}\n${oldLine}`;
}

/**
 * Format array diffs with proper indentation and Git-style markers
 */
function formatArrayDiff(
  diff: DiffResult,
  options: DiffOptions,
  indent: number = 0,
): string {
  const { color = true, full = false, withSimilarity = false } = options;
  const baseIndent = ' '.repeat(indent);
  const innerIndent = ' '.repeat(indent + 2);
  let result = `[\n`;
  let visibleItems = 0;

  if (diff.children) {
    for (let i = 0; i < diff.children.length; i++) {
      const child = diff.children[i];

      // Skip unchanged items unless full output is requested
      if (
        child.type === DiffType.UNCHANGED &&
        !full &&
        (!child.children || child.children.length === 0)
      ) {
        continue;
      }

      if (child.children && child.children.length > 0) {
        // Handle nested objects/arrays within the array
        const nestedOutput = Array.isArray(child.newValue || child.oldValue)
          ? formatArrayDiff(child, options, indent + 2)
          : formatObjectDiff(child, options, indent + 2);

        // Only add if there's actual content
        if (nestedOutput.trim().length > 2) {
          // More than just '[]' or '{}'
          if (visibleItems > 0) {
            result += ',\n';
          }
          result += innerIndent;
          result += nestedOutput;
          visibleItems++;
        }
      } else {
        // Handle primitive values
        if (visibleItems > 0) {
          result += ',\n';
        }

        switch (child.type) {
          case DiffType.ADDED:
            result += color
              ? `${innerIndent}${colors.green}+ ${formatPrimitive(child.newValue)}${colors.reset}`
              : `${innerIndent}+ ${formatPrimitive(child.newValue)}`;
            visibleItems++;
            break;
          case DiffType.REMOVED:
            result += color
              ? `${innerIndent}${colors.red}- ${formatPrimitive(child.oldValue)}${colors.reset}`
              : `${innerIndent}- ${formatPrimitive(child.oldValue)}`;
            visibleItems++;
            break;
          case DiffType.UNCHANGED:
            // Special handling for ignored values (when using ignoreValues: true)
            if (child.meta?.ignored && child.path) {
              result += color
                ? `${innerIndent}${colors.gray}  ${child.path[child.path.length - 1] || ''}${colors.reset}`
                : `${innerIndent}  ${child.path[child.path.length - 1] || ''}`;
            } else {
              result += color
                ? `${innerIndent}${colors.gray}  ${formatPrimitive(child.newValue)}${colors.reset}`
                : `${innerIndent}  ${formatPrimitive(child.newValue)}`;
            }
            visibleItems++;
            break;
          case DiffType.CHANGED:
            result += renderChangedBlock(
              child.newValue,
              child.oldValue,
              { color, withSimilarity },
              innerIndent,
              child.meta?.similarity,
            );
            visibleItems++;
            break;
        }
      }
    }
  }

  if (visibleItems > 0) {
    result += '\n';
  }
  result += `${baseIndent}]`;
  return result;
}

/**
 * Format object diffs with proper indentation and Git-style markers
 */
function formatObjectDiff(
  diff: DiffResult,
  options: DiffOptions,
  indent: number = 0,
): string {
  const { color = true, full = false, withSimilarity = false } = options;
  const baseIndent = ' '.repeat(indent);
  const innerIndent = ' '.repeat(indent + 2);
  let result = `{\n`;
  let visibleItems = 0;

  if (diff.children) {
    // First, filter out children that won't be displayed
    const displayableChildren = diff.children.filter((child) => {
      if (child.type !== DiffType.UNCHANGED) return true;
      if (full) return true;
      if (child.children && child.children.length > 0) return true;
      const key = child.path?.[child.path.length - 1] || '';
      if (options.outputKeys?.includes(key)) return true;
      return false;
    });

    for (let i = 0; i < displayableChildren.length; i++) {
      const child = displayableChildren[i];
      const key = child.path?.[child.path.length - 1] || '';
      const isLast = i === displayableChildren.length - 1;

      // If we already added an item, and we're not at a new line, add a comma and new line
      if (visibleItems > 0 && !result.endsWith('\n')) {
        result += ',\n';
      }

      if (child.children && child.children.length > 0) {
        // Handle nested objects/arrays
        const nestedContent = Array.isArray(child.newValue || child.oldValue)
          ? formatArrayDiff(child, options, indent + 2)
          : formatObjectDiff(child, options, indent + 2);

        // Only add if there's actual content in the nested structure
        if (nestedContent.trim().length > 2) {
          // More than just '{}' or '[]'
          result += `${innerIndent}${key}: `;
          result += nestedContent;
          visibleItems++;
        }
      } else {
        // Handle primitive values
        switch (child.type) {
          case DiffType.ADDED:
            result += color
              ? `${innerIndent}${colors.green}+ ${key}: ${formatPrimitive(child.newValue)}${colors.reset}`
              : `${innerIndent}+ ${key}: ${formatPrimitive(child.newValue)}`;
            visibleItems++;
            break;
          case DiffType.REMOVED:
            result += color
              ? `${innerIndent}${colors.red}- ${key}: ${formatPrimitive(child.oldValue)}${colors.reset}`
              : `${innerIndent}- ${key}: ${formatPrimitive(child.oldValue)}`;
            visibleItems++;
            break;
          case DiffType.CHANGED:
            result += renderChangedBlock(
              child.newValue,
              child.oldValue,
              { color, withSimilarity },
              innerIndent,
              child.meta?.similarity,
              key,
            );
            visibleItems++;
            break;
          case DiffType.UNCHANGED:
            if (full || options.outputKeys?.includes(key)) {
              // Special handling for ignored values (when using ignoreValues: true)
              if (child.meta?.ignored) {
                result += color
                  ? `${innerIndent}${colors.gray}  ${key}${colors.reset}`
                  : `${innerIndent}  ${key}`;
              } else {
                result += color
                  ? `${innerIndent}${colors.gray}  ${key}: ${formatPrimitive(child.newValue)}${colors.reset}`
                  : `${innerIndent}  ${key}: ${formatPrimitive(child.newValue)}`;
              }
              visibleItems++;
            }
            break;
        }
      }

      // Add comma if not the last item and not already ending with newline
      if (!isLast && !result.endsWith('\n')) {
        result += ',';
      }

      // Always ensure we end with a newline before the next item
      if (!result.endsWith('\n')) {
        result += '\n';
      }
    }
  }

  // Only add final newline if we have content
  if (visibleItems > 0 && !result.endsWith('\n')) {
    result += '\n';
  }

  result += `${baseIndent}}`;
  return result;
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
function formatPrimitive(value: unknown): string {
  if (value === undefined) {
    return 'undefined';
  }

  if (value === null) {
    return 'null';
  }

  if (typeof value === 'string') {
    // Use JavaScript object notation with single quotes
    return `'${value}'`;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value.toString();
  }

  // For objects and arrays, use properly formatted JavaScript object notation
  if (typeof value === 'object') {
    const json = JSON.stringify(value, null, 2);
    return json;
  }

  return String(value);
}
