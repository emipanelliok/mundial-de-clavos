"use client";

import { useState } from "react";
import { X, HelpCircle, Users, Trophy, Swords, Crown } from "lucide-react";

const STEPS = [
  {
    icon: Users,
    phase: "FASE 1",
    title: "Clasificaciones",
    color: "bg-rust text-white",
    desc: "Cada persona nomina hasta 5 autos que considera los más clavos de la historia. Los X autos más nominados clasifican al Mundial.",
    rules: ["Un voto por persona", "Hasta 5 autos por voto", "Solo necesitás tu @twitter", "El ranking es secreto hasta el cierre"],
  },
  {
    icon: Swords,
    phase: "FASE 2",
    title: "Fase de Grupos",
    color: "bg-crimson text-white",
    desc: "Los clasificados se dividen en grupos. Dentro de cada grupo votás qué autos merecen pasar a la siguiente ronda.",
    rules: ["8 grupos de 4 autos", "Los 2 mejores de cada grupo avanzan", "Un voto por partido"],
  },
  {
    icon: Trophy,
    phase: "FASE 3",
    title: "Eliminatorias",
    color: "bg-crimson text-white",
    desc: "Octavos, Cuartos, Semifinal y Final. Mano a mano. El auto más votado de cada duelo avanza.",
    rules: ["Octavos → Cuartos → Semis → Final", "El más votado gana el duelo", "Sin empates"],
  },
  {
    icon: Crown,
    phase: "FINAL",
    title: "El Gran Campeón",
    color: "bg-gold text-ink",
    desc: "El auto que llegue a la final y sea más votado se corona como el Gran Clavo del Mundial 2026.",
    rules: ["El peor auto de la historia", "Coronado por voto popular"],
  },
];

export default function HowItWorks() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-border text-muted text-sm hover:border-rust/30 hover:text-ink transition-colors"
      >
        <HelpCircle size={16} />
        ¿Cómo funciona el Mundial?
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Sheet */}
          <div className="relative w-full sm:max-w-lg bg-paper rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 bg-paper border-b border-border px-5 py-4 flex items-center justify-between">
              <h2 className="font-display text-2xl text-ink tracking-wide">¿CÓMO FUNCIONA?</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-muted hover:text-ink p-1 rounded-lg hover:bg-surface transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="px-5 py-6 space-y-4">
              <p className="text-muted text-sm leading-relaxed">
                El Mundial de Clavos es un torneo por votación popular para elegir el auto más clavo de la historia argentina. Funciona igual que un Mundial de fútbol, pero en vez de goles gana el que más clavos es.
              </p>

              <div className="space-y-3">
                {STEPS.map(({ icon: Icon, phase, title, color, desc, rules }) => (
                  <div key={phase} className="bg-white rounded-2xl border border-border overflow-hidden">
                    <div className={`${color} px-4 py-2.5 flex items-center gap-3`}>
                      <Icon size={16} />
                      <span className="text-xs font-semibold uppercase tracking-widest opacity-80">{phase}</span>
                      <span className="font-display text-xl leading-none">{title}</span>
                    </div>
                    <div className="px-4 py-3 space-y-2">
                      <p className="text-sm text-ink">{desc}</p>
                      <ul className="space-y-1">
                        {rules.map((r) => (
                          <li key={r} className="flex items-center gap-2 text-xs text-muted">
                            <span className="w-1.5 h-1.5 rounded-full bg-border shrink-0" />
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-surface rounded-2xl px-4 py-3 text-center border border-border">
                <p className="text-xs text-muted">
                  Una iniciativa de{" "}
                  <a href="https://x.com/emipanelli" target="_blank" rel="noopener noreferrer" className="text-rust font-medium">
                    @emipanelli
                  </a>
                  {" "}· Argentina 2026
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
