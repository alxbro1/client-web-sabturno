"use client";

import Link from "next/link";
import { useMyReportsQuery } from "@/hooks/queries/useReportsQuery";
import {
  REPORT_REASON_LABELS,
  REPORT_STATUS_LABELS,
  ReportStatus,
} from "@/lib/types/report";

function getStatusColor(status: ReportStatus): string {
  switch (status) {
    case ReportStatus.PENDING:
      return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
    case ReportStatus.REVIEWED:
      return "bg-blue-500/20 text-blue-300 border-blue-500/30";
    case ReportStatus.RESOLVED:
      return "bg-green-500/20 text-green-300 border-green-500/30";
    case ReportStatus.DISMISSED:
      return "bg-white/10 text-white/50 border-white/20";
    default:
      return "bg-white/10 text-white/50 border-white/20";
  }
}

export default function ReportsPage() {
  const { reports, isLoading, error } = useMyReportsQuery();

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-[1.5rem] font-bold">Mis reportes</h1>
        <p className="text-white/54 text-[0.9rem]">
          Historial de reportes enviados
        </p>
      </div>

      {isLoading ? (
        <div className="min-h-[140px] grid place-items-center text-center text-[#dfe8f4]/70">
          Cargando reportes...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-[#ff5678]/40 bg-[rgba(83,15,34,0.42)] px-4 py-[0.95rem] text-[#ffd6df]">
          {error}
        </div>
      ) : reports.length === 0 ? (
        <div className="min-h-[200px] grid place-items-center text-center">
          <div className="grid gap-4">
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-12 h-12 mx-auto text-white/24"
            >
              <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
            </svg>
            <p className="text-white/48">No has enviado reportes</p>
            <Link
              href="/home"
              className="text-[#7bcfff] underline decoration-[#7bcfff]/45 underline-offset-[0.2rem]"
            >
              Explorar locales
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-3">
          {reports.map((report) => (
            <article
              key={report.id}
              className="p-4 rounded-[18px] border border-white/10 bg-white/[0.02]"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  {report.local && (
                    <p className="font-medium mb-1">{report.local.name}</p>
                  )}
                  <p className="text-[0.82rem] text-white/54">
                    {REPORT_REASON_LABELS[report.reason]}
                  </p>
                </div>
                <span
                  className={`text-[0.72rem] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${getStatusColor(report.status)}`}
                >
                  {REPORT_STATUS_LABELS[report.status]}
                </span>
              </div>
              <p className="text-[0.9rem] text-white/72">{report.description}</p>
              <p className="text-[0.75rem] text-white/36 mt-2">
                {new Date(report.createdAt).toLocaleDateString("es-AR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
