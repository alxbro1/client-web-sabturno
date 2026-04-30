import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { getAppointmentPublic } from "@/services/booking";
import { AppointmentCard } from "@/components/AppointmentCard";

export function AppointmentPublicPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const hash = searchParams.get("hash") || "";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appointment, setAppointment] = useState<any>(null);

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

  if (loading) return <div className="p-8 text-center">Cargando turno...</div>;
  if (error) return <div className="p-8 text-center text-[#ff5678]">{error}</div>;
  if (!appointment) return null;

  return (
    <div className="max-w-lg mx-auto p-4 min-h-screen flex flex-col justify-center items-center">
      <h2 className="text-2xl font-bold mb-4">Detalles de tu turno</h2>
      <AppointmentCard appointment={appointment} />
    </div>
  );
}
