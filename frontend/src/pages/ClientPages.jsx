import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, FileSignature, Heart, House, Plus, Send, Sparkles } from 'lucide-react';
import { api } from '../api';
import {
  EmptyState, ErrorState, formatPrice, LoadingState, PageTitle, propertyAvailable,
  propertyImage, propertyPrice, propertyPurpose, StatusPill,
} from '../components';

function message(error) {
  return error?.message || 'Não foi possível carregar as informações. Tente novamente.';
}

function normalizeStatus(status) {
  return String(status || '').trim().toLowerCase().replaceAll(' ', '_');
}

function TableState({ loading, error, empty, retry }) {
  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={retry} />;
  if (empty) return <EmptyState title={empty.title} description={empty.description} />;
  return null;
}

export function ClientHomePage() {
  const [offerCount, setOfferCount] = useState(null);
  const [favoriteCount, setFavoriteCount] = useState(null);
  const [contractCount, setContractCount] = useState(null);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setErrors([]);
    const endpoints = ['/ofertas/minhas', '/favoritos', '/contratos/minhas'];
    const results = await Promise.allSettled(endpoints.map((path) => api.get(path)));
    setOfferCount(results[0].status === 'fulfilled' && Array.isArray(results[0].value) ? results[0].value.length : null);
    setFavoriteCount(results[1].status === 'fulfilled' && Array.isArray(results[1].value) ? results[1].value.length : null);
    setContractCount(results[2].status === 'fulfilled' && Array.isArray(results[2].value) ? results[2].value.length : null);
    setErrors(results.filter((result) => result.status === 'rejected').map((result) => message(result.reason)));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);
  const cards = [
    { title: 'Minhas ofertas', count: offerCount, label: 'propostas enviadas', path: '/cliente/ofertas', icon: Send },
    { title: 'Favoritos', count: favoriteCount, label: 'imóveis salvos', path: '/cliente/favoritos', icon: Heart },
    { title: 'Contratos', count: contractCount, label: 'documentos', path: '/cliente/contratos', icon: FileSignature },
  ];

  return (
    <div className="page-wrap dashboard-page">
      <PageTitle eyebrow="ÁREA DO CLIENTE" title="Olá, que bom ter você por aqui." description="Acompanhe seus próximos passos e continue sua busca no seu ritmo." />
      {errors.length > 0 && <div className="notice-box notice-warning">Algumas informações ainda não estão disponíveis na API: {errors[0]}</div>}
      {loading ? <LoadingState label="Carregando seu espaço..." /> : (
        <div className="metric-grid client-metrics">{cards.map(({ title, count, label, path, icon: Icon }) => (
          <Link to={path} className="metric-card" key={title}><span className="metric-icon"><Icon size={20} /></span><span className="metric-label">{title}</span><strong>{count ?? '—'}</strong><span className="metric-caption">{count === null ? 'Indisponível na API' : label}</span><span className="metric-link">Acessar <ArrowRight size={14} /></span></Link>
        ))}</div>
      )}
      <section className="dashboard-cta"><div className="cta-icon"><Sparkles size={20} /></div><div><span className="eyebrow">TEM UM LUGAR NOVO TE ESPERANDO</span><h2>Vamos continuar procurando?</h2><p>Explore a seleção atual e salve os imóveis que combinam com você.</p></div><Link to="/" className="button button-dark">Ver imóveis <ArrowRight size={16} /></Link></section>
    </div>
  );
}

export function ClientOffersPage() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const result = await api.get('/ofertas/minhas');
      setOffers(Array.isArray(result) ? result : []);
    } catch (requestError) { setError(message(requestError)); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);
  const filtered = statusFilter ? offers.filter((offer) => normalizeStatus(offer.status) === statusFilter) : offers;

  return (
    <div className="page-wrap dashboard-page">
      <PageTitle eyebrow="ÁREA DO CLIENTE · PROPOSTAS" title="Minhas ofertas" description="Acompanhe cada proposta e saiba o que vem a seguir." action={<Link to="/" className="button button-dark"><Plus size={16} /> Encontrar imóvel</Link>} />
      <div className="table-toolbar"><span>{offers.length} {offers.length === 1 ? 'oferta' : 'ofertas'}</span><label className="compact-select">Situação <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">Todas</option><option value="pendente">Pendente</option><option value="aceita">Aceita</option><option value="em_espera">Em espera</option><option value="recusada">Recusada</option><option value="cancelada">Cancelada</option></select></label></div>
      {loading || error || filtered.length === 0 ? <TableState loading={loading} error={error} retry={load} empty={{ title: 'Você ainda não enviou ofertas', description: 'Quando fizer uma proposta, ela aparecerá aqui com a situação atualizada.' }} /> : (
        <div className="table-wrap"><table><thead><tr><th>Imóvel</th><th>Tipo</th><th>Valor proposto</th><th>Enviada em</th><th>Situação</th></tr></thead><tbody>
          {filtered.map((offer) => <tr key={offer.id}><td><Link className="table-primary" to={`/imoveis/${offer.imovel?.id || offer.imovelId}`}>{offer.imovel?.titulo || `Imóvel #${offer.imovel?.id || offer.imovelId || '—'}`}</Link><span className="table-secondary">{offer.imovel?.bairro?.nome || '—'}</span></td><td>{offer.tipo || '—'}</td><td>{formatPrice(offer.valorProposto)}</td><td>{offer.dataCriacao ? new Date(offer.dataCriacao).toLocaleDateString('pt-BR') : '—'}</td><td><StatusPill value={offer.status} /></td></tr>)}
        </tbody></table></div>
      )}
    </div>
  );
}

export function NewOfferPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [form, setForm] = useState({ imovelId: searchParams.get('imovel') || '', tipo: '', valorProposto: '', mensagem: '' });
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api.get('/imovel').then((result) => setProperties(Array.isArray(result) ? result.filter(propertyAvailable) : []))
      .catch((requestError) => setLoadError(message(requestError)))
      .finally(() => setLoading(false));
  }, []);

  const selected = properties.find((property) => String(property.id) === String(form.imovelId));
  const allowedPurpose = String(selected?.finalidade || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const canRent = !allowedPurpose || allowedPurpose.includes('alug') || allowedPurpose.includes('loca') || allowedPurpose.includes('amb');
  const canBuy = !allowedPurpose || allowedPurpose.includes('vend') || allowedPurpose.includes('compra') || allowedPurpose.includes('amb');

  async function submit(event) {
    event.preventDefault();
    setError('');
    if (!selected) { setError('Selecione um imóvel disponível para fazer uma oferta.'); return; }
    if (form.tipo === 'aluguel' && !canRent || form.tipo === 'venda' && !canBuy) { setError('O tipo de oferta não corresponde à finalidade do imóvel.'); return; }
    if (Number(form.valorProposto) <= 0) { setError('Informe um valor maior que zero.'); return; }
    setSending(true);
    try {
      await api.post('/ofertas', {
        imovelId: Number(form.imovelId),
        tipo: form.tipo,
        valorProposto: Number(form.valorProposto),
        mensagem: form.mensagem.trim(),
      });
      navigate('/cliente/ofertas', { replace: true });
    } catch (requestError) { setError(message(requestError)); }
    finally { setSending(false); }
  }

  return (
    <div className="page-wrap dashboard-page form-page">
      <PageTitle eyebrow="ÁREA DO CLIENTE · NOVA PROPOSTA" title="Fazer uma oferta" description="Conte à imobiliária como você imagina este próximo passo." />
      {loading ? <LoadingState label="Buscando imóveis disponíveis..." /> : loadError ? <ErrorState message={loadError} /> : properties.length === 0 ? <EmptyState title="Nenhum imóvel disponível" description="No momento, não há imóveis aptos a receber ofertas." icon={House} /> : (
        <form className="form-card" onSubmit={submit}>
          <label>Imóvel disponível<select required value={form.imovelId} onChange={(event) => setForm({ ...form, imovelId: event.target.value })}><option value="">Selecione um imóvel</option>{properties.map((property) => <option key={property.id} value={property.id}>{property.titulo} · {property.bairro?.nome || 'Localização a consultar'} · {formatPrice(propertyPrice(property))}</option>)}</select></label>
          {selected && <div className="selected-property"><img src={propertyImage(selected)} alt="" /><div><strong>{selected.titulo}</strong><span>{selected.bairro?.nome || 'Localização a consultar'} · {propertyPurpose(selected)}</span></div><strong>{formatPrice(propertyPrice(selected))}</strong></div>}
          <fieldset className="offer-type-fieldset">
            <legend>Tipo da oferta <span>*</span></legend>
            <div className="offer-type-options">
              <label className={`offer-type-option${form.tipo === 'aluguel' ? ' offer-type-selected' : ''}${!canRent ? ' offer-type-disabled' : ''}`}>
                <input type="radio" name="tipoOferta" value="aluguel" required checked={form.tipo === 'aluguel'} disabled={!canRent} onChange={(event) => setForm({ ...form, tipo: event.target.value })} />
                <span><strong>Aluguel</strong><small>Proposta para locação</small></span>
              </label>
              <label className={`offer-type-option${form.tipo === 'venda' ? ' offer-type-selected' : ''}${!canBuy ? ' offer-type-disabled' : ''}`}>
                <input type="radio" name="tipoOferta" value="venda" required checked={form.tipo === 'venda'} disabled={!canBuy} onChange={(event) => setForm({ ...form, tipo: event.target.value })} />
                <span><strong>Compra</strong><small>Proposta de compra</small></span>
              </label>
            </div>
            <small className="offer-type-hint">{selected ? `Finalidade deste imóvel: ${propertyPurpose(selected)}.` : 'Selecione aluguel ou compra para identificar sua proposta.'}</small>
          </fieldset>
          <label>Valor proposto (R$)<input type="number" min="0.01" step="0.01" required value={form.valorProposto} onChange={(event) => setForm({ ...form, valorProposto: event.target.value })} placeholder="Ex.: 2.500,00" /></label>
          <label>Mensagem para a imobiliária<textarea rows="5" maxLength="1000" value={form.mensagem} onChange={(event) => setForm({ ...form, mensagem: event.target.value })} placeholder="Apresente sua proposta ou compartilhe alguma informação importante." /></label>
          <div className="form-hint">Sua proposta será analisada pela imobiliária. Você poderá acompanhar a situação nesta área.</div>
          {error && <div className="form-error-box" role="alert">{error}</div>}
          <div className="form-actions"><Link to="/cliente/ofertas" className="button button-outline">Cancelar</Link><button className="button button-dark" disabled={sending}>{sending ? 'Enviando...' : 'Enviar oferta'} <ArrowRight size={16} /></button></div>
        </form>
      )}
    </div>
  );
}

export function FavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const result = await api.get('/favoritos');
      setFavorites(Array.isArray(result) ? result : []);
    } catch (requestError) { setError(message(requestError)); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function remove(favorite) {
    setActionError('');
    try {
      await api.delete(`/favoritos/${favorite.id}`);
      setFavorites((current) => current.filter((item) => item.id !== favorite.id));
    } catch (requestError) { setActionError(message(requestError)); }
  }
  const propertyList = useMemo(() => favorites.map((favorite) => favorite.imovel || favorite), [favorites]);

  return (
    <div className="page-wrap dashboard-page">
      <PageTitle eyebrow="ÁREA DO CLIENTE · SUA SELEÇÃO" title="Imóveis favoritos" description="Os lugares que chamaram sua atenção, reunidos em um só espaço." action={<Link to="/" className="button button-dark"><House size={16} /> Explorar imóveis</Link>} />
      {actionError && <div className="form-error-box" role="alert">{actionError}</div>}
      {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={load} /> : propertyList.length === 0 ? <EmptyState title="Sua lista está esperando por você" description="Salve os imóveis que gostar e volte para comparar com calma." icon={Heart} /> : (
        <div className="property-grid">{propertyList.map((property, index) => {
          const favorite = favorites.find((item) => (item.imovel?.id || item.imovelId || item.id) === property.id) || favorites[index];
          return <div key={favorite.id} className="favorite-card-wrap"><PropertyCard property={property} index={index} /><button className="favorite-remove" onClick={() => remove(favorite)}><Heart size={14} fill="currentColor" /> Remover</button></div>;
        })}</div>
      )}
    </div>
  );
}

export function ClientContractsPage() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [signingId, setSigningId] = useState(null);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const result = await api.get('/contratos/minhas');
      setContracts(Array.isArray(result) ? result : []);
    } catch (requestError) { setError(message(requestError)); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function sign(contract) {
    if (!window.confirm('Confirma que deseja assinar este contrato?')) return;
    setSigningId(contract.id);
    setActionError('');
    try {
      await api.post(`/contratos/${contract.id}/assinar`);
      await load();
    } catch (requestError) { setActionError(message(requestError)); }
    finally { setSigningId(null); }
  }

  return (
    <div className="page-wrap dashboard-page">
      <PageTitle eyebrow="ÁREA DO CLIENTE · DOCUMENTOS" title="Meus contratos" description="Acompanhe os documentos e conclua sua assinatura com segurança." />
      {actionError && <div className="form-error-box" role="alert">{actionError}</div>}
      {loading || error || contracts.length === 0 ? <TableState loading={loading} error={error} retry={load} empty={{ title: 'Nenhum contrato por enquanto', description: 'Quando uma oferta for aceita, o contrato aparecerá aqui.' }} /> : (
        <div className="table-wrap"><table><thead><tr><th>Imóvel</th><th>Criado em</th><th>Assinatura</th><th>Situação</th><th>Ação</th></tr></thead><tbody>
          {contracts.map((contract) => <tr key={contract.id}><td><span className="table-primary">{contract.oferta?.imovel?.titulo || `Contrato #${contract.id}`}</span><span className="table-secondary">Oferta #{contract.oferta?.id || contract.ofertaId || '—'}</span></td><td>{contract.dataAprovacao ? new Date(contract.dataAprovacao).toLocaleDateString('pt-BR') : '—'}</td><td>{contract.dataAssinatura ? new Date(contract.dataAssinatura).toLocaleDateString('pt-BR') : 'Pendente'}</td><td><StatusPill value={contract.status} /></td><td>{String(contract.status).toLowerCase().includes('aguardando') ? <button className="button button-dark button-small" disabled={signingId === contract.id} onClick={() => sign(contract)}>{signingId === contract.id ? 'Assinando...' : 'Assinar contrato'}</button> : <span className="table-secondary">—</span>}</td></tr>)}
        </tbody></table></div>
      )}
    </div>
  );
}
