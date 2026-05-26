import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Props {
  paymentId: string;
  amount: number;
  currency: string;
  cbu?: string;
  alias?: string;
  aliasCbu?: string;
  expirationTimestamp?: string;
}

export default function TaloPaymentInfo({
  paymentId,
  amount,
  currency,
  cbu,
  alias,
  aliasCbu,
  expirationTimestamp,
}: Props) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert("Copiado al portapapeles");
    });
  };

  return (
    <div className="space-y-4">
      <div className="bg-[#00f068]/10 border border-[#00f068]/30 rounded-lg p-4 text-center">
        <p className="text-sm text-white/60">Monto a transferir</p>
        <p className="text-3xl font-bold text-[#00f068]">
          {amount} {currency}
        </p>
      </div>

      {cbu && (
        <div className="bg-card rounded-lg p-4">
          <p className="text-sm text-white/60 mb-1">CVU</p>
          <div className="flex items-center justify-between">
            <p className="font-mono text-lg break-all">{cbu}</p>
            <button
              onClick={() => copyToClipboard(cbu)}
              className="ml-2 px-3 py-1 bg-secondary text-white rounded text-sm shrink-0"
            >
              Copiar
            </button>
          </div>
        </div>
      )}

      {(alias || aliasCbu) && (
        <div className="bg-card rounded-lg p-4">
          <p className="text-sm text-white/60 mb-1">Alias</p>
          <div className="flex items-center justify-between">
            <p className="font-mono text-lg">{alias || aliasCbu}</p>
            <button
              onClick={() => copyToClipboard(alias || aliasCbu!)}
              className="ml-2 px-3 py-1 bg-secondary text-white rounded text-sm shrink-0"
            >
              Copiar
            </button>
          </div>
        </div>
      )}

      {expirationTimestamp && (
        <div className="text-center">
          <p className="text-sm text-white/60">
            Este CVU vence el:{" "}
            <span className="font-semibold">
              {format(new Date(expirationTimestamp), "dd/MM/yyyy HH:mm", { locale: es })}
            </span>
          </p>
        </div>
      )}

      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-sm">
        <p className="font-semibold text-yellow-500 mb-1">Instrucciones</p>
        <ol className="text-white/80 space-y-1 list-decimal list-inside">
          <li>Copiate el CVU o alias de arriba</li>
          <li>Abrí la app de tu banco (o su home banking)</li>
          <li>Iniciá una transferencia usando los datos copiados</li>
          <li>El turno se confirmará automáticamente cuando Talo procese el pago (puede tardar unos minutos)</li>
        </ol>
      </div>
    </div>
  );
}