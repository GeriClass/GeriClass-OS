import { createBrowserRouter } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Login } from "./pages/Login";
import { Home } from "./pages/Home";
import { Mentorados } from "./pages/Mentorados";
import { MentoradoDetalhe } from "./pages/MentoradoDetalhe";
import { Sessoes } from "./pages/Sessoes";
import { Bussolas } from "./pages/Bussolas";
import { Planos } from "./pages/Planos";
import { Equipe } from "./pages/Equipe";
import { PainelCS } from "./pages/PainelCS";
import { Encontros } from "./pages/Encontros";
import { Sumidos } from "./pages/Sumidos";

export const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: "mentorados", element: <Mentorados /> },
      { path: "mentorados/:id", element: <MentoradoDetalhe /> },
      { path: "sessoes", element: <Sessoes /> },
      { path: "bussolas", element: <Bussolas /> },
      { path: "planos", element: <Planos /> },
      { path: "painel-cs", element: <PainelCS /> },
      { path: "encontros", element: <Encontros /> },
      { path: "sumidos", element: <Sumidos /> },
      { path: "equipe", element: <Equipe /> },
    ],
  },
]);
