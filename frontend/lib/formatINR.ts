/**
 * formatINR.ts
 * Indian currency and number formatting utilities.
 */

const INR_FORMATTER = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const INR_COMPACT_FORMATTER = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  notation: "compact",
  maximumFractionDigits: 2,
});

/** Format as ₹1,23,456 */
export function formatINR(value: number): string {
  return INR_FORMATTER.format(value);
}

/** Format as ₹1.23L or ₹12.3K */
export function formatINRCompact(value: number): string {
  if (value >= 100_000) {
    const lakhs = value / 100_000;
    return `₹${lakhs.toFixed(2)}L`;
  }
  if (value >= 1_000) {
    const thousands = value / 1_000;
    return `₹${thousands.toFixed(1)}K`;
  }
  return formatINR(value);
}

/** Format range as "₹6,000 – ₹9,000" */
export function formatINRRange(low: number, high: number): string {
  return `${formatINR(low)} – ${formatINR(high)}`;
}

/** Format range compact e.g. "₹1.56L – ₹2.34L" */
export function formatINRRangeCompact(low: number, high: number): string {
  return `${formatINRCompact(low)} – ${formatINRCompact(high)}`;
}
