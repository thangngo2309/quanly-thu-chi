import axios from 'axios';

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:6200/api';

export const api = axios.create({
  baseURL: apiBaseUrl.replace(/\/$/, ''),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});