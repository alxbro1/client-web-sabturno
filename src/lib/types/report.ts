export enum ReportReason {
  INAPPROPRIATE_CONTENT = "INAPPROPRIATE_CONTENT",
  FRAUD = "FRAUD",
  FAKE_BUSINESS = "FAKE_BUSINESS",
  HARASSMENT = "HARASSMENT",
  ILLEGAL_ACTIVITY = "ILLEGAL_ACTIVITY",
  SPAM = "SPAM",
  MISLEADING_INFO = "MISLEADING_INFO",
  POOR_SERVICE = "POOR_SERVICE",
  OTHER = "OTHER",
}

export enum ReportStatus {
  PENDING = "PENDING",
  REVIEWED = "REVIEWED",
  RESOLVED = "RESOLVED",
  DISMISSED = "DISMISSED",
}

export interface Report {
  id: number;
  localId: string;
  userId: string;
  reason: ReportReason;
  description: string;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
  local?: {
    id: string;
    name: string;
    city?: string;
    province?: string;
    imageProfile?: string;
  };
}

export interface CreateReportRequest {
  localId: string;
  reason: ReportReason;
  description: string;
}

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  [ReportReason.INAPPROPRIATE_CONTENT]: "Contenido inapropiado",
  [ReportReason.FRAUD]: "Fraude",
  [ReportReason.FAKE_BUSINESS]: "Negocio falso",
  [ReportReason.HARASSMENT]: "Acoso",
  [ReportReason.ILLEGAL_ACTIVITY]: "Actividad ilegal",
  [ReportReason.SPAM]: "Spam",
  [ReportReason.MISLEADING_INFO]: "Informacion engañosa",
  [ReportReason.POOR_SERVICE]: "Mal servicio",
  [ReportReason.OTHER]: "Otro",
};

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  [ReportStatus.PENDING]: "Pendiente",
  [ReportStatus.REVIEWED]: "Revisado",
  [ReportStatus.RESOLVED]: "Resuelto",
  [ReportStatus.DISMISSED]: "Desestimado",
};
