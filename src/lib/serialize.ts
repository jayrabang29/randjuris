import { Decimal } from "@prisma/client/runtime/library";

function isDecimal(value: unknown): value is Decimal {
  return (
    value instanceof Decimal ||
    (typeof value === "object" &&
      value !== null &&
      typeof (value as Decimal).toNumber === "function" &&
      typeof (value as Decimal).toFixed === "function")
  );
}

/**
 * Recursively converts Prisma Decimal values to plain numbers so data
 * can be safely passed from Server Components to Client Components.
 */
export function serializeForClient<T>(data: T): T {
  if (isDecimal(data)) {
    return data.toNumber() as T;
  }

  if (data instanceof Date) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => serializeForClient(item)) as T;
  }

  if (data !== null && typeof data === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = serializeForClient(value);
    }
    return result as T;
  }

  return data;
}
