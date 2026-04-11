import axios from 'axios';
import { getCookie } from '@/lib/utils/session-cookie';

const BASE_URL_API = process.env.BASE_URL_API || 'http://trello-api:3000';


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
