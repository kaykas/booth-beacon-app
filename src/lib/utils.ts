import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get a required environment variable with runtime validation.
 * Throws an error if the environment variable is not set.
 *
 * @param key - The environment variable key
 * @returns The environment variable value
 * @throws Error if the environment variable is not set
 */
export function getRequiredEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}
