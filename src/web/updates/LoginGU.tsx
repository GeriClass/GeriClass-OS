import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { guApi, GuApiError } from "./api";
import { Botao, Campo, inputCls } from "../components/ui";

export function LoginGU() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      await guApi.post("/auth/login", { email, senha });
      // O "gu-me" nulo pode estar fresco no cache — remover antes de entrar.
      queryClient.removeQueries({ queryKey: ["gu-me"] });
      navigate("/updates");
    } catch (err) {
      setErro(err instanceof GuApiError ? err.message : "Erro ao entrar");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gc-900 px-4">
      <form onSubmit={entrar} className="w-full max-w-sm rounded-xl bg-white p-8 shadow-xl">
        <h1 className="mb-1 text-center text-2xl font-bold text-gc-900">
          Geri<span className="font-light">Updates</span>
        </h1>
        <p className="mb-6 text-center text-sm text-slate-500">Atualização diária em Geriatria, no seu bolso</p>
        <div className="space-y-4">
          <Campo rotulo="Email">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputCls}
              autoComplete="email"
            />
          </Campo>
          <Campo rotulo="Senha">
            <input
              type="password"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className={inputCls}
              autoComplete="current-password"
            />
          </Campo>
          {erro && <p className="text-sm text-red-600">{erro}</p>}
          <Botao type="submit" disabled={enviando} className="w-full">
            {enviando ? "Entrando…" : "Entrar"}
          </Botao>
          <p className="text-center text-xs text-slate-400">
            Ainda não é assinante? Fale com a equipe GeriClass para liberar seu acesso.
          </p>
        </div>
      </form>
    </div>
  );
}
