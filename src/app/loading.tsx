import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen grid place-items-center p-8">
      <div className="grid gap-4 text-center">
        <Skeleton className="mx-auto h-8 w-8 rounded-full" />
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    </div>
  );
}
