import axios from 'axios';
import { getCookie } from '@/lib/utils/session-cookie';

// BASE_URL_API deve ser definida via variável de ambiente.
// Lançar erro evita fallback para URL hardcoded (Sonar S5332).
function getBaseUrlApi(): string {
  const url = process.env.BASE_URL_API;
  if (!url) {
    throw new Error(
      'BASE_URL_API não está definida. Configure no .env ou no ambiente.',
    );
  }
  return url;
}

const BASE_URL_API = getBaseUrlApi();


export const api = axios.create({
  baseURL: BASE_URL_API,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  try {
    const tokenCookie = await getCookie("trello-session");
    if (tokenCookie) {
      config.headers['Cookie'] = tokenCookie;
    }
  } catch {
  }
  return config;
});

export default api;
