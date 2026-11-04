import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
  ArrowDown, ArrowRight, ArrowUpRight, Building2, Check, Download, FileSignature,
  Home, Image, MapPin, Pencil, Plus, Search, ShieldCheck, Trash2, Users, X,
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../auth';
import {
  EmptyState, ErrorState, formatPrice, LoadingState, PageTitle, propertyAvailable,
  propertyPrice, propertyPurpose, StatusPill,
} from '../components';

const adminNav = [
  { to: '/admin', label: 'Visão geral', icon: Home, end: true },
  { to: '/admin/imoveis', label: 'Imóveis', icon: Building2 },
  { to: '/admin/bairros', label: 'Bairros', icon: MapPin },
  { to: '/admin/tipos', label: 'Tipos de imóvel', icon: Building2 },
  { to: '/admin/fotos', label: 'Fotos', icon: Image },
  { to: '/admin/usuarios', label: 'Usuários', icon: Users },
  { to: '/admin/ofertas', label: 'Ofertas', icon: ArrowUpRight },
  { to: '/admin/contratos', label: 'Contratos', icon: FileSignature },
];

function AdminNavigation() {
  return <nav className="admin-subnav">{adminNav.map(({ to, label, icon: Icon, end }) => <NavLink end={end} key={to} to={to} className={({ isActive }) => `admin-subnav-link${isActive ? ' admin-subnav-active' : ''}`}><Icon size={15} />{label}</NavLink>)}</nav>;
}

function AdminPage({ children }) {
  return <div className="page-wrap admin-page"><AdminNavigation />{children}</div>;
}

function apiMessage(error) {
  return error?.message || 'Não foi possível carregar as informações. Tente novamente.';
}

function normalizeStatus(status) {
  return String(status || '').trim().toLowerCase().replaceAll(' ', '_');
}

function MetricCard({ title, value, caption, icon: Icon, tone }) {
  return <article className={`metric-card metric-${tone || 'green'}`}><span className="metric-icon"><Icon size={20} /></span><span className="metric-label">{title}</span><strong>{value ?? '—'}</strong><span className="metric-caption">{caption}</span></article>;
}

function MiniBars({ title, data, emptyLabel }) {
  const max = Math.max(1, ...data.map((item) => item.value));
  return <section className="chart-card"><div className="chart-heading"><div><span className="eyebrow">DADOS DA OPERAÇÃO</span><h3>{title}</h3></div><ArrowUpRight size={17} /></div>
    {!data.length ? <div className="chart-empty">{emptyLabel}</div> : <div className="bar-chart">{data.slice(0, 6).map((item) => <div className="bar-row" key={item.label}><span>{item.label}</span><div className="bar-track"><i style={{ width: `${Math.max(4, item.value / max * 100)}%` }} /></div><b>{item.value}</b></div>)}</div>}
  </section>;
}

export function AdminHomePage() {
  const [data, setData] = useState({ properties: [], offers: null, contracts: null });
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const results = await Promise.allSettled([api.get('/imovel'), api.get('/ofertas'), api.get('/contratos')]);
    setData({
      properties: results[0].status === 'fulfilled' && Array.isArray(results[0].value) ? results[0].value : [],
      offers: results[1].status === 'fulfilled' && Array.isArray(results[1].value) ? results[1].value : null,
      contracts: results[2].status === 'fulfilled' && Array.isArray(results[2].value) ? results[2].value : null,
    });
    setErrors(results.filter((result) => result.status === 'rejected').map((result) => apiMessage(result.reason)));
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const byNeighborhood = useMemo(() => {
    const counts = new Map();
    data.properties.forEach((property) => {
      const name = property.bairro?.nome || 'Sem bairro';
      counts.set(name, (counts.get(name) || 0) + 1);
    });
    return [...counts].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  }, [data.properties]);
  const byPurpose = useMemo(() => {
    const counts = new Map();
    data.properties.forEach((property) => {
      const name = propertyPurpose(property);
      counts.set(name, (counts.get(name) || 0) + 1);
    });
    return [...counts].map(([label, value]) => ({ label, value }));
  }, [data.properties]);
  const byOfferStatus = useMemo(() => {
    const counts = new Map();
    data.offers?.forEach((offer) => {
      const name = offer.status || 'Sem situação';
      counts.set(name, (counts.get(name) || 0) + 1);
    });
    return [...counts].map(([label, value]) => ({ label, value }));
  }, [data.offers]);
  const pendingOffers = data.offers?.filter((offer) => normalizeStatus(offer.status) === 'pendente').length;
  const waitingContracts = data.contracts?.filter((contract) => String(contract.status).toLowerCase().includes('aguardando')).length;

  return <AdminPage>
    <PageTitle eyebrow="PAINEL ADMINISTRATIVO" title="Visão geral" description="Um resumo do que está acontecendo na Schneider Imóveis." action={<button className="button button-outline button-small" onClick={load}>Atualizar <ArrowRight size={14} /></button>} />
    {errors.length > 0 && <div className="notice-box notice-warning">Parte dos indicadores depende dos endpoints de ofertas e contratos, ainda não disponíveis: {errors.find((item) => item.includes('A API') || item.includes('serviço')) || errors[0]}</div>}
    {loading ? <LoadingState label="Carregando indicadores..." /> : <>
      <div className="metric-grid">
        <MetricCard title="Imóveis disponíveis" value={data.properties.filter(propertyAvailable).length} caption="Prontos para receber ofertas" icon={Building2} tone="green" />
        <MetricCard title="Ofertas pendentes" value={pendingOffers} caption={pendingOffers === null ? 'Recurso indisponível na API' : 'Aguardando análise'} icon={ArrowUpRight} tone="amber" />
        <MetricCard title="Contratos aguardando" value={waitingContracts} caption={waitingContracts === null ? 'Recurso indisponível na API' : 'Aguardando assinatura'} icon={FileSignature} tone="blue" />
        <MetricCard title="Total de imóveis" value={data.properties.length} caption="Em toda a carteira" icon={Home} tone="peach" />
      </div>
      <div className="charts-grid">
        <MiniBars title="Imóveis por bairro" data={byNeighborhood} emptyLabel="Nenhum imóvel cadastrado ainda." />
        <MiniBars title="Ofertas por situação" data={byOfferStatus} emptyLabel={data.offers === null ? 'Indicador disponível quando a API de ofertas for implementada.' : 'Nenhuma oferta cadastrada.'} />
        <MiniBars title="Imóveis por finalidade" data={byPurpose} emptyLabel="Nenhum imóvel cadastrado ainda." />
      </div>
      <div className="dashboard-cta admin-cta"><div className="cta-icon"><ShieldCheck size={19} /></div><div><span className="eyebrow">CENTRAL DE OPERAÇÕES</span><h2>Deixe a gestão fluir.</h2><p>Acesse os cadastros e mantenha tudo em dia.</p></div><Link to="/admin/imoveis" className="button button-dark">Gerenciar imóveis <ArrowRight size={16} /></Link></div>
    </>}
  </AdminPage>;
}

function CatalogCrud({ title, description, endpoint, fields, columns, itemName }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const initialForm = Object.fromEntries(fields.map((field) => [field.name, '']));
  const [form, setForm] = useState(initialForm);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const result = await api.get(endpoint);
      setItems(Array.isArray(result) ? result : []);
    } catch (requestError) { setError(apiMessage(requestError)); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [endpoint]);

  function startCreate() {
    setEditing(null);
    setForm({ ...initialForm });
    setActionError('');
    setFormOpen(true);
  }
  function startEdit(item) {
    setEditing(item);
    setForm(Object.fromEntries(fields.map((field) => [field.name, item[field.name] ?? ''])));
    setActionError('');
    setFormOpen(true);
  }
  async function save(event) {
    event.preventDefault();
    setActionError('');
    const payload = Object.fromEntries(fields.map((field) => {
      const value = form[field.name];
      return [field.name, field.type === 'number' && value !== '' ? Number(value) : String(value).trim()];
    }));
    try {
      if (editing) await api.put(`${endpoint}/${editing.id}`, { ...editing, ...payload });
      else await api.post(endpoint, payload);
      setFormOpen(false);
      await load();
    } catch (requestError) { setActionError(apiMessage(requestError)); }
  }
  async function remove(item) {
    if (!window.confirm(`Tem certeza que deseja excluir ${itemName} "${item.nome}"? Esta ação não pode ser desfeita.`)) return;
    setActionError('');
    try {
      await api.delete(`${endpoint}/${item.id}`);
      setItems((current) => current.filter((entry) => entry.id !== item.id));
    } catch (requestError) { setActionError(apiMessage(requestError)); }
  }

  return <AdminPage>
    <PageTitle eyebrow="CADASTROS · ADMIN" title={title} description={description} action={<button className="button button-dark" onClick={startCreate}><Plus size={16} /> Adicionar {itemName}</button>} />
    {actionError && <div className="form-error-box" role="alert">{actionError}</div>}
    {formOpen && <form className="catalog-form" onSubmit={save}><div className="catalog-form-head"><div><span className="eyebrow">{editing ? 'EDITAR CADASTRO' : 'NOVO CADASTRO'}</span><h3>{editing ? `Editar ${itemName}` : `Adicionar ${itemName}`}</h3></div><button type="button" className="icon-button" aria-label="Fechar" onClick={() => setFormOpen(false)}><X size={18} /></button></div><div className="form-grid">{fields.map((field) => <label key={field.name} className={field.full ? 'field-full' : ''}>{field.label}<input required={field.required !== false} type={field.type || 'text'} min={field.type === 'number' ? '0' : undefined} step={field.type === 'number' ? 'any' : undefined} value={form[field.name]} onChange={(event) => setForm({ ...form, [field.name]: event.target.value })} placeholder={field.placeholder || ''} /></label>)}</div>{actionError && <div className="form-error-box">{actionError}</div>}<div className="form-actions"><button type="button" className="button button-outline" onClick={() => setFormOpen(false)}>Cancelar</button><button className="button button-dark"><Check size={15} /> Salvar cadastro</button></div></form>}
    <div className="table-toolbar"><span>{items.length} {itemName}{items.length !== 1 ? 's' : ''}</span></div>
    {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={load} /> : items.length === 0 ? <EmptyState title={`Nenhum ${itemName} cadastrado`} description={`Adicione o primeiro ${itemName} para organizar seus imóveis.`} /> : <div className="table-wrap"><table><thead><tr>{columns.map((column) => <th key={column.label}>{column.label}</th>)}<th className="actions-heading">Ações</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}>{columns.map((column) => <td key={column.label}>{column.render ? column.render(item) : item[column.key] || '—'}</td>)}<td><div className="table-actions"><button className="icon-button" title="Editar" onClick={() => startEdit(item)}><Pencil size={15} /></button><button className="icon-button icon-danger" title="Excluir" onClick={() => remove(item)}><Trash2 size={15} /></button></div></td></tr>)}</tbody></table></div>}
  </AdminPage>;
}

export function AdminNeighborhoodsPage() {
  return <CatalogCrud title="Bairros" description="Organize as regiões disponíveis para os imóveis." endpoint="/bairros" itemName="bairro" fields={[
    { name: 'nome', label: 'Nome do bairro' }, { name: 'cidade', label: 'Cidade' }, { name: 'estado', label: 'Estado', placeholder: 'RS' },
    { name: 'cepInicial', label: 'CEP inicial', required: false }, { name: 'cepFinal', label: 'CEP final', required: false },
  ]} columns={[{ label: 'Bairro', key: 'nome' }, { label: 'Cidade', key: 'cidade' }, { label: 'Estado', key: 'estado' }, { label: 'Faixa de CEP', render: (item) => [item.cepInicial, item.cepFinal].filter(Boolean).join(' — ') || '—' }]} />;
}

export function AdminTypesPage() {
  return <CatalogCrud title="Tipos de imóvel" description="Cadastre as categorias usadas para descrever cada espaço." endpoint="/tipos-imoveis" itemName="tipo" fields={[
    { name: 'nome', label: 'Nome do tipo' }, { name: 'descricao', label: 'Descrição', required: false, full: true },
  ]} columns={[{ label: 'Tipo', key: 'nome' }, { label: 'Descrição', key: 'descricao' }, { label: 'Criado em', render: (item) => item.createdAt ? new Date(item.createdAt).toLocaleDateString('pt-BR') : '—' }]} />;
}

const propertyInitial = {
  titulo: '', descricao: '', finalidade: 'venda', status: 'disponivel', precoVenda: '', precoAluguel: '',
  dormitorios: '', banheiros: '', garagem: '', areaTotal: '', areaConstruida: '', endereco: '', numero: '',
  complemento: '', cep: '', caracteristicas: '', destaque: false, bairroId: '', tipoId: '',
};

function PropertyForm({ initial, neighborhoods, types, onSave, onCancel, busy, error }) {
  const [form, setForm] = useState({ ...propertyInitial, ...initial });
  const field = (name, value) => setForm((current) => ({ ...current, [name]: value }));
  function submit(event) {
    event.preventDefault();
    onSave({
      titulo: form.titulo.trim(), descricao: form.descricao.trim(), finalidade: form.finalidade,
      status: form.status, precoVenda: form.precoVenda ? Number(form.precoVenda) : null,
      precoAluguel: form.precoAluguel ? Number(form.precoAluguel) : null,
      dormitorios: form.dormitorios ? Number(form.dormitorios) : null,
      banheiros: form.banheiros ? Number(form.banheiros) : null,
      garagem: form.garagem ? Number(form.garagem) : null,
      areaTotal: form.areaTotal ? Number(form.areaTotal) : null,
      areaConstruida: form.areaConstruida ? Number(form.areaConstruida) : null,
      endereco: form.endereco.trim(), numero: form.numero.trim(), complemento: form.complemento.trim(),
      cep: form.cep.trim(), caracteristicas: form.caracteristicas.trim(), destaque: Boolean(form.destaque),
      bairro: { id: Number(form.bairroId) }, tipoImovel: { id: Number(form.tipoId) },
    });
  }
  return <form className="catalog-form" onSubmit={submit}><div className="catalog-form-head"><div><span className="eyebrow">{initial?.id ? 'EDITAR IMÓVEL' : 'NOVO CADASTRO'}</span><h3>{initial?.id ? 'Atualizar imóvel' : 'Adicionar imóvel'}</h3></div><button type="button" className="icon-button" onClick={onCancel} aria-label="Fechar"><X size={18} /></button></div>
    <div className="form-grid">
      <label className="field-full">Título<input required value={form.titulo} onChange={(event) => field('titulo', event.target.value)} /></label>
      <label>Tipo de imóvel<select required value={form.tipoId} onChange={(event) => field('tipoId', event.target.value)}><option value="">Selecione</option>{types.map((type) => <option key={type.id} value={type.id}>{type.nome}</option>)}</select></label>
      <label>Bairro<select required value={form.bairroId} onChange={(event) => field('bairroId', event.target.value)}><option value="">Selecione</option>{neighborhoods.map((bairro) => <option key={bairro.id} value={bairro.id}>{bairro.nome} · {bairro.cidade}</option>)}</select></label>
      <label>Finalidade<select value={form.finalidade} onChange={(event) => field('finalidade', event.target.value)}><option value="venda">Venda</option><option value="aluguel">Aluguel</option><option value="ambos">Venda e aluguel</option></select></label>
      <label>Situação<select value={form.status} onChange={(event) => field('status', event.target.value)}><option value="disponivel">Disponível</option><option value="reservado">Reservado</option><option value="alugado">Alugado</option><option value="vendido">Vendido</option></select></label>
      <label>Valor de venda (R$)<input type="number" min="0" step="0.01" value={form.precoVenda} onChange={(event) => field('precoVenda', event.target.value)} /></label>
      <label>Valor do aluguel (R$)<input type="number" min="0" step="0.01" value={form.precoAluguel} onChange={(event) => field('precoAluguel', event.target.value)} /></label>
      <label>Quartos<input type="number" min="0" value={form.dormitorios} onChange={(event) => field('dormitorios', event.target.value)} /></label>
      <label>Banheiros<input type="number" min="0" value={form.banheiros} onChange={(event) => field('banheiros', event.target.value)} /></label>
      <label>Vagas na garagem<input type="number" min="0" value={form.garagem} onChange={(event) => field('garagem', event.target.value)} /></label>
      <label>Área total (m²)<input type="number" min="0" step="0.01" value={form.areaTotal} onChange={(event) => field('areaTotal', event.target.value)} /></label>
      <label>Área construída (m²)<input type="number" min="0" step="0.01" value={form.areaConstruida} onChange={(event) => field('areaConstruida', event.target.value)} /></label>
      <label>Endereço<input value={form.endereco} onChange={(event) => field('endereco', event.target.value)} /></label>
      <label>Número<input value={form.numero} onChange={(event) => field('numero', event.target.value)} /></label>
      <label>CEP<input value={form.cep} onChange={(event) => field('cep', event.target.value)} /></label>
      <label className="field-full">Complemento<input value={form.complemento} onChange={(event) => field('complemento', event.target.value)} /></label>
      <label className="field-full">Descrição<textarea rows="3" value={form.descricao} onChange={(event) => field('descricao', event.target.value)} /></label>
      <label className="field-full">Características<textarea rows="3" value={form.caracteristicas} onChange={(event) => field('caracteristicas', event.target.value)} /></label>
      <label className="checkbox-field field-full"><input type="checkbox" checked={Boolean(form.destaque)} onChange={(event) => field('destaque', event.target.checked)} /> Destacar na vitrine</label>
    </div>
    {error && <div className="form-error-box">{error}</div>}<div className="form-actions"><button type="button" className="button button-outline" onClick={onCancel}>Cancelar</button><button className="button button-dark" disabled={busy}>{busy ? 'Salvando...' : 'Salvar imóvel'} <Check size={15} /></button></div>
  </form>;
}

export function AdminPropertiesPage() {
  const [properties, setProperties] = useState([]);
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [propertyData, neighborhoodData, typeData] = await Promise.all([api.get('/imovel'), api.get('/bairros'), api.get('/tipos-imoveis')]);
      setProperties(Array.isArray(propertyData) ? propertyData : []);
      setNeighborhoods(Array.isArray(neighborhoodData) ? neighborhoodData : []);
      setTypes(Array.isArray(typeData) ? typeData : []);
    } catch (requestError) { setError(apiMessage(requestError)); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  const filtered = properties.filter((property) => `${property.titulo} ${property.bairro?.nome} ${property.id}`.toLowerCase().includes(query.toLowerCase()));
  function startEdit(property) {
    setEditing({
      ...property, bairroId: property.bairro?.id || '', tipoId: property.tipoImovel?.id || '',
    });
    setFormOpen(true);
    setActionError('');
  }
  async function save(payload) {
    setBusy(true);
    setActionError('');
    try {
      if (editing) await api.put(`/imovel/${editing.id}`, { ...editing, ...payload, id: editing.id });
      else await api.post('/imovel', payload);
      setFormOpen(false);
      setEditing(null);
      await load();
    } catch (requestError) { setActionError(apiMessage(requestError)); }
    finally { setBusy(false); }
  }
  async function remove(property) {
    if (!window.confirm(`Excluir "${property.titulo || `imóvel #${property.id}`}"? Esta ação não pode ser desfeita.`)) return;
    setActionError('');
    try { await api.delete(`/imovel/${property.id}`); setProperties((items) => items.filter((item) => item.id !== property.id)); }
    catch (requestError) { setActionError(apiMessage(requestError)); }
  }
  return <AdminPage>
    <PageTitle eyebrow="CADASTROS · ADMIN" title="Imóveis" description="Gerencie os espaços publicados na vitrine." action={<button className="button button-dark" onClick={() => { setEditing(null); setActionError(''); setFormOpen(true); }}><Plus size={16} /> Novo imóvel</button>} />
    {actionError && <div className="form-error-box" role="alert">{actionError}</div>}
    {formOpen && <PropertyForm key={editing?.id || 'new'} initial={editing} neighborhoods={neighborhoods} types={types} onSave={save} onCancel={() => { setFormOpen(false); setEditing(null); }} busy={busy} error={actionError} />}
    <div className="table-toolbar"><span>{properties.length} imóveis</span><label className="table-search"><Search size={16} /><input placeholder="Buscar por imóvel ou bairro" value={query} onChange={(event) => setQuery(event.target.value)} /></label></div>
    {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={load} /> : filtered.length === 0 ? <EmptyState title={query ? 'Nenhum resultado' : 'Nenhum imóvel cadastrado'} description={query ? 'Tente outra busca.' : 'Adicione o primeiro imóvel da carteira.'} /> : <div className="table-wrap"><table><thead><tr><th>Imóvel</th><th>Bairro</th><th>Finalidade</th><th>Valor</th><th>Situação</th><th className="actions-heading">Ações</th></tr></thead><tbody>{filtered.map((property) => <tr key={property.id}><td><span className="table-primary">{property.titulo || `Imóvel #${property.id}`}</span><span className="table-secondary">Código #{property.id}</span></td><td>{property.bairro?.nome || '—'}</td><td>{propertyPurpose(property)}</td><td>{formatPrice(propertyPrice(property))}</td><td><StatusPill value={property.status} /></td><td><div className="table-actions"><button className="icon-button" title="Editar" onClick={() => startEdit(property)}><Pencil size={15} /></button><button className="icon-button icon-danger" title="Excluir" onClick={() => remove(property)}><Trash2 size={15} /></button></div></td></tr>)}</tbody></table></div>}
  </AdminPage>;
}

export function AdminPhotosPage() {
  const [properties, setProperties] = useState([]);
  const [propertyId, setPropertyId] = useState('');
  const [photos, setPhotos] = useState([]);
  const [file, setFile] = useState(null);
  const [editingPhoto, setEditingPhoto] = useState(null);
  const [editFile, setEditFile] = useState(null);
  const [editOrder, setEditOrder] = useState('');
  const [loading, setLoading] = useState(true);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get('/imovel').then((result) => {
      const list = Array.isArray(result) ? result : [];
      setProperties(list);
      if (list.length) setPropertyId(String(list[0].id));
    }).catch((requestError) => setError(apiMessage(requestError))).finally(() => setLoading(false));
  }, []);

  async function loadPhotos(id = propertyId) {
    if (!id) { setPhotos([]); return; }
    setPhotosLoading(true);
    setError('');
    try {
      const result = await api.get(`/fotos?imovelId=${encodeURIComponent(id)}`);
      setPhotos(Array.isArray(result) ? result : []);
    } catch (requestError) { setError(apiMessage(requestError)); }
    finally { setPhotosLoading(false); }
  }
  useEffect(() => { if (propertyId) loadPhotos(propertyId); }, [propertyId]);

  async function upload(event) {
    event.preventDefault();
    if (!file || !propertyId) return;
    setBusy(true);
    setActionError('');
    const formData = new FormData();
    formData.append('arquivo', file);
    formData.append('imovelId', propertyId);
    try {
      await api.upload('/fotos', formData);
      setFile(null);
      event.target.reset();
      await loadPhotos();
    } catch (requestError) { setActionError(apiMessage(requestError)); }
    finally { setBusy(false); }
  }
  async function markCover(photo) {
    setActionError('');
    try {
      await api.put(`/fotos/${photo.id}/capa`);
      await loadPhotos();
    } catch (requestError) { setActionError(apiMessage(requestError)); }
  }
  async function updatePhoto(event) {
    event.preventDefault();
    if (!editingPhoto) return;
    setBusy(true);
    setActionError('');
    const formData = new FormData();
    if (editFile) formData.append('arquivo', editFile);
    if (editOrder !== '') formData.append('ordem', editOrder);
    try {
      await api.upload(`/fotos/${editingPhoto.id}`, formData, 'PUT');
      setEditingPhoto(null);
      setEditFile(null);
      setEditOrder('');
      await loadPhotos();
    } catch (requestError) { setActionError(apiMessage(requestError)); }
    finally { setBusy(false); }
  }
  async function remove(photo) {
    if (!window.confirm('Deseja excluir esta foto? Esta ação não pode ser desfeita.')) return;
    setActionError('');
    try { await api.delete(`/fotos/${photo.id}`); setPhotos((items) => items.filter((item) => item.id !== photo.id)); }
    catch (requestError) { setActionError(apiMessage(requestError)); }
  }

  return <AdminPage>
    <PageTitle eyebrow="CONTEÚDO · ADMIN" title="Fotos dos imóveis" description="Adicione imagens e escolha a foto de capa de cada imóvel." />
    {loading ? <LoadingState /> : error && properties.length === 0 ? <ErrorState message={error} /> : properties.length === 0 ? <EmptyState title="Cadastre um imóvel primeiro" description="As fotos precisam estar vinculadas a um imóvel." /> : <>
      <div className="photo-controls"><label>Imóvel<select value={propertyId} onChange={(event) => setPropertyId(event.target.value)}>{properties.map((property) => <option key={property.id} value={property.id}>{property.titulo || `Imóvel #${property.id}`}</option>)}</select></label>
        <form className="photo-upload-form" onSubmit={upload}><label className="file-input">Escolher imagem<input type="file" accept="image/*" required onChange={(event) => setFile(event.target.files?.[0] || null)} /></label><span className="file-name">{file?.name || 'PNG, JPG ou WEBP'}</span><button className="button button-dark button-small" disabled={busy || !file}>{busy ? 'Enviando...' : 'Enviar foto'} <Plus size={14} /></button></form></div>
      {actionError && <div className="form-error-box" role="alert">{actionError}</div>}
      {error && <ErrorState message={error} onRetry={() => loadPhotos()} />}
      {photosLoading ? <LoadingState label="Carregando fotos..." /> : !error && photos.length === 0 ? <EmptyState title="Este imóvel ainda não tem fotos" description="Envie uma imagem para começar a montar a galeria." icon={Image} /> : (
        <div className="photo-grid">{photos.map((photo) => <article className="photo-admin-card" key={photo.id}><div className="photo-admin-preview"><div className="photo-placeholder"><Image size={26} /><span>Prévia indisponível</span></div>{photo.capa && <span className="cover-tag">Foto de capa</span>}</div><div className="photo-admin-meta"><div><strong>{photo.nomeArquivo || `Foto #${photo.id}`}</strong><span>Imóvel #{propertyId} · ordem {photo.ordem ?? 0}</span></div><div className="table-actions">{!photo.capa && <button className="button button-outline button-small" onClick={() => markCover(photo)}>Definir capa</button>}<button className="icon-button" title="Editar foto" onClick={() => { setEditingPhoto(photo); setEditFile(null); setEditOrder(String(photo.ordem ?? 0)); }}><Pencil size={15} /></button><button className="icon-button icon-danger" title="Excluir foto" onClick={() => remove(photo)}><Trash2 size={15} /></button></div></div>{editingPhoto?.id === photo.id && <form className="photo-edit-form" onSubmit={updatePhoto}><label>Substituir arquivo<input type="file" accept="image/*" onChange={(event) => setEditFile(event.target.files?.[0] || null)} /></label><label>Ordem<input type="number" min="0" value={editOrder} onChange={(event) => setEditOrder(event.target.value)} /></label><div className="form-actions"><button type="button" className="button button-outline button-small" onClick={() => setEditingPhoto(null)}>Cancelar</button><button className="button button-dark button-small" disabled={busy}>{busy ? 'Salvando...' : 'Salvar'}</button></div></form>}</article>)}</div>
      )}
      <p className="form-hint">Observação: o backend armazena o caminho local do arquivo, mas ainda não disponibiliza uma URL pública de imagem.</p>
    </>}
  </AdminPage>;
}

export function AdminUsersPage() {
  const { session } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ nome: '', email: '', senha: '', tipo: 'USER' });
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const result = await api.get('/users');
      setUsers(Array.isArray(result) ? result : []);
    } catch (requestError) { setError(apiMessage(requestError)); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);
  const filtered = users.filter((user) => `${user.nome} ${user.email}`.toLowerCase().includes(query.toLowerCase()));

  function create() {
    setEditing(null);
    setForm({ nome: '', email: '', senha: '', tipo: 'USER' });
    setActionError('');
    setFormOpen(true);
  }
  function edit(user) {
    setEditing(user);
    setForm({ nome: user.nome || '', email: user.email || '', senha: '', tipo: user.tipo || 'USER' });
    setActionError('');
    setFormOpen(true);
  }
  async function save(event) {
    event.preventDefault();
    setActionError('');
    setBusy(true);
    const payload = { nome: form.nome.trim(), email: form.email.trim(), tipo: form.tipo };
    if (form.senha) payload.senha = form.senha;
    try {
      if (editing) await api.put(`/users/${editing.id}`, payload);
      else {
        if (!form.senha || form.senha.length < 8) throw new Error('Informe uma senha com pelo menos 8 caracteres.');
        await api.post('/users', payload);
      }
      setFormOpen(false);
      await load();
    } catch (requestError) { setActionError(apiMessage(requestError)); }
    finally { setBusy(false); }
  }
  async function remove(user) {
    if (user.email?.toLowerCase() === session?.email?.toLowerCase()) {
      setActionError('Você não pode excluir a própria conta de administrador.');
      return;
    }
    if (!window.confirm(`Excluir o usuário ${user.nome} (${user.email})? Esta ação não pode ser desfeita.`)) return;
    setActionError('');
    try { await api.delete(`/users/${user.id}`); setUsers((items) => items.filter((item) => item.id !== user.id)); }
    catch (requestError) { setActionError(apiMessage(requestError)); }
  }

  return <AdminPage>
    <PageTitle eyebrow="ACESSOS · ADMIN" title="Usuários" description="Gerencie contas, perfis e permissões de acesso." action={<button className="button button-dark" onClick={create}><Plus size={16} /> Novo usuário</button>} />
    {actionError && <div className="form-error-box" role="alert">{actionError}</div>}
    {formOpen && <form className="catalog-form" onSubmit={save}><div className="catalog-form-head"><div><span className="eyebrow">{editing ? 'EDITAR CONTA' : 'NOVA CONTA'}</span><h3>{editing ? 'Atualizar usuário' : 'Cadastrar usuário'}</h3></div><button type="button" className="icon-button" onClick={() => setFormOpen(false)} aria-label="Fechar"><X size={18} /></button></div>
      <div className="form-grid"><label>Nome completo<input required minLength="2" value={form.nome} onChange={(event) => setForm({ ...form, nome: event.target.value })} /></label><label>E-mail<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label><label>{editing ? 'Nova senha (opcional)' : 'Senha'}<input type="password" minLength="8" required={!editing} value={form.senha} onChange={(event) => setForm({ ...form, senha: event.target.value })} /></label><label>Perfil<select value={form.tipo} onChange={(event) => setForm({ ...form, tipo: event.target.value })}><option value="USER">Cliente</option><option value="ADMIN">Administrador</option></select></label></div>
      {actionError && <div className="form-error-box">{actionError}</div>}<div className="form-actions"><button type="button" className="button button-outline" onClick={() => setFormOpen(false)}>Cancelar</button><button className="button button-dark" disabled={busy}>{busy ? 'Salvando...' : 'Salvar usuário'} <Check size={15} /></button></div>
    </form>}
    <div className="table-toolbar"><span>{users.length} usuários</span><label className="table-search"><Search size={16} /><input placeholder="Buscar por nome ou e-mail" value={query} onChange={(event) => setQuery(event.target.value)} /></label></div>
    {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={load} /> : filtered.length === 0 ? <EmptyState title={query ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'} description={query ? 'Tente outra busca.' : 'As contas cadastradas aparecerão aqui.'} icon={Users} /> : <div className="table-wrap"><table><thead><tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th className="actions-heading">Ações</th></tr></thead><tbody>{filtered.map((user) => <tr key={user.id}><td><span className="table-primary">{user.nome}</span>{user.email?.toLowerCase() === session?.email?.toLowerCase() && <span className="you-tag">Você</span>}</td><td>{user.email}</td><td><span className={`role-tag ${user.tipo === 'ADMIN' ? 'role-admin' : ''}`}>{user.tipo === 'ADMIN' ? 'Administrador' : 'Cliente'}</span></td><td><div className="table-actions"><button className="icon-button" title="Editar" onClick={() => edit(user)}><Pencil size={15} /></button><button className="icon-button icon-danger" title="Excluir" onClick={() => remove(user)} disabled={user.email?.toLowerCase() === session?.email?.toLowerCase()}><Trash2 size={15} /></button></div></td></tr>)}</tbody></table></div>}
  </AdminPage>;
}

export function AdminOffersPage() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [filter, setFilter] = useState('');
  const [busyId, setBusyId] = useState(null);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const result = await api.get('/ofertas');
      setOffers(Array.isArray(result) ? result : []);
    } catch (requestError) { setError(apiMessage(requestError)); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);
  const filtered = offers.filter((offer) => !filter || normalizeStatus(offer.status) === filter);

  async function changeStatus(offer, action) {
    const label = action === 'aceitar' ? 'aceitar esta oferta' : 'recusar esta oferta';
    if (!window.confirm(`Deseja ${label}?`)) return;
    setBusyId(offer.id);
    setActionError('');
    try {
      await api.patch(`/ofertas/${offer.id}/${action}`);
      await load();
    } catch (requestError) { setActionError(apiMessage(requestError)); }
    finally { setBusyId(null); }
  }

  return <AdminPage><PageTitle eyebrow="NEGOCIAÇÃO · ADMIN" title="Gestão de ofertas" description="Analise propostas e acompanhe a situação de cada imóvel." />
    {actionError && <div className="form-error-box" role="alert">{actionError}</div>}
    <div className="table-toolbar"><span>{offers.length} ofertas</span><label className="compact-select">Situação <select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="">Todas</option><option value="pendente">Pendente</option><option value="aceita">Aceita</option><option value="em_espera">Em espera</option><option value="recusada">Recusada</option><option value="cancelada">Cancelada</option></select></label></div>
    {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={load} /> : filtered.length === 0 ? <EmptyState title={filter ? 'Nenhuma oferta nesta situação' : 'Nenhuma oferta recebida'} description="As propostas de clientes aparecerão aqui quando enviadas." icon={ArrowUpRight} /> : <div className="table-wrap"><table><thead><tr><th>Imóvel / cliente</th><th>Tipo</th><th>Valor proposto</th><th>Data</th><th>Situação</th><th>Ações</th></tr></thead><tbody>{filtered.map((offer) => <tr key={offer.id}><td><span className="table-primary">{offer.imovel?.titulo || `Imóvel #${offer.imovelId || offer.imovel?.id || '—'}`}</span><span className="table-secondary">{offer.usuario?.nome || offer.usuario?.email || 'Cliente'}</span></td><td>{offer.tipo || '—'}</td><td>{formatPrice(offer.valorProposto)}</td><td>{offer.dataCriacao ? new Date(offer.dataCriacao).toLocaleDateString('pt-BR') : '—'}</td><td><StatusPill value={offer.status} /></td><td><div className="table-actions">{normalizeStatus(offer.status) === 'pendente' ? <><button className="button button-outline button-small" disabled={busyId === offer.id} onClick={() => changeStatus(offer, 'aceitar')}>Aceitar</button><button className="icon-button icon-danger" title="Recusar" disabled={busyId === offer.id} onClick={() => changeStatus(offer, 'recusar')}><X size={15} /></button></> : '—'}</div></td></tr>)}</tbody></table></div>}
  </AdminPage>;
}

export function AdminContractsPage() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [filter, setFilter] = useState('');
  const [busyId, setBusyId] = useState(null);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const result = await api.get('/contratos');
      setContracts(Array.isArray(result) ? result : []);
    } catch (requestError) { setError(apiMessage(requestError)); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);
  const filtered = contracts.filter((contract) => !filter || normalizeStatus(contract.status) === filter);

  async function action(contract, name) {
    const verb = { aprovar: 'aprovar', recusar: 'recusar', cancelar: 'cancelar', enviar: 'enviar o contrato ao cliente' }[name];
    if (!window.confirm(`Deseja ${verb} o contrato #${contract.id}?`)) return;
    setBusyId(contract.id);
    setActionError('');
    try {
      if (name === 'enviar') await api.post(`/contratos/${contract.id}/enviar`);
      else await api.patch(`/contratos/${contract.id}/${name}`);
      await load();
    } catch (requestError) { setActionError(apiMessage(requestError)); }
    finally { setBusyId(null); }
  }
  async function download(contract) {
    setActionError('');
    setBusyId(contract.id);
    try {
      const blob = await api.download(`/contratos/${contract.id}/pdf`);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `contrato-${contract.id}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (requestError) { setActionError(apiMessage(requestError)); }
    finally { setBusyId(null); }
  }

  return <AdminPage><PageTitle eyebrow="DOCUMENTOS · ADMIN" title="Gestão de contratos" description="Aprove, envie e acompanhe os contratos associados às ofertas." />
    {actionError && <div className="form-error-box" role="alert">{actionError}</div>}
    <div className="table-toolbar"><span>{contracts.length} contratos</span><label className="compact-select">Situação <select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="">Todas</option><option value="aguardando_assinatura">Aguardando assinatura</option><option value="assinado">Assinado</option><option value="cancelado">Cancelado</option></select></label></div>
    {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={load} /> : filtered.length === 0 ? <EmptyState title="Nenhum contrato encontrado" description="Os contratos criados a partir de ofertas aparecerão aqui." icon={FileSignature} /> : <div className="table-wrap"><table><thead><tr><th>Contrato / imóvel</th><th>Cliente</th><th>Aprovação</th><th>Assinatura</th><th>Situação</th><th>Ações</th></tr></thead><tbody>{filtered.map((contract) => <tr key={contract.id}><td><span className="table-primary">Contrato #{contract.id}</span><span className="table-secondary">{contract.oferta?.imovel?.titulo || `Oferta #${contract.oferta?.id || contract.ofertaId || '—'}`}</span></td><td>{contract.oferta?.usuario?.nome || contract.oferta?.usuario?.email || '—'}</td><td>{contract.dataAprovacao ? new Date(contract.dataAprovacao).toLocaleDateString('pt-BR') : '—'}</td><td>{contract.dataAssinatura ? new Date(contract.dataAssinatura).toLocaleDateString('pt-BR') : '—'}</td><td><StatusPill value={contract.status} /></td><td><div className="table-actions"><button className="icon-button" title="Baixar PDF" disabled={busyId === contract.id} onClick={() => download(contract)}><Download size={15} /></button>{String(contract.status).toLowerCase().includes('aguardando') && <><button className="button button-outline button-small" disabled={busyId === contract.id} onClick={() => action(contract, 'aprovar')}>Aprovar</button><button className="icon-button icon-danger" title="Recusar" disabled={busyId === contract.id} onClick={() => action(contract, 'recusar')}><X size={15} /></button></>}{String(contract.status).toLowerCase() === 'assinado' && <button className="button button-outline button-small" disabled={busyId === contract.id} onClick={() => action(contract, 'enviar')}>Enviar</button>}{!String(contract.status).toLowerCase().includes('cancelado') && <button className="button button-outline button-small" disabled={busyId === contract.id} onClick={() => action(contract, 'cancelar')}>Cancelar</button>}</div></td></tr>)}</tbody></table></div>}
  </AdminPage>;
}
