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
          <h1 className="font-display text-4xl text-ink">NOMINACIONES CERRADAS</h1>
          <p className="text-muted text-sm">
            Ya no se aceptan nuevas nominaciones. El mundial está en marcha.
          </p>
          <Link
            href="/fixture"
            className="inline-block bg-rust text-white font-display text-xl px-6 py-3 rounded-2xl tracking-wide"
          >
            VER FIXTURE
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-ink px-4 py-4">
        <div className="max-w-lg mx-auto">
          <Link
            href="/"
            className="flex items-center gap-1 text-white/50 text-sm hover:text-white transition-colors mb-4"
          >
            <ChevronLeft size={16} />
            Inicio
          </Link>
          <h1 className="font-display text-4xl text-white leading-none">
            ELEGÍ TUS
            <br />
            <span className="text-rust">NOMINADOS</span>
          </h1>
          <p className="text-white/50 text-xs mt-2">
            Los {stats.maxQualifiers} más votados clasifican al Mundial.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 px-4 py-6">
        <div className="max-w-lg mx-auto">
          <NominationForm />
        </div>
      </div>

      <footer className="px-4 py-4 text-center">
        <p className="text-xs text-muted">
          Un voto por persona · No se puede votar dos veces
        </p>
      </footer>
    </main>
  );
}
