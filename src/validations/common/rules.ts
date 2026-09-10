export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

export const isValidPhone = (phone: string): boolean => {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
};

export const isNotEmpty = (value: string | null | undefined): boolean => {
  return value != null && value.trim().length > 0;
};

export const hasMinLength = (value: string, min: number): boolean => {
  return value.trim().length >= min;
};
