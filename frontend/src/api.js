const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
const TOKEN_KEY = 'morada.token';

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const getToken = () => window.localStorage.getItem(TOKEN_KEY);
export const saveToken = (token) => window.localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => window.localStorage.removeItem(TOKEN_KEY);

function friendlyMessage(status, payload) {
  const message = payload?.message || payload?.mensagem || payload?.erro || payload?.error || payload?.detail;
  if (status === 401) return 'E-mail ou senha inválidos, ou sessão expirada. Confira os dados e tente novamente.';
  if (status === 403) return 'Acesso negado. Seu perfil não tem permissão para esta ação.';
  if (status === 404) {
    if (typeof message === 'string' && /no static resource/i.test(message)) return 'Este recurso ainda não está disponível na API.';
    return message || 'Não encontramos esse item.';
  }
  if (status === 409) return message || 'Esta ação não pode ser concluída por uma regra de negócio.';
  if (status >= 500) return 'O serviço está indisponível no momento. Tente novamente em instantes.';
  return message || 'Não foi possível concluir a solicitação. Confira os dados e tente novamente.';
}

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch {
    throw new ApiError(0, 'Não foi possível conectar à API. Verifique se o servidor está disponível.');
  }

  if (response.status === 401 && token) {
    clearToken();
    window.dispatchEvent(new Event('morada:session-expired'));
    if (window.location.pathname !== '/login') window.location.assign('/login?expirada=1');
  }

  if (!response.ok) {
    const raw = await response.text();
    let payload;
    try {
      payload = raw ? JSON.parse(raw) : null;
    } catch {
      payload = { message: raw };
    }
    throw new ApiError(response.status, friendlyMessage(response.status, payload));
  }

  if (response.status === 204) return null;
  if (options.responseType === 'blob') return response.blob();
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

const json = (method, body) => ({
  method,
  body: body === undefined ? undefined : JSON.stringify(body),
});

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, json('POST', body)),
  put: (path, body) => request(path, json('PUT', body)),
  patch: (path, body) => request(path, json('PATCH', body)),
  delete: (path) => request(path, { method: 'DELETE' }),
  upload: (path, formData, method = 'POST') => request(path, { method, body: formData }),
  download: (path) => request(path, { responseType: 'blob' }),
};
