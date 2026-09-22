/**
 * The one error type every API call throws.
 *
 * The backend sends every failure as
 *   {"error": {"code": "user_not_found", "message": "...", "details": {}}}
 * and `request()` in services/api.ts turns that into an ApiError.
 *
 * Branch on `code`, never on `message`: the wording may change, the code won't.
 *   if (err instanceof ApiError && err.code === "already_room_member") { ... }
 */
export class ApiError extends Error {
  /** HTTP status. 0 means the request never reached the server. */
  readonly status: number;
  /** Matches the backend's error code, e.g. "already_room_member". */
  readonly code: string;
  readonly details: Record<string, unknown>;

  constructor(
    status: number,
    code: string,
    message: string,
    details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
