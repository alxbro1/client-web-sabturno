export default function Loading() {
  return (
    <div className="min-h-screen grid place-items-center text-center text-[#dfe8f4]/70">
      <div className="grid gap-4">
        <div className="w-8 h-8 border-2 border-[#00f068] border-t-transparent rounded-full animate-spin mx-auto" />
        <p>Cargando...</p>
      </div>
    </div>
  );
}
