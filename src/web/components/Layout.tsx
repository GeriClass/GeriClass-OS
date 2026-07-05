import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { Papel } from "@shared/constantes";

interface Me {
  usuario: { id: string; nome: string; papel: Papel } | null;
}

const LINKS = [
  { para: "/", rotulo: "Início", fim: true },
  { para: "/mentorados", rotulo: "Mentorados" },
  { para: "/sessoes", rotulo: "Sessões" },
  { para: "/bussolas", rotulo: "Bússolas" },
  { para: "/planos", rotulo: "Planos 30/60" },
  { para: "/equipe", rotulo: "Equipe" },
];

export function Layout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: () => api.get<Me>("/auth/me"),
  });

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center text-slate-400">Carregando…</div>;
  }
  if (!data?.usuario) {
    navigate("/login", { replace: true });
    return null;
  }

  async function sair() {
    await api.post("/auth/logout", {});
    queryClient.clear();
    navigate("/login");
  }

  return (
    <div className="min-h-screen">
      <header className="bg-gc-900 text-white">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
          <span className="text-lg font-bold tracking-tight">
            GeriClass <span className="text-gc-100 font-light">OS</span>
          </span>
          <nav className="flex flex-1 gap-1 overflow-x-auto text-sm">
            {LINKS.map((l) => (
              <NavLink
                key={l.para}
                to={l.para}
                end={l.fim}
                className={({ isActive }) =>
                  `rounded px-3 py-1.5 whitespace-nowrap transition ${
                    isActive ? "bg-gc-600 text-white" : "text-gc-100 hover:bg-gc-700"
                  }`
                }
              >
                {l.rotulo}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-gc-100 sm:inline">{data.usuario.nome}</span>
            <button onClick={sair} className="rounded border border-gc-500 px-2 py-1 text-xs hover:bg-gc-700">
              Sair
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
