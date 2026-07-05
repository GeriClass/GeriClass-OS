import type { ReactNode } from "react";
import { SUBGRUPO_LABEL, type Subgrupo, type CorHealthScore } from "@shared/constantes";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-lg border border-slate-200 bg-white p-4 shadow-sm ${className}`}>{children}</div>;
}

export function TituloPagina({ children, acao }: { children: ReactNode; acao?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h1 className="text-xl font-semibold">{children}</h1>
      {acao}
    </div>
  );
}

export function Botao({
  children,
  variante = "primario",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variante?: "primario" | "secundario" | "perigo" }) {
  const estilos = {
    primario: "bg-gc-600 text-white hover:bg-gc-700",
    secundario: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
    perigo: "bg-red-600 text-white hover:bg-red-700",
  };
  return (
    <button
      {...props}
      className={`rounded px-3 py-1.5 text-sm font-medium transition disabled:opacity-50 ${estilos[variante]} ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
}

export function Campo({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-slate-600">{rotulo}</span>
      {children}
    </label>
  );
}

export const inputCls =
  "w-full rounded border border-slate-300 px-2.5 py-1.5 text-sm focus:border-gc-500 focus:outline-none";

const CORES_SUBGRUPO: Record<Subgrupo, string> = {
  semente: "bg-amber-100 text-amber-800",
  broto: "bg-lime-100 text-lime-800",
  arvore: "bg-emerald-100 text-emerald-800",
  frutos: "bg-purple-100 text-purple-800",
};

export function SubgrupoBadge({ subgrupo }: { subgrupo: Subgrupo }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${CORES_SUBGRUPO[subgrupo]}`}>
      {SUBGRUPO_LABEL[subgrupo]}
    </span>
  );
}

const CORES_HEALTH: Record<CorHealthScore, string> = {
  verde: "bg-emerald-500",
  amarelo: "bg-amber-400",
  vermelho: "bg-red-500",
};

export function HealthBadge({ cor, score }: { cor: CorHealthScore; score?: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <span className={`h-2.5 w-2.5 rounded-full ${CORES_HEALTH[cor]}`} />
      {score !== undefined && <span className="font-medium">{score}</span>}
    </span>
  );
}

export function Vazio({ children }: { children: ReactNode }) {
  return <p className="py-8 text-center text-sm text-slate-400">{children}</p>;
}

/** Converte um telefone brasileiro em link wa.me (ou null se não reconhecível). */
export function linkWhatsApp(numero: string | null): string | null {
  if (!numero) return null;
  const digitos = numero.replace(/\D/g, "");
  if (digitos.length < 10) return null;
  return `https://wa.me/${digitos.startsWith("55") && digitos.length >= 12 ? digitos : "55" + digitos}`;
}

export function WhatsAppLink({ numero }: { numero: string | null }) {
  const link = linkWhatsApp(numero);
  if (!link) return <span className="text-slate-400">—</span>;
  return (
    <a href={link} target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline" title={numero ?? ""}>
      WhatsApp ↗
    </a>
  );
}
