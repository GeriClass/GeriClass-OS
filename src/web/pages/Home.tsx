import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api, type Mentorado, type SituacaoBussola, type TarefaPlano } from "../lib/api";
import { Card, TituloPagina, Vazio } from "../components/ui";

interface RespostaBussolas {
  bussolas: { mentorado: Mentorado; situacao: SituacaoBussola }[];
}
interface RespostaTarefas {
  tarefas: { tarefa: TarefaPlano; mentoradoNome: string }[];
}

export function Home() {
  const bussolas = useQuery({
    queryKey: ["bussolas"],
    queryFn: () => api.get<RespostaBussolas>("/mentorados/bussolas"),
  });
  const tarefas = useQuery({
    queryKey: ["tarefas-plano"],
    queryFn: () => api.get<RespostaTarefas>("/tarefas-plano"),
  });

  const hoje = new Date().toISOString().slice(0, 10);
  const bussolasCriticas =
    bussolas.data?.bussolas.filter((b) => ["vencida", "vencendo", "sem_data_entrada"].includes(b.situacao.situacao)) ??
    [];
  const tarefasAtrasadas =
    tarefas.data?.tarefas.filter(
      (t) => t.tarefa.status !== "concluida" && t.tarefa.dataLimite && t.tarefa.dataLimite < hoje,
    ) ?? [];

  return (
    <div>
      <TituloPagina>Início</TituloPagina>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="mb-2 font-semibold text-red-700">
            🧭 Bússolas exigindo atenção{" "}
            <span className="text-sm font-normal text-slate-400">({bussolasCriticas.length})</span>
          </h2>
          {bussolasCriticas.length === 0 ? (
            <Vazio>Nenhuma Bússola vencendo. ✨</Vazio>
          ) : (
            <ul className="divide-y divide-slate-100 text-sm">
              {bussolasCriticas.slice(0, 8).map((b) => (
                <li key={b.mentorado.id} className="flex items-center justify-between py-2">
                  <Link to={`/mentorados/${b.mentorado.id}`} className="font-medium text-gc-700 hover:underline">
                    {b.mentorado.nome}
                  </Link>
                  <span className={b.situacao.situacao === "vencida" ? "text-red-600" : "text-amber-600"}>
                    {b.situacao.situacao === "sem_data_entrada"
                      ? "sem data de entrada"
                      : b.situacao.diasRestantes! < 0
                        ? `${-b.situacao.diasRestantes!}d vencida`
                        : `${b.situacao.diasRestantes}d restantes`}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link to="/bussolas" className="mt-2 inline-block text-sm text-gc-600 hover:underline">
            Ver tracker completo →
          </Link>
        </Card>
        <Card>
          <h2 className="mb-2 font-semibold text-amber-700">
            ✅ Tarefas de plano atrasadas{" "}
            <span className="text-sm font-normal text-slate-400">({tarefasAtrasadas.length})</span>
          </h2>
          {tarefasAtrasadas.length === 0 ? (
            <Vazio>Nada atrasado. 🎉</Vazio>
          ) : (
            <ul className="divide-y divide-slate-100 text-sm">
              {tarefasAtrasadas.slice(0, 8).map((t) => (
                <li key={t.tarefa.id} className="py-2">
                  <span className="font-medium">{t.mentoradoNome}</span>
                  <span className="text-slate-500"> — {t.tarefa.descricao}</span>
                  <span className="ml-1 text-xs text-red-500">(até {t.tarefa.dataLimite})</span>
                </li>
              ))}
            </ul>
          )}
          <Link to="/planos" className="mt-2 inline-block text-sm text-gc-600 hover:underline">
            Ver todos os planos →
          </Link>
        </Card>
      </div>
    </div>
  );
}
