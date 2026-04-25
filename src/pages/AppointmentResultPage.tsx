import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/Button";

type ResultStatus = "success" | "error";

export function AppointmentResultPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const status = (searchParams.get("status") || "success") as ResultStatus;
  const message = searchParams.get("message") || "";

  useEffect(() => {
    // Redirect to home if no valid status
    if (!["success", "error"].includes(status)) {
      navigate("/home", { replace: true });
    }
  }, [status, navigate]);

  const isSuccess = status === "success";

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md grid gap-6 text-center">
        {/* Icon */}
        <div className="flex justify-center">
          {isSuccess ? (
            <div className="relative w-24 h-24 flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-[#00f068]/20 to-[#00f068]/5 rounded-full" />
              <div className="absolute inset-0 border-2 border-[#00f068]/30 rounded-full animate-pulse" />
              <div className="relative flex items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#00f068"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-12 h-12"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>
          ) : (
            <div className="relative w-24 h-24 flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-[#ff5678]/20 to-[#ff5678]/5 rounded-full" />
              <div className="absolute inset-0 border-2 border-[#ff5678]/30 rounded-full animate-pulse" />
              <div className="relative flex items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#ff5678"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-12 h-12"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* Title */}
        <div>
          <h1 className={`text-3xl font-bold mb-2 ${isSuccess ? "text-[#00f068]" : "text-[#ff5678]"}`}>
            {isSuccess ? "¡Reserva Exitosa!" : "Reserva No Completada"}
          </h1>
        </div>

        {/* Message */}
        <div>
          <p className="text-white/70 text-sm leading-relaxed">
            {message || (
              isSuccess
                ? "Puedes verlo en tu lista de citas."
                : "No pudimos completar tu reserva. Intenta nuevamente o contacta con soporte."
            )}
          </p>
        </div>

        {/* Button */}
        <Button
          onClick={() => navigate("/home", { replace: true })}
          variant="primary"
          className="mt-4"
        >
          Volver al Inicio
        </Button>
      </div>
    </div>
  );
}
