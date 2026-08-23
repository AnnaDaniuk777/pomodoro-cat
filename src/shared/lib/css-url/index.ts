export function cssUrl(src: string): string {
  return `url("${src.replace(/["\\]/g, '\\$&')}")`;
}
