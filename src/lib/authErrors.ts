import { FirebaseError } from "firebase/app";

/**
 * Firebase auth error codes mapped to messages a user can act on.
 *
 * Anything not listed here falls through to a generic message. An unrecognised
 * code almost always means a bug or a misconfigured project rather than
 * something the user did wrong, and inventing wording for it would mislead them.
 */
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  // Projects with email enumeration protection enabled - the default for new
  // projects - return this single code instead of wrong-password or
  // user-not-found, so an attacker cannot discover which emails are registered.
  // The older two codes are kept for projects with the protection turned off.
  "auth/invalid-credential": "Incorrect email or password.",
  "auth/wrong-password": "Incorrect email or password.",
  "auth/user-not-found": "Incorrect email or password.",

  "auth/invalid-email": "That email address is not valid.",
  "auth/user-disabled": "This account has been disabled.",
  "auth/email-already-in-use": "An account with that email already exists.",
  "auth/weak-password": "That password is too weak. Please choose a longer one.",
  "auth/too-many-requests":
    "Too many attempts. Please wait a moment and try again.",
  "auth/network-request-failed":
    "Could not reach the server. Check your connection and try again.",
  "auth/requires-recent-login": "Please sign in again to continue.",
};

const FALLBACK_MESSAGE = "Something went wrong. Please try again.";

/**
 * Translate anything thrown by the Firebase Auth SDK into a message safe to
 * show a user.
 *
 * Firebase's own `error.message` reads like "Firebase: Error
 * (auth/invalid-credential)." - it leaks internals and helps nobody, so it is
 * never surfaced directly. Unmapped codes are logged in full so the detail
 * survives for debugging even though the user sees something generic.
 */
export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    const message = AUTH_ERROR_MESSAGES[error.code];

    if (message) {
      return message;
    }

    console.error(`Unhandled Firebase auth error: ${error.code}`, error);
    return FALLBACK_MESSAGE;
  }

  console.error("Unexpected error during authentication", error);
  return FALLBACK_MESSAGE;
}
