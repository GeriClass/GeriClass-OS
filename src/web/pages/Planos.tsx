import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api, type TarefaPlano } from "../lib/api";
import { Card, SubgrupoBadge, TituloPagina, Vazio } from "../components/ui";
import type { Subgrupo } from "@shared/constantes";

interface Item {
  tarefa: TarefaPlano;
  mentoradoNome: string;
  subgrupo: Subgrupo;
}

export function Planos() {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["tarefas-plano"],
    queryFn: () => api.get<{ tarefas: Item[] }>("/tarefas-plano"),
  });

  const alternar = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.patch(`/tarefas-plano/${id}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tarefas-plano"] }),
  });

  const hoje = new Date().toISOString().slice(0, 10);
  const itens = data?.tarefas ?? [];
  const abertas = itens.filter((t) => t.tarefa.status !== "concluida");
  const atrasadas = abertas.filter((t) => t.tarefa.dataLimite && t.tarefa.dataLimite < hoje);
  const noPrazo = abertas.filter((t) => !t.tarefa.dataLimite || t.tarefa.dataLimite >= hoje);
  const concluidas = itens.filter((t) => t.tarefa.status === "concluida");

  const Grupo = ({ titulo, lista, cls }: { titulo: string; lista: Item[]; cls?: string }) => (
    <>
      <h2 className={`mb-2 mt-6 font-semibold first:mt-0 ${cls ?? "text-slate-600"}`}>
        {titulo} ({lista.length})
      </h2>
      <Card>
        {lista.length === 0 ? (
          <Vazio>Nada aqui.</Vazio>
        ) : (
          <ul className="divide-y divide-slate-100 text-sm">
            {lista.map(({ tarefa: t, mentoradoNome, subgrupo }) => (
              <li key={t.id} className="flex items-start gap-3 py-2">
                <input
                  type="checkbox"
                  checked={t.status === "concluida"}
                  onChange={() => alternar.mutate({ id: t.id, status: t.status === "concluida" ? "pendente" : "concluida" })}
                  className="mt-1 accent-gc-600"
                />
                <div className="flex-1">
                  <span className={t.status === "concluida" ? "text-slate-400 line-through" : ""}>{t.descricao}</span>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
                    <Link to={`/mentorados/${t.mentoradoId}`} className="font-medium text-gc-600 hover:underline">
                      {mentoradoNome}
                    </Link>
                    <SubgrupoBadge subgrupo={subgrupo} />
                    {t.dataLimite && (
                      <span className={t.dataLimite < hoje && t.status !== "concluida" ? "text-red-500" : ""}>
                        {t.prazoTipo}d · até {t.dataLimite}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );

  return (
    <div>
      <TituloPagina>Planos 30/60 dias</TituloPagina>
      <Grupo titulo="🔴 Atrasadas" lista={atrasadas} cls="text-red-700" />
      <Grupo titulo="🟢 No prazo" lista={noPrazo} />
      <Grupo titulo="Concluídas" lista={concluidas.slice(0, 20)} />
    </div>
  );
}
