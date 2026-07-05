import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api, type Mentorado } from "../lib/api";
import { Botao, Card, SubgrupoBadge, TituloPagina, Vazio } from "../components/ui";
import type { CorHealthScore } from "@shared/constantes";

interface ItemPainel {
  mentorado: Mentorado;
  score: number;
  cor: CorHealthScore;
  componentes: { presenca: number; sessoes: number; tarefas: number; indicadores: number; penalidadeContato: number };
  diasSemContato: number | null;
  sumido: boolean;
  semDados: boolean;
}

const GRUPOS: { chave: "vermelho" | "amarelo" | "verde" | "semDados"; titulo: string; desc: string; cls: string }[] = [
  { chave: "vermelho", titulo: "🔴 Atenção URGENTE", desc: "Risco real de abandono — ação prioritária.", cls: "border-red-300 bg-red-50" },
  { chave: "amarelo", titulo: "🟡 Em risco", desc: "Zona morna — checar antes de virar vermelho.", cls: "border-amber-300 bg-amber-50" },
  { chave: "verde", titulo: "🟢 Saudáveis", desc: "Engajados — manter o ritmo.", cls: "border-emerald-300 bg-emerald-50" },
  { chave: "semDados", titulo: "⚪ Sem dados suficientes", desc: "Recém-chegados ou sem histórico para calcular.", cls: "border-slate-200 bg-slate-50" },
];

export function PainelCS() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["painel-cs"],
    queryFn: () => api.get<{ painel: ItemPainel[] }>("/healthscores/painel"),
  });

  const recalcular = useMutation({
    mutationFn: () => api.post("/healthscores/recalcular", {}),
    onSuccess: () => queryClient.invalidateQueries(),
  });

  if (isLoading) return <p className="text-slate-400">Calculando…</p>;
  const painel = data?.painel ?? [];

  const grupos = {
    vermelho: painel.filter((p) => !p.semDados && p.cor === "vermelho"),
    amarelo: painel.filter((p) => !p.semDados && p.cor === "amarelo"),
    verde: painel.filter((p) => !p.semDados && p.cor === "verde"),
    semDados: painel.filter((p) => p.semDados),
  };

  return (
    <div>
      <TituloPagina
        acao={
          <Botao variante="secundario" onClick={() => recalcular.mutate()} disabled={recalcular.isPending}>
            {recalcular.isPending ? "Gravando…" : "Gravar snapshot do mês"}
          </Botao>
        }
      >
        🎯 Painel CS{" "}
        <span className="text-sm font-normal text-slate-400">
          ({grupos.vermelho.length} 🔴 · {grupos.amarelo.length} 🟡 · {grupos.verde.length} 🟢)
        </span>
      </TituloPagina>

      <div className="space-y-6">
        {GRUPOS.map((g) => (
          <div key={g.chave}>
            <h2 className="mb-1 font-semibold">{g.titulo} <span className="text-sm font-normal text-slate-400">({grupos[g.chave].length})</span></h2>
            <p className="mb-2 text-xs text-slate-500">{g.desc}</p>
            {grupos[g.chave].length === 0 ? (
              <Card className={g.cls}><Vazio>Ninguém aqui.</Vazio></Card>
            ) : (
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                {grupos[g.chave].map((p) => (
                  <Card key={p.mentorado.id} className={`${g.cls} border`}>
                    <div className="flex items-center justify-between">
                      <Link to={`/mentorados/${p.mentorado.id}`} className="font-medium text-gc-700 hover:underline">
                        {p.mentorado.nome}
                      </Link>
                      <span className="text-lg font-bold">{p.semDados ? "—" : p.score}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                      <SubgrupoBadge subgrupo={p.mentorado.subgrupo} />
                      {p.diasSemContato !== null && (
                        <span className={p.sumido ? "font-semibold text-red-600" : ""}>
                          {p.diasSemContato}d sem contato{p.sumido ? " · SUMIDO" : ""}
                        </span>
                      )}
                    </div>
                    {!p.semDados && (
                      <div className="mt-2 grid grid-cols-4 gap-1 text-center text-[10px] text-slate-500">
                        <Comp rotulo="Presença" valor={p.componentes.presenca} max={30} />
                        <Comp rotulo="Sessões" valor={p.componentes.sessoes} max={30} />
                        <Comp rotulo="Tarefas" valor={p.componentes.tarefas} max={25} />
                        <Comp rotulo="Indicad." valor={p.componentes.indicadores} max={15} />
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Comp({ rotulo, valor, max }: { rotulo: string; valor: number; max: number }) {
  return (
    <div>
      <div className="mb-0.5 h-1.5 overflow-hidden rounded bg-slate-200">
        <div className="h-full rounded bg-gc-500" style={{ width: `${(valor / max) * 100}%` }} />
      </div>
      {rotulo} {valor}/{max}
    </div>
  );
}
