// Casca do app do assinante: shell mobile com abas inferiores + PWA.
import { useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { guApi, type AssinanteMe } from "./api";

const ABAS = [
  { para: "/updates", rotulo: "Feed", icone: "🏠", fim: true },
  { para: "/updates/salvos", rotulo: "Salvos", icone: "🔖" },
  { para: "/updates/perfil", rotulo: "Perfil", icone: "👤" },
];

/** Título/tema do documento enquanto o assinante está no app. */
function usarIdentidadeGU() {
  useEffect(() => {
    const tituloAnterior = document.title;
    document.title = "GeriUpdates";
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/updates-sw.js", { scope: "/updates" }).catch(() => {});
    }
    return () => {
      document.title = tituloAnterior;
    };
  }, []);
}

export function LayoutGU() {
  usarIdentidadeGU();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ["gu-me"],
    queryFn: () => guApi.get<AssinanteMe>("/auth/me"),
  });

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center text-slate-400">Carregando…</div>;
  }
  if (!data?.assinante) {
    navigate("/updates/login", { replace: true });
    return null;
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-white shadow-sm">
      <header className="sticky top-0 z-10 bg-gc-900 px-4 pt-[env(safe-area-inset-top)] text-white">
        <div className="flex items-center justify-between py-3">
          <span className="text-lg font-bold tracking-tight">
            Geri<span className="text-gc-100 font-light">Updates</span>
          </span>
          <span className="text-xs text-gc-100">Atualização diária em Geriatria</span>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 pb-24">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex max-w-md">
          {ABAS.map((a) => (
            <NavLink
              key={a.para}
              to={a.para}
              end={a.fim}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition ${
                  isActive ? "text-gc-600" : "text-slate-400"
                }`
              }
            >
              <span className="text-lg leading-none">{a.icone}</span>
              {a.rotulo}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
