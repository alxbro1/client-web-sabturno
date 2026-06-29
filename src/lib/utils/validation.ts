import type { CountryCode } from "@/lib/constants/countries";

export type LoginValidation = {
  email: string[];
  password: string[];
};

export type RegisterFormData = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  countryCode: CountryCode;
  timezone: string;
  acceptTerms: boolean;
  /** Solo se usa si isBusiness=true. */
  province?: string;
  /** Solo se usa si isBusiness=true. */
  city?: string;
  /** Solo se usa si isBusiness=true. */
  address?: string;
};

export type RegisterValidation = {
  name: string[];
  email: string[];
  password: string[];
  confirmPassword: string[];
  phone: string[];
  acceptTerms: string[];
  province?: string[];
  city?: string[];
  address?: string[];
};

export type LocalRegisterValidation = RegisterValidation & {
  province: string[];
  city: string[];
  address: string[];
};

export function validateEmail(email: string) {
  const errors: string[] = [];

  if (!email.trim()) {
    errors.push("El email es requerido");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push("Formato de email invalido");
  }

  return errors;
}

export function validatePassword(password: string) {
  const errors: string[] = [];

  if (!password) {
    errors.push("La contraseña es requerida");
  } else if (password.length < 6) {
    errors.push("La contraseña debe tener al menos 6 caracteres");
  }

  return errors;
}

/** Validacion fuerte usada para registrar un local (match @IsStrongPassword del backend). */
export function validateStrongPassword(password: string) {
  const errors: string[] = [];

  if (!password) {
    errors.push("La contraseña es requerida");
    return errors;
  }

  if (password.length < 8) {
    errors.push("Debe tener al menos 8 caracteres");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Debe incluir una mayuscula");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Debe incluir una minuscula");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Debe incluir un numero");
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push("Debe incluir un simbolo (ej: !@#$%)");
  }

  return errors;
}

export const STRONG_PASSWORD_HINTS = [
  "Al menos 8 caracteres",
  "Una mayuscula",
  "Una minuscula",
  "Un numero",
  "Un simbolo (ej: !@#$%)",
];

export interface PasswordRequirement {
  met: boolean;
  label: string;
}

export function checkStrongPasswordRequirements(password: string): PasswordRequirement[] {
  return [
    { met: password.length >= 8, label: "Al menos 8 caracteres" },
    { met: /[A-Z]/.test(password), label: "Una mayuscula" },
    { met: /[a-z]/.test(password), label: "Una minuscula" },
    { met: /[0-9]/.test(password), label: "Un numero" },
    { met: /[^A-Za-z0-9]/.test(password), label: "Un simbolo (ej: !@#$%)" },
  ];
}

export function validateConfirmPassword(password: string, confirmPassword: string) {
  const errors: string[] = [];

  if (!confirmPassword) {
    errors.push("Debes confirmar la contraseña");
  } else if (password !== confirmPassword) {
    errors.push("Las contrasenas no coinciden");
  }

  return errors;
}

export function validateLoginForm(email: string, password: string): LoginValidation {
  return {
    email: validateEmail(email),
    password: validatePassword(password),
  };
}

export function validateRegisterForm(data: RegisterFormData): RegisterValidation {
  const validation: RegisterValidation = {
    name: [],
    email: validateEmail(data.email),
    password: validatePassword(data.password),
    confirmPassword: validateConfirmPassword(data.password, data.confirmPassword),
    phone: [],
    acceptTerms: [],
  };

  if (!data.name.trim()) {
    validation.name.push("El nombre es requerido");
  } else if (data.name.trim().length < 2) {
    validation.name.push("El nombre debe tener al menos 2 caracteres");
  }

  if (!data.phone.trim()) {
    validation.phone.push("El telefono es requerido");
  } else if (!/^\d{8,15}$/.test(data.phone.replace(/[\s\-\+\(\)]/g, ""))) {
    validation.phone.push("Formato de telefono invalido");
  }

  if (!data.acceptTerms) {
    validation.acceptTerms.push("Debes aceptar los terminos y condiciones");
  }

  return validation;
}

/**
 * Valida los 3 campos extra requeridos para registrar un local.
 * Se compone encima de `validateRegisterForm` cuando `isBusiness === true`.
 */
export function validateLocalFields(data: RegisterFormData): {
  province: string[];
  city: string[];
  address: string[];
} {
  const province: string[] = [];
  const city: string[] = [];
  const address: string[] = [];

  if (!data.province || !data.province.trim()) {
    province.push("La provincia es requerida");
  }

  if (!data.city || !data.city.trim()) {
    city.push("La ciudad es requerida");
  }

  if (!data.address || !data.address.trim()) {
    address.push("La direccion es requerida");
  } else if (data.address.trim().length < 5) {
    address.push("La direccion debe tener al menos 5 caracteres");
  }

  return { province, city, address };
}

/**
 * Variante que combina las validaciones de cliente + los 3 campos de local.
 * Usar cuando `isBusiness === true`.
 */
export function validateLocalRegisterForm(data: RegisterFormData): LocalRegisterValidation {
  const base = validateRegisterForm(data);
  const local = validateLocalFields(data);
  return {
    ...base,
    // Los locales requieren password fuerte (match @IsStrongPassword del backend)
    password: validateStrongPassword(data.password),
    province: local.province,
    city: local.city,
    address: local.address,
  };
}