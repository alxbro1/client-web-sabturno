import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { getAppointmentPublic, bookingService } from "@/services/booking";
import { AppointmentCard } from "@/components/AppointmentCard";
import { Button } from "@/components/Button";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export function AppointmentCancelPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const hash = searchParams.get("hash") || "";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appointment, setAppointment] = useState<any>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !hash) {
      setError("Faltan datos para acceder al turno.");
      setLoading(false);
      return;
    }
    getAppointmentPublic(id, hash)
      .then((data) => {
        setAppointment(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(
          err?.response?.data?.message || err?.message || "No se pudo cargar el turno."
        );
        setLoading(false);
      });
  }, [id, hash]);

  const handleCancelConfirm = async () => {
    if (!id || !hash) {
      setError("Faltan datos para cancelar el turno.");
      return;
    }

    try {
      setIsCancelling(true);
      await bookingService.cancelAppointmentPublic(id, hash);
      setSuccessMessage("Tu turno ha sido cancelado exitosamente.");
      setShowConfirmDialog(false);
      
      // Redirect after 2 seconds
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (err) {
      setError(
        "No se pudo cancelar el turno. Intenta nuevamente."
      );
      setIsCancelling(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Cargando turno...</div>;
  if (error) return <div className="p-8 text-center text-[#ff5678]">{error}</div>;
  if (!appointment) return null;

  if (successMessage) {
    return (
      <div className="max-w-lg mx-auto p-4 min-h-screen flex flex-col justify-center items-center text-center">
        <h2 className="text-2xl font-bold mb-4 text-[#00f068]">¡Turno cancelado!</h2>
        <p className="text-white/60 mb-8">{successMessage}</p>
        <p className="text-sm text-white/40">Redirigiendo...</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-4 min-h-screen flex flex-col justify-center items-center">
      <h2 className="text-2xl font-bold mb-4">Cancelar turno</h2>
      <p className="text-white/60 mb-6 text-center">
        ¿Estás seguro de que deseas cancelar tu turno? Esta acción no se puede deshacer.
      </p>
      
      <div className="mb-6 w-full">
        <AppointmentCard appointment={appointment} />
      </div>

      <div className="w-full space-y-3">
        <Button
          variant="danger"
          fullWidth
          onClick={() => setShowConfirmDialog(true)}
          disabled={isCancelling}
        >
          Cancelar turno
        </Button>
        <Button
          variant="secondary"
          fullWidth
          onClick={() => navigate(-1)}
          disabled={isCancelling}
        >
          Volver
        </Button>
      </div>

      <ConfirmDialog
        isOpen={showConfirmDialog}
        title="Confirmar cancelación"
        description="¿Estás seguro de que deseas cancelar tu turno? Se enviarán notificaciones al local."
        confirmLabel="Cancelar turno"
        cancelLabel="No, volver"
        isDangerous={true}
        isLoading={isCancelling}
        onConfirm={handleCancelConfirm}
        onCancel={() => setShowConfirmDialog(false)}
      />
    </div>
  );
}
