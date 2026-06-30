import clsx, { type ClassValue } from "clsx";

/** Tiny class-name combiner used across components. */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
