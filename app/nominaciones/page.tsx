import Link from "next/link";
import NominationForm from "@/components/NominationForm";
import { ChevronLeft } from "lucide-react";
import { getTournamentStats } from "../actions";

export default async function NominacionesPage() {
  const stats = await getTournamentStats();

  if (!stats.nominationsOpen) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <div className="max-w-sm w-full text-center space-y-4">
          <h1 className="font-display text-4xl text-ink">CLASIFICACIÓN CERRADA</h1>
          <p className="text-muted text-sm">Ya no se aceptan nuevos clasificados. El mundial está en marcha.</p>
          <Link href="/fixture" className="inline-block bg-rust text-white font-display text-xl px-6 py-3 rounded-2xl tracking-wide">VER FIXTURE</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col">
      <div className="bg-ink px-4 py-4 border-b border-ink/20">
        <div className="max-w-lg mx-auto">
          <Link href="/" className="flex items-center gap-1 text-cream/50 text-sm hover:text-cream transition-colors mb-4">
            <ChevronLeft size={16} />Inicio
          </Link>
          <h1 className="font-display text-4xl text-cream leading-none">
            CLASIFICÁ TUS<br />
            <span className="text-crimson">CLAVOS</span>
          </h1>
          <p className="text-cream/50 text-xs mt-2">Los {stats.maxQualifiers} más votados clasifican al Mundial.</p>
        </div>
      </div>

      <div className="flex-1 px-4 py-6">
        <div className="max-w-lg mx-auto">
          <NominationForm />
        </div>
      </div>

      <footer className="px-4 py-4 text-center border-t border-border">
        <p className="text-xs text-muted">Un voto por persona · No se puede clasificar dos veces</p>
      </footer>
    </main>
  );
}
