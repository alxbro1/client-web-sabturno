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
  birthDate: string;
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
  birthDate: string[];
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
    errors.push("La contrasena es requerida");
  } else if (password.length < 6) {
    errors.push("La contrasena debe tener al menos 6 caracteres");
  }

  return errors;
}

export function validateConfirmPassword(password: string, confirmPassword: string) {
  const errors: string[] = [];

  if (!confirmPassword) {
    errors.push("Debes confirmar la contrasena");
  } else if (password !== confirmPassword) {
    errors.push("Las contrasenas no coinciden");
  }

  return errors;
}

export function validateBirthDate(birthDate: string) {
  const errors: string[] = [];

  if (!birthDate.trim()) {
    errors.push("La fecha de nacimiento es requerida");
    return errors;
  }

  const date = new Date(`${birthDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    errors.push("La fecha de nacimiento no es valida");
    return errors;
  }

  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  const dayDiff = today.getDate() - date.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }

  if (age < 13) {
    errors.push("Debes tener al menos 13 anos para registrarte");
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
    birthDate: validateBirthDate(data.birthDate),
    acceptTerms: [],
  };

  if (!data.name.trim()) {
    validation.name.push("El nombre es requerido");
  } else if (data.name.trim().length < 2) {
    validation.name.push("El nombre debe tener al menos 2 caracteres");
  }

  if (!data.phone.trim()) {
    validation.phone.push("El telefono es requerido");
  } else if (!/^\d{8,15}$/.test(data.phone.replace(/\s/g, ""))) {
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
    province: local.province,
    city: local.city,
    address: local.address,
  };
}