import { Link, Route, Routes } from 'react-router-dom';
import { AuthProvider, ProtectedRoute } from './auth';
import { SiteLayout } from './components';
import { HomePage, LoginPage, PropertyPage, RegisterPage, AccessDeniedPage } from './pages/PublicPages';
import {
  ClientHomePage, ClientOffersPage, NewOfferPage, FavoritesPage, ClientContractsPage,
} from './pages/ClientPages';
import {
  AdminHomePage, AdminPropertiesPage, AdminNeighborhoodsPage, AdminTypesPage,
  AdminPhotosPage, AdminUsersPage, AdminOffersPage, AdminContractsPage,
} from './pages/AdminPages';

function AppRoutes() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/imoveis/:id" element={<PropertyPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cadastro" element={<RegisterPage />} />
        <Route path="/acesso-negado" element={<AccessDeniedPage />} />

        <Route path="/cliente" element={<ProtectedRoute roles={['USER']}><ClientHomePage /></ProtectedRoute>} />
        <Route path="/cliente/ofertas" element={<ProtectedRoute roles={['USER']}><ClientOffersPage /></ProtectedRoute>} />
        <Route path="/cliente/ofertas/nova" element={<ProtectedRoute roles={['USER']}><NewOfferPage /></ProtectedRoute>} />
        <Route path="/cliente/favoritos" element={<ProtectedRoute roles={['USER']}><FavoritesPage /></ProtectedRoute>} />
        <Route path="/cliente/contratos" element={<ProtectedRoute roles={['USER']}><ClientContractsPage /></ProtectedRoute>} />

        <Route path="/admin" element={<ProtectedRoute roles={['ADMIN']}><AdminHomePage /></ProtectedRoute>} />
        <Route path="/admin/imoveis" element={<ProtectedRoute roles={['ADMIN']}><AdminPropertiesPage /></ProtectedRoute>} />
        <Route path="/admin/bairros" element={<ProtectedRoute roles={['ADMIN']}><AdminNeighborhoodsPage /></ProtectedRoute>} />
        <Route path="/admin/tipos" element={<ProtectedRoute roles={['ADMIN']}><AdminTypesPage /></ProtectedRoute>} />
        <Route path="/admin/fotos" element={<ProtectedRoute roles={['ADMIN']}><AdminPhotosPage /></ProtectedRoute>} />
        <Route path="/admin/usuarios" element={<ProtectedRoute roles={['ADMIN']}><AdminUsersPage /></ProtectedRoute>} />
        <Route path="/admin/ofertas" element={<ProtectedRoute roles={['ADMIN']}><AdminOffersPage /></ProtectedRoute>} />
        <Route path="/admin/contratos" element={<ProtectedRoute roles={['ADMIN']}><AdminContractsPage /></ProtectedRoute>} />

        <Route path="*" element={<main className="page-wrap not-found"><span className="eyebrow">404 · Página não encontrada</span><h1>Este endereço não existe.</h1><p>Volte para a vitrine e encontre o lugar certo.</p><Link className="button button-dark" to="/">Explorar imóveis</Link></main>} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return <AuthProvider><AppRoutes /></AuthProvider>;
}
