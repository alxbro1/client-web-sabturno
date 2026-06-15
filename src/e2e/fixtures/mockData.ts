export const mockUser = {
  id: 1,
  name: "Test User",
  email: "test@example.com",
  isLocal: true,
  image: null,
  phone: null,
};

export const mockToken = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.mock-token";

export const mockLocal = {
  id: 1,
  name: "Test Local",
  slug: "test-local",
};

export const mockEmployees = [
  { id: 1, name: "Ana Gómez", email: "ana@example.com", color: "#FF5678", phone: null },
  { id: 2, name: "Carlos Pérez", email: "carlos@example.com", color: "#00F068", phone: null },
];

export const mockEmployeeCreated = {
  id: 3,
  name: "Nuevo Empleado",
  email: "nuevo@example.com",
  color: "#8B5CF6",
  phone: null,
};

export const mockServices = [
  { id: 1, name: "Corte de cabello", description: "Corte clásico", cost: 5000, duration: 30, category: "PELUQUERIA" },
  { id: 2, name: "Manicuría", description: "Manicuría completa", cost: 3500, duration: 45, category: "MANICURIA" },
];

export const mockServiceCreated = {
  id: 3,
  name: "Nuevo Servicio",
  description: "Descripción del servicio",
  cost: 4000,
  duration: 60,
  category: "ESTETICA",
};

export const mockReports = [
  { id: 1, reason: "NO_ATTENDED", description: "No asistió", local: { id: 1, name: "Test Local" }, status: "PENDING", createdAt: new Date().toISOString() },
  { id: 2, reason: "BAD_SERVICE", description: "Mal servicio", local: { id: 1, name: "Test Local" }, status: "RESOLVED", createdAt: new Date().toISOString() },
];
