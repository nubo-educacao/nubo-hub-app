import { getEnvVar } from '../config/env';

const API_BASE_URL = getEnvVar('NEXT_PUBLIC_API_BASE_URL');

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export async function http<T>(path: string, options?: RequestInit & { method?: HttpMethod }) {
  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Erro na requisição');
  }

  return (await response.json()) as T;
}
