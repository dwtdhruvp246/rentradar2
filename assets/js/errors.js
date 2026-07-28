const ERROR_RULES = [
  [/invalid api key/i, "Mushavo is not connected to Supabase correctly. Check the public anon key in the site configuration."],
  [/invalid login credentials|invalid password/i, "Email or password is incorrect."],
  [/email.*already|user already registered|duplicate key.*email/i, "Your account already exists. Please contact Mushavo support if you cannot sign in."],
  [/row-level security|violates row-level security/i, "You do not have permission to complete this action."],
  [/jwt expired|refresh token/i, "Your session has expired. Please sign in again."],
  [/network|failed to fetch/i, "We could not connect. Check your internet connection and try again."],
  [/violates.*check constraint|limit reached/i, "Your current plan does not allow this action. Please review your plan or contact support."],
];

export function friendlyError(error, fallback = "Something went wrong. Please try again.") {
  const raw = [error?.message, error?.details, error?.hint, String(error || "")].filter(Boolean).join(" ");
  return ERROR_RULES.find(([pattern]) => pattern.test(raw))?.[1] || fallback;
}
