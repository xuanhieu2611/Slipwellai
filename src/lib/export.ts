export function exportFilename(now = new Date()) {
  return `slipwell-export-${now.toISOString().slice(0, 10)}.json`;
}
