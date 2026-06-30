/** Maps Cognito error names/codes to friendly messages. */
export function authErrorMessage(error: unknown): string {
  const name =
    typeof error === "object" && error !== null && "name" in error
      ? String((error as { name: unknown }).name)
      : "";

  const message =
    typeof error === "object" && error !== null && "message" in error
      ? String((error as { message: unknown }).message).toLowerCase()
      : "";

  switch (name) {
    case "NotAuthorizedException":
      return "Incorrect email or password.";
    case "UserNotFoundException":
      return "Incorrect email or password.";
    case "UserNotConfirmedException":
      return "This account has not been confirmed yet.";
    case "PasswordResetRequiredException":
      return "A password reset is required for this account.";
    case "TooManyRequestsException":
    case "LimitExceededException":
      return "Too many attempts. Please try again in a moment.";
    case "UsernameExistsException":
      return "An account already exists with that email.";
    case "InvalidPasswordException":
      return "Password must be at least 8 characters with uppercase, lowercase, numbers, and symbols.";
    case "InvalidParameterException":
      if (message.includes("email")) return "That email address doesn't look right.";
      return "Invalid input. Please check your details.";
    case "NetworkError":
      return "Network error. Check your connection and try again.";
    default:
      return "Something went wrong. Please try again.";
  }
}
