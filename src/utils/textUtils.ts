/**
 * Normalizes text by removing markdown bold/italic asterisks, underscores,
 * and stray formatting asterisks, ensuring clean, normal plain conversational text.
 */
export function cleanNormalText(raw: string): string {
  if (!raw) return "";
  let text = raw;

  // Convert markdown bullet points (* item) to clean round bullets (• item)
  text = text.replace(/^(\s*)\*\s+/gm, "$1• ");

  // Strip bold-italic asterisks: ***text*** -> text
  text = text.replace(/\*\*\*([^*\n]+?)\*\*\*/g, "$1");

  // Strip bold asterisks: **text** -> text
  text = text.replace(/\*\*([^*\n]+?)\*\*/g, "$1");

  // Strip italic asterisks: *text* -> text
  text = text.replace(/(^|[^*])\*([^*\s\n](?:[^*\n]*?[^*\s\n])?)\*([^*]|$)/g, "$1$2$3");

  // Strip bold underscores: __text__ -> text
  text = text.replace(/__([^_\n]+?)__/g, "$1");

  // Strip italic underscores: _text_ -> text
  text = text.replace(/(^|[^_])_([^_\s\n](?:[^_\n]*?[^_\s\n])?)_([^_]|$)/g, "$1$2$3");

  // Remove any remaining stray asterisks like ****
  text = text.replace(/\*{2,}/g, "");

  return text.trim();
}
