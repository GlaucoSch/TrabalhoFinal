import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowDown, ArrowLeft, ArrowRight, ArrowUp, BedDouble, Check, ChevronDown, Heart,
  MapPin, Maximize, MessageCircle, Ruler, ShieldCheck, Sparkles, X,
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../auth';
import {
  EmptyState, ErrorState, formatPrice, LoadingState, PageTitle, propertyAvailable,
  propertyImage, propertyPrice, propertyPurpose, PropertyCard, StatusPill,
} from '../components';

function getErrorMessage(error) {
  return error?.message || 'Não foi possível carregar as informações. Tente novamente.';
}

function availableProperties(properties) {
  return properties.filter(propertyAvailable);
}

export function HomePage() {
  const { session } = useAuth();
  const [properties, setProperties] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [error, setError] = useState('');
  const [favoriteError, setFavoriteError] = useState('');
  const [priceRangeError, setPriceRangeError] = useState('');
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ query: '', purpose: '', neighborhood: '', minPrice: '', maxPrice: '', order: '' });
  const [page, setPage] = useState(1);
  const pageSize = 6;

  async function loadProperties() {
    setLoading(true);
    setError('');
    try {
      const result = await api.get('/imovel');
      setProperties(Array.isArray(result) ? result : []);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadProperties(); }, []);
  useEffect(() => {
    if (!session) { setFavorites([]); return; }
    api.get('/favoritos')
      .then((result) => setFavorites(Array.isArray(result) ? result : []))
      .catch((requestError) => setFavoriteError(getErrorMessage(requestError)));
  }, [session]);

  const neighborhoods = [...new Set(properties.map((property) => property?.bairro?.nome).filter(Boolean))].sort();
  const filtered = useMemo(() => {
    let result = availableProperties(properties);
    if (filters.query.trim()) {
      const query = filters.query.trim().toLocaleLowerCase('pt-BR');
      result = result.filter((property) => `${property.titulo} ${property.descricao} ${property.bairro?.nome} ${property.bairro?.cidade}`.toLocaleLowerCase('pt-BR').includes(query));
    }
    if (filters.purpose) result = result.filter((property) => {
      const purpose = String(property.finalidade || '').toLowerCase();
      const both = purpose.includes('amb') || (purpose.includes('alug') && purpose.includes('vend'));
      return both || propertyPurpose(property).toLowerCase() === filters.purpose;
    });
    if (filters.neighborhood) result = result.filter((property) => property.bairro?.nome === filters.neighborhood);
    if (filters.minPrice !== '') result = result.filter((property) => Number(propertyPrice(property) || 0) >= Number(filters.minPrice));
    if (filters.maxPrice !== '') result = result.filter((property) => Number(propertyPrice(property) || 0) <= Number(filters.maxPrice));
    if (filters.order) {
      result = [...result].sort((a, b) => {
        const difference = Number(propertyPrice(a) || 0) - Number(propertyPrice(b) || 0);
        return filters.order === 'desc' ? -difference : difference;
      });
    }
    return result;
  }, [properties, filters]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);

  function updateFilter(key, value) {
    if (key === 'minPrice' || key === 'maxPrice') {
      const next = { ...filters, [key]: value };
      setPriceRangeError(next.minPrice !== '' && next.maxPrice !== '' && Number(next.minPrice) > Number(next.maxPrice)
        ? 'O preço mínimo não pode ser maior que o preço máximo.'
        : '');
    }
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  }

  async function toggleFavorite(property) {
    if (!session) {
      window.location.assign(`/login?retorno=${encodeURIComponent(window.location.pathname + window.location.hash)}`);
      return;
    }
    setFavoriteError('');
    const saved = favorites.find((item) => (item.imovel?.id || item.imovelId || item.id) === property.id);
    try {
      if (saved) {
        await api.delete(`/favoritos/${saved.id}`);
        setFavorites((items) => items.filter((item) => item.id !== saved.id));
      } else {
        const created = await api.post('/favoritos', { imovelId: property.id });
        setFavorites((items) => [...items, created || { id: property.id, imovelId: property.id, imovel: property }]);
      }
    } catch (requestError) {
      setFavoriteError(getErrorMessage(requestError));
    }
  }

  return (
    <>
      <section className="hero">
        <div className="hero-content">
          <div className="hero-copy">
            <span className="eyebrow eyebrow-light"><Sparkles size={14} /> Seu próximo capítulo começa aqui</span>
            <h1>Mais do que um endereço.<br /><em>Um lugar seu.</em></h1>
            <p>Encontre espaços que combinam com a vida que você quer viver. Com calma, transparência e alguém ao seu lado.</p>
            <a href="#vitrine" className="button button-cream">Encontrar meu lugar <ArrowRight size={17} /></a>
            <div className="hero-proof"><span className="proof-avatars"><i>m</i><i>c</i><i>a</i></span><span>Uma busca mais leve, do primeiro clique às chaves.</span></div>
          </div>
          <div className="hero-visual">
            <div className="hero-photo">
              <img src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=90" alt="Sala iluminada de um imóvel" />
              <div className="hero-photo-caption"><span><span className="live-dot" /> Seleção Schneider</span><strong>Espaços com personalidade</strong></div>
            </div>
            <div className="hero-floating-card"><span className="float-icon"><Heart size={16} /></span><span><b>Seu ritmo, sua escolha.</b><small>Explore sem pressa.</small></span></div>
          </div>
        </div>
        <div className="hero-decoration hero-decoration-one" /><div className="hero-decoration hero-decoration-two" />
      </section>

      <section className="page-wrap listing-section" id="vitrine">
        <div className="section-intro">
          <div><span className="eyebrow">Curadoria Schneider Imóveis</span><h2>Um lugar para cada<br /><em>jeito de viver.</em></h2></div>
          <p>Boas histórias começam com a escolha certa.<br />Encontre aqui a sua próxima.</p>
        </div>
        <div className="filter-bar">
          <label className="filter-search"><MapPin size={17} /><input value={filters.query} onChange={(event) => updateFilter('query', event.target.value)} placeholder="Bairro, cidade ou imóvel" aria-label="Buscar imóvel ou localização" /></label>
          <label className="filter-select"><span>Finalidade</span><select value={filters.purpose} onChange={(event) => updateFilter('purpose', event.target.value)}><option value="">Todas</option><option value="aluguel">Aluguel</option><option value="venda">Venda</option></select><ChevronDown size={14} /></label>
          <label className="filter-select"><span>Bairro</span><select value={filters.neighborhood} onChange={(event) => updateFilter('neighborhood', event.target.value)}><option value="">Todos</option>{neighborhoods.map((name) => <option key={name}>{name}</option>)}</select><ChevronDown size={14} /></label>
          <label className="filter-price"><span>Preço mínimo</span><input aria-label="Preço mínimo" type="number" min="0" value={filters.minPrice} onChange={(event) => updateFilter('minPrice', event.target.value)} placeholder="R$ mín." /></label>
          <label className="filter-price"><span>Preço máximo</span><input aria-label="Preço máximo" type="number" min="0" value={filters.maxPrice} onChange={(event) => updateFilter('maxPrice', event.target.value)} placeholder="R$ máx." /></label>
          <label className="filter-select"><span>Ordenar por</span><select value={filters.order} onChange={(event) => updateFilter('order', event.target.value)}><option value="">Relevância</option><option value="asc">Menor preço</option><option value="desc">Maior preço</option></select><ChevronDown size={14} /></label>
          <button className="filter-submit" aria-label="Aplicar busca"><ArrowRight size={18} /></button>
        </div>

        <div className="listing-heading">
          <div><h3>Imóveis disponíveis</h3><span>{filtered.length} {filtered.length === 1 ? 'espaço encontrado' : 'espaços encontrados'}</span></div>
          <div className="sort-shortcut"><ArrowUp size={14} /><ArrowDown size={14} /> Preço crescente ou decrescente</div>
        </div>
        {priceRangeError && <div className="form-error-box" role="alert">{priceRangeError}</div>}
        {favoriteError && <div className="notice-box notice-warning" role="alert">{favoriteError}</div>}
        {loading ? <LoadingState label="Buscando espaços para você..." /> : error ? <ErrorState message={error} onRetry={loadProperties} /> : visible.length === 0 ? (
          <EmptyState title="Nenhum imóvel encontrado" description="Tente mudar os filtros ou volte mais tarde para ver novas opções." />
        ) : (
          <div className="property-grid">{visible.map((property, index) => <PropertyCard key={property.id} property={property} index={index} favorite={favorites.some((item) => (item.imovel?.id || item.imovelId || item.id) === property.id)} onFavorite={toggleFavorite} />)}</div>
        )}
        {!loading && !error && filtered.length > pageSize && (
          <div className="pagination">
            <button className="button button-outline button-small" disabled={page === 1} onClick={() => setPage((current) => current - 1)}><ArrowLeft size={15} /> Anterior</button>
            <span>Página <b>{page}</b> de {pages}</span>
            <button className="button button-outline button-small" disabled={page === pages} onClick={() => setPage((current) => current + 1)}>Próxima <ArrowRight size={15} /></button>
          </div>
        )}
      </section>

      <section className="values-section">
        <div className="page-wrap values-content">
          <div className="values-heading"><span className="eyebrow">A gente acredita</span><h2>Encontrar um lar<br />pode ser <em>leve.</em></h2></div>
          <div className="value-list">
            <article><span>01</span><div><h3>Escuta de verdade</h3><p>O que importa para você vem antes de qualquer endereço.</p></div></article>
            <article><span>02</span><div><h3>Escolhas com clareza</h3><p>Informação honesta em cada etapa, sem surpresas no caminho.</p></div></article>
            <article><span>03</span><div><h3>No seu tempo</h3><p>Um bom lugar se reconhece. A decisão é sempre sua.</p></div></article>
          </div>
        </div>
      </section>
    </>
  );
}

export function PropertyPage() {
  const { id } = useParams();
  const { session } = useAuth();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [contacting, setContacting] = useState(false);
  const [contactError, setContactError] = useState('');
  const [form, setForm] = useState({ nome: '', telefone: '', email: session?.email || '', mensagem: '' });

  async function loadProperty() {
    setLoading(true);
    setError('');
    try {
      const data = await api.get(`/imovel/${id}`);
      setProperty(data);
      setForm((current) => ({
        ...current,
        mensagem: `Olá! Tenho interesse no imóvel #${data.id} — ${data.titulo || 'Imóvel'}, tipo ${data.tipoImovel?.nome || propertyPurpose(data)}, bairro ${data.bairro?.nome || 'a confirmar'}, valor ${formatPrice(propertyPrice(data))}. Gostaria de receber mais informações.`,
      }));
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadProperty(); }, [id]);

  async function submitInterest(event) {
    event.preventDefault();
    setContactError('');
    setNotice('');
    setContacting(true);
    try {
      const result = await api.post(`/imoveis/sabermais/${id}`, form);
      setNotice(typeof result === 'string' ? result : 'Interesse enviado! A imobiliária entrará em contato em breve.');
    } catch (requestError) {
      setContactError(getErrorMessage(requestError));
    } finally {
      setContacting(false);
    }
  }

  if (loading) return <div className="page-wrap detail-page"><LoadingState label="Carregando imóvel..." /></div>;
  if (error || !property) return <div className="page-wrap detail-page"><ErrorState message={error || 'Imóvel não encontrado.'} onRetry={loadProperty} /><Link to="/" className="text-link"><ArrowLeft size={15} /> Voltar à vitrine</Link></div>;

  const purpose = propertyPurpose(property);
  const location = [property?.bairro?.nome, property?.bairro?.cidade, property?.bairro?.estado].filter(Boolean).join(' · ');
  const facts = [
    { icon: BedDouble, value: property.dormitorios || 0, label: 'quartos' },
    { icon: Maximize, value: property.areaTotal || '—', label: 'm² totais' },
    { icon: Ruler, value: property.banheiros || 0, label: 'banheiros' },
  ];

  return (
    <div className="page-wrap detail-page">
      <Link to="/" className="text-link"><ArrowLeft size={15} /> Voltar à vitrine</Link>
      <div className="detail-gallery">
        <img src={propertyImage(property, Number(id))} alt={property.titulo || 'Imóvel'} />
        <div className="gallery-label"><span className="property-tag">{purpose}</span><StatusPill value={property.status} /></div>
      </div>
      <div className="detail-layout">
        <div className="detail-main">
          <span className="eyebrow">MORADA · IMÓVEL #{property.id}</span>
          <h1>{property.titulo || `Imóvel ${property.id}`}</h1>
          <p className="detail-location"><MapPin size={17} />{location || 'Localização a consultar'}</p>
          <div className="detail-facts">{facts.map(({ icon: Icon, value, label }) => <div key={label}><Icon size={18} /><strong>{value}</strong><span>{label}</span></div>)}</div>
          <section className="detail-section"><h2>Um pouco sobre este lugar</h2><p>{property.descricao || 'Entre em contato com a imobiliária para saber mais sobre este imóvel.'}</p></section>
          {property.caracteristicas && <section className="detail-section"><h2>O que faz dele especial</h2><p>{property.caracteristicas}</p></section>}
          <section className="detail-section"><h2>Endereço</h2><p>{[property.endereco, property.numero, property.complemento, location, property.cep].filter(Boolean).join(', ') || 'Endereço sob consulta'}</p></section>
        </div>
        <aside className="detail-sidebar">
          <div className="price-panel"><span className="eyebrow">Valor {purpose === 'Aluguel' ? 'mensal' : 'do imóvel'}</span><strong>{formatPrice(propertyPrice(property))}</strong>{purpose === 'Aluguel' && <small>por mês</small>}
            {propertyAvailable(property) && session?.tipo === 'USER' ? <Link to={`/cliente/ofertas/nova?imovel=${property.id}`} className="button button-dark button-full">Fazer oferta <ArrowRight size={16} /></Link> : !propertyAvailable(property) ? <p className="unavailable-note"><ShieldCheck size={16} /> Este imóvel não está recebendo ofertas.</p> : !session && <Link to="/login" className="button button-dark button-full">Entrar para fazer oferta <ArrowRight size={16} /></Link>}
            {session?.tipo === 'ADMIN' && <Link to="/admin/imoveis" className="button button-outline button-full">Gerenciar imóvel</Link>}
          </div>
          <form className="contact-card" onSubmit={submitInterest}>
            <div className="contact-card-title"><span className="contact-icon"><MessageCircle size={17} /></span><div><h3>Vamos conversar?</h3><p>Peça mais informações, sem compromisso.</p></div></div>
            <label>Seu nome<input required value={form.nome} onChange={(event) => setForm({ ...form, nome: event.target.value })} placeholder="Como podemos te chamar?" /></label>
            <label>Seu telefone<input required type="tel" value={form.telefone} onChange={(event) => setForm({ ...form, telefone: event.target.value })} placeholder="(00) 00000-0000" /></label>
            <label>Seu e-mail<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="voce@email.com" /></label>
            <label>Mensagem<textarea required rows="4" value={form.mensagem} onChange={(event) => setForm({ ...form, mensagem: event.target.value })} /></label>
            {contactError && <p className="form-error" role="alert">{contactError}</p>}
            {notice && <p className="form-success" role="status"><Check size={15} />{notice}</p>}
            <button className="button button-dark button-full" disabled={contacting}>{contacting ? 'Enviando...' : 'Enviar interesse'} <ArrowRight size={16} /></button>
            <small className="privacy-note">Seus dados são usados somente para responder ao seu contato.</small>
          </form>
        </aside>
      </div>
    </div>
  );
}

export function LoginPage() {
  const { login, session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', senha: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const expired = new URLSearchParams(location.search).has('expirada');

  useEffect(() => {
    if (!session) return;
    const returnTo = new URLSearchParams(location.search).get('retorno');
    const safeReturnTo = returnTo?.startsWith('/') && !returnTo.startsWith('//') ? returnTo : null;
    navigate(location.state?.from?.pathname || safeReturnTo || (session.tipo === 'ADMIN' ? '/admin' : '/cliente'), { replace: true });
  }, [session, location, navigate]);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(form.email.trim(), form.senha);
      const returnTo = new URLSearchParams(location.search).get('retorno');
      const safeReturnTo = returnTo?.startsWith('/') && !returnTo.startsWith('//') ? returnTo : null;
      navigate(location.state?.from?.pathname || safeReturnTo || (result.tipo === 'ADMIN' ? '/admin' : '/cliente'), { replace: true });
    } catch (requestError) {
      setError(requestError.message || 'Não foi possível entrar. Confira seu e-mail e senha.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-photo"><img src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=85" alt="" /><div className="auth-photo-copy"><span className="eyebrow eyebrow-light">MORADA · UM NOVO COMEÇO</span><h2>Um lugar especial<br />te espera.</h2><p>Estamos aqui para tornar sua busca mais simples.</p></div></div>
      <div className="auth-form-side"><form className="auth-form" onSubmit={submit}>
        <Link to="/" className="text-link"><ArrowLeft size={15} /> Voltar à vitrine</Link>
        <span className="eyebrow">BEM-VINDO DE VOLTA</span><h1>Entre na sua conta.</h1><p>Acesse suas ofertas, favoritos e contratos.</p>
        {expired && <div className="notice-box">Sua sessão expirou. Entre novamente para continuar.</div>}
        {error && <div className="form-error-box" role="alert">{error}</div>}
        <label>E-mail<input type="email" autoComplete="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="voce@email.com" /></label>
        <label>Senha<input type="password" autoComplete="current-password" required value={form.senha} onChange={(event) => setForm({ ...form, senha: event.target.value })} placeholder="Sua senha" /></label>
        <button className="button button-dark button-full" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'} <ArrowRight size={16} /></button>
        <div className="auth-divider"><span>ou</span></div>
        <p className="auth-bottom">Ainda não tem uma conta? <Link to="/cadastro">Criar conta</Link></p>
      </form></div>
    </div>
  );
}

export function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ nome: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (form.password.length < 8) { setError('A senha deve ter pelo menos 8 caracteres.'); return; }
    if (form.password !== form.confirm) { setError('As senhas informadas não coincidem.'); return; }
    setLoading(true);
    try {
      await api.post('/public/register', { nome: form.nome.trim(), email: form.email.trim(), password: form.password });
      setSuccess('Conta criada com sucesso. Agora você já pode entrar.');
      window.setTimeout(() => navigate('/login'), 900);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="auth-page">
      <div className="auth-photo"><img src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=85" alt="" /><div className="auth-photo-copy"><span className="eyebrow eyebrow-light">QUE BOM TER VOCÊ AQUI</span><h2>O próximo passo<br />é encontrar seu lugar.</h2><p>Crie sua conta e comece uma busca do seu jeito.</p></div></div>
      <div className="auth-form-side"><form className="auth-form" onSubmit={submit}>
        <Link to="/" className="text-link"><ArrowLeft size={15} /> Voltar à vitrine</Link><span className="eyebrow">SEU ESPAÇO COMEÇA AQUI</span><h1>Crie sua conta.</h1><p>É rápido e gratuito.</p>
        {error && <div className="form-error-box" role="alert">{error}</div>}{success && <div className="form-success" role="status"><Check size={15} />{success}</div>}
        <label>Nome completo<input required minLength="2" value={form.nome} onChange={(event) => setForm({ ...form, nome: event.target.value })} placeholder="Seu nome" /></label>
        <label>E-mail<input type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="voce@email.com" /></label>
        <label>Senha<input type="password" required minLength="8" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Mínimo de 8 caracteres" /></label>
        <label>Confirme sua senha<input type="password" required value={form.confirm} onChange={(event) => setForm({ ...form, confirm: event.target.value })} placeholder="Digite novamente" /></label>
        <button className="button button-dark button-full" disabled={loading}>{loading ? 'Criando conta...' : 'Criar conta'} <ArrowRight size={16} /></button>
        <p className="auth-bottom">Já tem uma conta? <Link to="/login">Entrar</Link></p>
      </form></div>
    </div>
  );
}

export function AccessDeniedPage() {
  return <div className="page-wrap not-found"><span className="eyebrow">403 · Acesso negado</span><h1>Essa área é reservada.</h1><p>Seu perfil não tem permissão para visualizar esta página.</p><Link to="/" className="button button-dark">Voltar para a vitrine</Link></div>;
}
