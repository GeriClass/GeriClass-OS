import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type Usuario } from "../lib/api";
import { Botao, Campo, Card, inputCls, TituloPagina, Vazio } from "../components/ui";
import { PAPEIS } from "@shared/constantes";

export function Equipe() {
  const queryClient = useQueryClient();
  const [criando, setCriando] = useState(false);

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: () => api.get<{ usuario: { papel: string } | null }>("/auth/me"),
  });
  const { data } = useQuery({
    queryKey: ["usuarios"],
    queryFn: () => api.get<{ usuarios: Usuario[] }>("/usuarios"),
  });

  const criar = useMutation({
    mutationFn: (dados: Record<string, unknown>) => api.post("/usuarios", dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      setCriando(false);
    },
  });
  const alternarAtivo = useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) => api.patch(`/usuarios/${id}`, { ativo }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["usuarios"] }),
  });

  const souAdmin = me?.usuario?.papel === "admin";

  return (
    <div>
      <TituloPagina
        acao={souAdmin ? <Botao onClick={() => setCriando(!criando)}>{criando ? "Cancelar" : "+ Convidar"}</Botao> : undefined}
      >
        Equipe
      </TituloPagina>

      {criando && (
        <Card className="mb-4">
          <FormUsuario enviando={criar.isPending} onSubmit={(dados) => criar.mutate(dados)} />
          {criar.isError && <p className="mt-2 text-sm text-red-600">{String(criar.error)}</p>}
        </Card>
      )}

      <Card>
        {!data?.usuarios.length ? (
          <Vazio>Nenhum usuário.</Vazio>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-400">
                <th className="py-2">Nome</th><th>Email</th><th>Papel</th><th>Cargo</th><th>Status</th>
                {souAdmin && <th></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.usuarios.map((u) => (
                <tr key={u.id}>
                  <td className="py-2 font-medium">{u.nome}</td>
                  <td className="text-slate-500">{u.email}</td>
                  <td className="uppercase text-slate-500">{u.papel}</td>
                  <td className="text-slate-500">{u.cargo ?? "—"}</td>
                  <td>{u.ativo ? <span className="text-emerald-600">ativo</span> : <span className="text-slate-400">inativo</span>}</td>
                  {souAdmin && (
                    <td className="text-right">
                      <button
                        onClick={() => alternarAtivo.mutate({ id: u.id, ativo: !u.ativo })}
                        className="text-xs text-gc-600 hover:underline"
                      >
                        {u.ativo ? "desativar" : "reativar"}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

function FormUsuario({ enviando, onSubmit }: { enviando: boolean; onSubmit: (dados: Record<string, unknown>) => void }) {
  const [form, setForm] = useState({ nome: "", email: "", senha: "", papel: "equipe", cargo: "" });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ ...form, cargo: form.cargo || undefined });
      }}
      className="grid gap-3 md:grid-cols-5"
    >
      <Campo rotulo="Nome *"><input required value={form.nome} onChange={set("nome")} className={inputCls} /></Campo>
      <Campo rotulo="Email *"><input required type="email" value={form.email} onChange={set("email")} className={inputCls} /></Campo>
      <Campo rotulo="Senha temporária *">
        <input required minLength={8} value={form.senha} onChange={set("senha")} className={inputCls} />
      </Campo>
      <Campo rotulo="Papel">
        <select value={form.papel} onChange={set("papel")} className={inputCls}>
          {PAPEIS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </Campo>
      <Campo rotulo="Cargo"><input value={form.cargo} onChange={set("cargo")} className={inputCls} /></Campo>
      <div className="md:col-span-5">
        <Botao type="submit" disabled={enviando}>{enviando ? "Criando…" : "Criar usuário"}</Botao>
      </div>
    </form>
  );
}
