/**
 * Truncates a note to maxLen characters, appending the unicode ellipsis (…)
 * when truncation occurs. Returns the original string if it fits within maxLen.
 */
export function truncateNotePreview(text: string, maxLen = 25): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + "…";
}
