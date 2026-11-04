import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowUpRight, Building2, Heart, House, LogIn, Menu, Search, ShieldCheck, X,
} from 'lucide-react';
import { useAuth } from './auth';

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

export function formatPrice(value) {
  return value == null ? 'Sob consulta' : money.format(Number(value));
}

export function propertyPrice(property) {
  const purpose = String(property?.finalidade || '').toLowerCase();
  if (purpose.includes('alug')) return property?.precoAluguel ?? property?.precoVenda;
  return property?.precoVenda ?? property?.precoAluguel;
}

export function propertyPurpose(property) {
  const purpose = String(property?.finalidade || '').toLowerCase();
  if (purpose.includes('alug') && purpose.includes('vend')) return 'Venda e aluguel';
  if (purpose.includes('alug')) return 'Aluguel';
  if (purpose.includes('vend')) return 'Venda';
  return property?.finalidade || 'Imóvel';
}

export function propertyAvailable(property) {
  const status = String(property?.status || '').toLowerCase();
  return ['disponivel', 'disponível', 'available'].includes(status);
}

const imagePool = [
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1000&q=85',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=85',
  'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1000&q=85',
  'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1000&q=85',
];

export function propertyImage(property, index = 0) {
  const photo = property?.fotos?.find((item) => item.capa) || property?.fotos?.[0];
  if (photo?.url) return photo.url;
  if (photo?.caminho && /^https?:\/\//i.test(photo.caminho)) return photo.caminho;
  return imagePool[(Number(property?.id || index) || 0) % imagePool.length];
}

export function PageTitle({ eyebrow, title, description, action }) {
  return (
    <div className="page-title">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function LoadingState({ label = 'Carregando informações...' }) {
  return <div className="state-card"><span className="spinner" /><span>{label}</span></div>;
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="state-card state-error" role="alert">
      <span>{message || 'Não foi possível carregar as informações.'}</span>
      {onRetry && <button className="button button-outline button-small" onClick={onRetry}>Tentar novamente</button>}
    </div>
  );
}

export function EmptyState({ title = 'Nada por aqui ainda', description = 'Quando houver novidades, elas aparecerão nesta área.', icon: Icon = Search }) {
  return (
    <div className="empty-state">
      <span className="empty-icon"><Icon size={22} /></span>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

export function StatusPill({ value }) {
  const text = String(value || 'pendente').replaceAll('_', ' ');
  const status = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  let tone = 'neutral';
  if (['aceita', 'assinado', 'aprovado', 'disponivel', 'ativa'].some((item) => status.includes(item))) tone = 'success';
  else if (['recusada', 'cancelado', 'vendido', 'alugado', 'negado'].some((item) => status.includes(item))) tone = 'danger';
  else if (['espera', 'aguardando', 'reservado'].some((item) => status.includes(item))) tone = 'warning';
  return <span className={`status-pill status-${tone}`}>{text}</span>;
}

export function PropertyCard({ property, index = 0, favorite = false, onFavorite }) {
  const location = [property?.bairro?.nome, property?.bairro?.cidade].filter(Boolean).join(', ');
  return (
    <article className="property-card">
      <Link to={`/imoveis/${property.id}`} className="property-image-link" aria-label={`Ver ${property.titulo || 'imóvel'}`}>
        <img className="property-image" src={propertyImage(property, index)} alt={property?.titulo || 'Imóvel'} />
        <span className="property-tag">{propertyPurpose(property)}</span>
      </Link>
      {onFavorite && (
        <button className={`favorite-toggle ${favorite ? 'is-favorite' : ''}`} onClick={() => onFavorite(property)} aria-label={favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}>
          <Heart size={18} fill={favorite ? 'currentColor' : 'none'} />
        </button>
      )}
      <div className="property-info">
        <span className="property-location">{location || 'Localização a consultar'}</span>
        <Link to={`/imoveis/${property.id}`} className="property-title">{property?.titulo || `Imóvel ${property.id}`}</Link>
        <div className="property-meta">
          <span>{property?.dormitorios || 0} quartos</span><span>{property?.areaTotal || '—'} m²</span>
        </div>
        <div className="property-card-bottom">
          <strong>{formatPrice(propertyPrice(property))}<small>{propertyPurpose(property) === 'Aluguel' ? ' / mês' : ''}</small></strong>
          <Link to={`/imoveis/${property.id}`} className="circle-arrow" aria-label="Ver imóvel"><ArrowUpRight size={17} /></Link>
        </div>
      </div>
    </article>
  );
}

function Header() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const isAdmin = session?.tipo === 'ADMIN';

  const publicLinks = [
    { to: '/', label: 'Explorar imóveis', icon: House },
    ...(session && !isAdmin ? [{ to: '/cliente/favoritos', label: 'Favoritos', icon: Heart }] : []),
    ...(session && isAdmin ? [{ to: '/admin', label: 'Painel', icon: ShieldCheck }] : []),
  ];

  function signOut() {
    logout();
    setMenuOpen(false);
    navigate('/');
  }

  const active = ({ isActive }) => `nav-link${isActive ? ' nav-link-active' : ''}`;

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link to="/" className="brand" onClick={() => setMenuOpen(false)}>
          <span className="brand-mark"><Building2 size={19} strokeWidth={2.2} /></span>
          <span>Schneider Imóveis</span>
        </Link>
        <button className="mobile-menu-toggle" onClick={() => setMenuOpen((open) => !open)} aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}>
          {menuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
        <nav className={`main-nav ${menuOpen ? 'main-nav-open' : ''}`}>
          {publicLinks.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/'} className={active} onClick={() => setMenuOpen(false)}>
              <Icon size={16} /> {label}
            </NavLink>
          ))}
          {session && !isAdmin && (
            <>
              <NavLink to="/cliente/ofertas" className={active} onClick={() => setMenuOpen(false)}>Minhas ofertas</NavLink>
              <NavLink to="/cliente/contratos" className={active} onClick={() => setMenuOpen(false)}>Contratos</NavLink>
            </>
          )}
          {session && isAdmin && (
            <NavLink to="/admin/imoveis" className={active} onClick={() => setMenuOpen(false)}>Imóveis</NavLink>
          )}
          <div className="nav-actions">
            {session ? (
              <>
                <span className="nav-user">{session.email}</span>
                <button className="button button-outline button-small" onClick={signOut}>Sair</button>
              </>
            ) : (
              <Link to="/login" className="button button-dark button-small" onClick={() => setMenuOpen(false)}><LogIn size={15} /> Entrar</Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}

export function SiteLayout() {
  const location = useLocation();
  const isPrivate = location.pathname.startsWith('/cliente') || location.pathname.startsWith('/admin');
  return (
    <div className="app-shell">
      <Header />
      <main className={isPrivate ? 'main-content private-content' : 'main-content'}><Outlet /></main>
      <footer className="site-footer">
        <div className="footer-inner">
          <Link to="/" className="brand footer-brand"><span className="brand-mark"><Building2 size={18} /></span><span>Schneider Imóveis</span></Link>
          <span>Um lugar para cada novo começo.</span>
          <span>© {new Date().getFullYear()} Schneider Imóveis</span>
        </div>
      </footer>
    </div>
  );
}
