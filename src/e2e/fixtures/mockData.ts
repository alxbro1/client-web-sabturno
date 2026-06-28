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

export const mockScheduleTemplate = {
  id: "template-1",
  name: "Horario regular",
  isActive: true,
  localId: "1",
  timeStockTemplates: [
    { id: "ts-1", dayOfWeek: 1, startTime: "09:00", endTime: "18:00", isActive: true, localId: "1", scheduleTemplateId: "template-1", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "ts-2", dayOfWeek: 2, startTime: "09:00", endTime: "18:00", isActive: true, localId: "1", scheduleTemplateId: "template-1", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "ts-3", dayOfWeek: 3, startTime: "09:00", endTime: "18:00", isActive: true, localId: "1", scheduleTemplateId: "template-1", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "ts-4", dayOfWeek: 4, startTime: "09:00", endTime: "18:00", isActive: true, localId: "1", scheduleTemplateId: "template-1", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "ts-5", dayOfWeek: 5, startTime: "09:00", endTime: "18:00", isActive: true, localId: "1", scheduleTemplateId: "template-1", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "ts-6", dayOfWeek: 6, startTime: "09:00", endTime: "14:00", isActive: true, localId: "1", scheduleTemplateId: "template-1", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const mockScheduleTemplates = [mockScheduleTemplate];

export const mockLocalImages = [
  { id: 1, url: "https://via.placeholder.com/300", image: "https://via.placeholder.com/300", description: "Foto 1", localId: "1", uploadedAt: new Date().toISOString() },
  { id: 2, url: "https://via.placeholder.com/300", image: "https://via.placeholder.com/300", description: "Foto 2", localId: "1", uploadedAt: new Date().toISOString() },
];

export const mockPremiumPlans = [
  {
    id: "plan-basic",
    tier: "basic",
    name: "Básico",
    description: "Para empezar",
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: { mercadopago: true, talo: true, cashTurnsLimit: 0, loyalty: false, prioritySupport: false, advancedStats: false, unlimitedEmployees: false },
  },
  {
    id: "plan-pro",
    tier: "pro",
    name: "Pro",
    description: "Para negocios en crecimiento",
    monthlyPrice: 8000,
    yearlyPrice: 80000,
    isPopular: true,
    features: { mercadopago: true, talo: true, cashTurnsLimit: 500, loyalty: false, prioritySupport: true, advancedStats: true, unlimitedEmployees: false },
  },
  {
    id: "plan-enterprise",
    tier: "enterprise",
    name: "Enterprise",
    description: "Para cadenas",
    monthlyPrice: 15000,
    yearlyPrice: 150000,
    features: { mercadopago: true, talo: true, cashTurnsLimit: null, loyalty: true, prioritySupport: true, advancedStats: true, unlimitedEmployees: true },
  },
];

export const mockPremiumStatus = {
  currentPlanId: "plan-basic",
  tier: "basic",
  planName: "Básico",
  interval: "monthly",
  status: "trial",
  autoRenew: true,
  nextBillingDate: null,
  trialEndDate: new Date(Date.now() + 30 * 86400000).toISOString(),
  cashTurnsUsed: 0,
  checkoutUrl: null,
};

export const mockLocalProfile = {
  id: 1,
  name: "Test Local",
  email: "local@test.com",
  phone: "+541112345678",
  province: "Buenos Aires",
  city: "CABA",
  address: "Av. Corrientes 1234",
};
