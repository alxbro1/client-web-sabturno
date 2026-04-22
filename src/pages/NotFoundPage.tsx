import { Link } from "react-router-dom";
import { Button } from "@/components/Button";

export function NotFoundPage() {
  return (
    <div className="min-h-screen grid place-items-center p-8">
      <section className="surface grid gap-4">
        <p className="eyebrow">404</p>
        <h2>La pagina no existe</h2>
        <p>Puede que el enlace haya cambiado o que la ruta sea solo valida dentro de la app movil.</p>
        <Link to="/home">
          <Button>Volver al inicio</Button>
        </Link>
      </section>
    </div>
  );
}