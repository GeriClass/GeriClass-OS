import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { guApi, GuApiError, type AssinanteMe } from "./api";
import { Botao, Campo, inputCls } from "../components/ui";

export function PerfilGU() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ["gu-me"], queryFn: () => guApi.get<AssinanteMe>("/auth/me") });

  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const alterarSenha = useMutation({
    mutationFn: () => guApi.patch("/perfil/senha", { senhaAtual, novaSenha }),
    onSuccess: () => {
      setMsg("Senha alterada com sucesso.");
      setSenhaAtual("");
      setNovaSenha("");
    },
    onError: (err) => setMsg(err instanceof GuApiError ? err.message : "Erro ao alterar a senha"),
  });

  async function sair() {
    await guApi.post("/auth/logout", {});
    queryClient.clear();
    navigate("/updates/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">{data?.assinante?.nome}</h1>
        <p className="text-sm text-slate-500">{data?.assinante?.email}</p>
      </div>

      <section className="rounded-xl border border-slate-200 p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Alterar senha</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setMsg(null);
            alterarSenha.mutate();
          }}
          className="space-y-3"
        >
          <Campo rotulo="Senha atual">
            <input
              type="password"
              required
              value={senhaAtual}
              onChange={(e) => setSenhaAtual(e.target.value)}
              className={inputCls}
              autoComplete="current-password"
            />
          </Campo>
          <Campo rotulo="Nova senha (mín. 8 caracteres)">
            <input
              type="password"
              required
              minLength={8}
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              className={inputCls}
              autoComplete="new-password"
            />
          </Campo>
          {msg && <p className="text-sm text-slate-600">{msg}</p>}
          <Botao type="submit" disabled={alterarSenha.isPending}>
            {alterarSenha.isPending ? "Salvando…" : "Salvar nova senha"}
          </Botao>
        </form>
      </section>

      <section className="rounded-xl bg-gc-50 p-4 text-sm text-gc-900">
        <h2 className="mb-1 font-semibold">📲 Instale o app na tela inicial</h2>
        <p className="text-gc-700">
          No iPhone: Safari → Compartilhar → <strong>Adicionar à Tela de Início</strong>. No Android: Chrome → menu ⋮ →{" "}
          <strong>Instalar app</strong>. O GeriUpdates vira um app no seu celular.
        </p>
      </section>

      <Botao variante="secundario" onClick={sair} className="w-full">
        Sair da conta
      </Botao>
    </div>
  );
}
