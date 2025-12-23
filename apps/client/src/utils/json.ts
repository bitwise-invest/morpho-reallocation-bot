/**
 * Replacer function for JSON.stringify to handle BigInt serialization.
 * Converts BigInt values to strings so they can be serialized to JSON.
 */
export function bigIntReplacer(_key: string, value: unknown): unknown {
  if (typeof value === "bigint") {
    return value.toString();
  }
  return value;
}
