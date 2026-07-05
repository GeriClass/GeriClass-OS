import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api, type Mentorado } from "../lib/api";
import { Botao, Card, inputCls, SubgrupoBadge, TituloPagina, Vazio, WhatsAppLink } from "../components/ui";

interface ItemSumido {
  mentorado: Mentorado;
  diasSemContato: number | null;
  responsavel: string | null;
}

export function Sumidos() {
  const queryClient = useQueryClient();
  const [registrando, setRegistrando] = useState<string | null>(null);
  const [texto, setTexto] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["sumidos"],
    queryFn: () => api.get<{ sumidos: ItemSumido[] }>("/healthscores/sumidos"),
  });

  const contato = useMutation({
    mutationFn: ({ id, texto }: { id: string; texto: string }) =>
      api.post(`/mentorados/${id}/anotacoes`, { tipo: "contato", texto }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sumidos"] });
      queryClient.invalidateQueries({ queryKey: ["painel-cs"] });
      setRegistrando(null);
      setTexto("");
    },
  });

  if (isLoading) return <p className="text-slate-400">Calculando…</p>;
  const sumidos = data?.sumidos ?? [];

  return (
    <div>
      <TituloPagina>
        👻 Sumidos <span className="text-sm font-normal text-slate-400">({sumidos.length})</span>
      </TituloPagina>
      <p className="mb-4 text-sm text-slate-500">
        Mentorados ativos sem qualquer contato registrado (presença, sessão, tarefa concluída ou contato manual) há
        mais de <strong>21 dias</strong>. Registrar um contato aqui tira o mentorado da lista na hora.
      </p>
      <Card>
        {sumidos.length === 0 ? (
          <Vazio>Ninguém sumido. 🎉</Vazio>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-400">
                <th className="py-2">Mentorado</th>
                <th>Subgrupo</th>
                <th>Dias sem contato</th>
                <th>WhatsApp</th>
                <th>Responsável</th>
                <th></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sumidos.map(({ mentorado: m, diasSemContato, responsavel }) => (
                <tr key={m.id} className="align-top hover:bg-slate-50">
                  <td className="py-2">
                    <Link to={`/mentorados/${m.id}`} className="font-medium text-gc-700 hover:underline">
                      {m.nome}
                    </Link>
                  </td>
                  <td className="py-2"><SubgrupoBadge subgrupo={m.subgrupo} /></td>
                  <td className="py-2 font-semibold text-red-600">
                    {diasSemContato === null ? "nunca registrado" : `${diasSemContato}d`}
                  </td>
                  <td className="py-2"><WhatsAppLink numero={m.whatsapp} /></td>
                  <td className="py-2">{responsavel ?? <span className="text-amber-600">definir!</span>}</td>
                  <td className="py-2 text-right">
                    {registrando === m.id ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          contato.mutate({ id: m.id, texto: texto.trim() || "Contato de reconexão registrado" });
                        }}
                        className="flex justify-end gap-1.5"
                      >
                        <input
                          autoFocus
                          placeholder="O que rolou no contato?"
                          value={texto}
                          onChange={(e) => setTexto(e.target.value)}
                          className={inputCls + " max-w-56"}
                        />
                        <Botao type="submit" disabled={contato.isPending}>✓</Botao>
                      </form>
                    ) : (
                      <Botao variante="secundario" onClick={() => { setRegistrando(m.id); setTexto(""); }}>
                        Registrar contato
                      </Botao>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
