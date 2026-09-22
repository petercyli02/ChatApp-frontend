import { ApiError } from "./apiError";

const FALLBACK_MESSAGE = "Something went wrong. Please try again.";

/** Turn anything a `catch` receives into a sentence safe to show a user. */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  console.error("Unexpected error", error);
  return FALLBACK_MESSAGE;
}
