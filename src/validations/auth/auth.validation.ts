import { isValidEmail, hasMinLength } from "../common/rules";

export interface LoginFormValues {
  email: string;
  password?: string;
}

export const validateLoginForm = (values: LoginFormValues) => {
  const errors: Record<string, string> = {};
  if (!values.email) {
    errors.email = "Email is required";
  } else if (!isValidEmail(values.email)) {
    errors.email = "Invalid email address";
  }
  if (values.password !== undefined && !hasMinLength(values.password, 6)) {
    errors.password = "Password must be at least 6 characters";
  }
  return errors;
};
