import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminGuard from "@/components/AdminGuard";
import SplashScreen from "./pages/SplashScreen";
import LoginScreen from "./pages/LoginScreen";
import PassengerHome from "./pages/PassengerHome";
import RideConfirm from "./pages/RideConfirm";
import RideActive from "./pages/RideActive";
import RatingScreen from "./pages/RatingScreen";
import HistoryScreen from "./pages/HistoryScreen";
import ProfileScreen from "./pages/ProfileScreen";
import DriverPanel from "./pages/DriverPanel";
import HomePage from "./pages/HomePage";
import NotFound from "./pages/NotFound";
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import DespachoRapido from "./pages/admin/DespachoRapido";
import WhatsPainel from "./pages/admin/WhatsPainel";
import WhatsPalavrasChave from "./pages/admin/WhatsPalavrasChave";
import WhatsClientes from "./pages/admin/WhatsClientes";
import CaixaResumo from "./pages/admin/CaixaResumo";
import CaixaPosPago from "./pages/admin/CaixaPosPago";
import CaixaCartao from "./pages/admin/CaixaCartao";
import ViagensEncerradas from "./pages/admin/ViagensEncerradas";
import ViagensAndamento from "./pages/admin/ViagensAndamento";
import ViagensRegistroChamadas from "./pages/admin/ViagensRegistroChamadas";
import ViagensTodas from "./pages/admin/ViagensTodas";
import Motoristas from "./pages/admin/Motoristas";
import Passageiros from "./pages/admin/Passageiros";
import DispararNotificacao from "./pages/admin/DispararNotificacao";
import RelatorioErros from "./pages/admin/RelatorioErros";
import Precificacao from "./pages/admin/Precificacao";
import NovaCidade from "./pages/admin/NovaCidade";
import CategoriasVeiculos from "./pages/admin/CategoriasVeiculos";
import AnunciosBanners from "./pages/admin/AnunciosBanners";
import RelatorioEstabelecimentos from "./pages/admin/RelatorioEstabelecimentos";
import RelatorioViagens from "./pages/admin/RelatorioViagens";
import MapaCalor from "./pages/admin/MapaCalor";
import CuponsCriar from "./pages/admin/CuponsCriar";
import CuponsListar from "./pages/admin/CuponsListar";
import EstabelecimentosListar from "./pages/admin/EstabelecimentosListar";
import EstabelecimentosCadastrar from "./pages/admin/EstabelecimentosCadastrar";
import Mensalidades from "./pages/admin/Mensalidades";
import MapaMotoristas from "./pages/admin/MapaMotoristas";
import SuporteEmergencial from "./pages/admin/SuporteEmergencial";
import ConfigurarApp from "./pages/admin/ConfigurarApp";
import AdminLogin from "./pages/admin/AdminLogin";
import ResetPassword from "./pages/ResetPassword";
import EnviosScreen from "./pages/EnviosScreen";
import EnvioNovo from "./pages/EnvioNovo";
import EnvioTracking from "./pages/EnvioTracking";
import EnvioNovo from "./pages/EnvioNovo";
import DriverProfileScreen from "./pages/DriverProfileScreen";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<SplashScreen />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/login" element={<LoginScreen />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Protected user routes */}
            <Route path="/passenger" element={<ProtectedRoute><PassengerHome /></ProtectedRoute>} />
            <Route path="/ride-confirm" element={<ProtectedRoute><RideConfirm /></ProtectedRoute>} />
            <Route path="/ride-active" element={<ProtectedRoute><RideActive /></ProtectedRoute>} />
            <Route path="/rating" element={<ProtectedRoute><RatingScreen /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><HistoryScreen /></ProtectedRoute>} />
            <Route path="/envios" element={<ProtectedRoute><EnviosScreen /></ProtectedRoute>} />
            <Route path="/envios/novo" element={<ProtectedRoute><EnvioNovo /></ProtectedRoute>} />
            <Route path="/envios/:id" element={<ProtectedRoute><EnvioTracking /></ProtectedRoute>} />
            <Route path="/envios/novo" element={<ProtectedRoute><EnvioNovo /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfileScreen /></ProtectedRoute>} />
            <Route path="/driver" element={<ProtectedRoute><DriverPanel /></ProtectedRoute>} />
            <Route path="/driver/profile" element={<ProtectedRoute><DriverProfileScreen /></ProtectedRoute>} />

            {/* Admin routes - email restricted */}
            <Route path="/admin" element={<AdminGuard><AdminLayout /></AdminGuard>}>
              <Route index element={<AdminDashboard />} />
              <Route path="despacho" element={<DespachoRapido />} />
              <Route path="whats/painel" element={<WhatsPainel />} />
              <Route path="whats/palavras-chave" element={<WhatsPalavrasChave />} />
              <Route path="whats/clientes" element={<WhatsClientes />} />
              <Route path="caixa/pre-pago" element={<CaixaResumo />} />
              <Route path="caixa/pos-pago" element={<CaixaPosPago />} />
              <Route path="caixa/cartao" element={<CaixaCartao />} />
              <Route path="viagens/encerradas" element={<ViagensEncerradas />} />
              <Route path="viagens/andamento" element={<ViagensAndamento />} />
              <Route path="viagens/registro-chamadas" element={<ViagensRegistroChamadas />} />
              <Route path="viagens/todas" element={<ViagensTodas />} />
              <Route path="motoristas" element={<Motoristas />} />
              <Route path="passageiros" element={<Passageiros />} />
              <Route path="notificacao" element={<DispararNotificacao />} />
              <Route path="erros" element={<RelatorioErros />} />
              <Route path="mapa-calor" element={<MapaCalor />} />
              <Route path="precificacao" element={<Precificacao />} />
              <Route path="nova-cidade" element={<NovaCidade />} />
              <Route path="categorias" element={<CategoriasVeiculos />} />
              <Route path="anuncios" element={<AnunciosBanners />} />
              <Route path="cupons/criar" element={<CuponsCriar />} />
              <Route path="cupons/listar" element={<CuponsListar />} />
              <Route path="estabelecimentos/listar" element={<EstabelecimentosListar />} />
              <Route path="estabelecimentos/cadastrar" element={<EstabelecimentosCadastrar />} />
              <Route path="relatorio-estabelecimentos" element={<RelatorioEstabelecimentos />} />
              <Route path="relatorio-viagens" element={<RelatorioViagens />} />
              <Route path="mensalidades" element={<Mensalidades />} />
              <Route path="mapa-motoristas" element={<MapaMotoristas />} />
              <Route path="suporte" element={<SuporteEmergencial />} />
              <Route path="configurar" element={<ConfigurarApp />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
