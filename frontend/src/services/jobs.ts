import { authHeadersOnly } from './authHeaders';
import type { JobsResponse, JobResponse, JobStatus } from '../types/job';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

/**
 * Obtener lista de jobs del usuario
 */
export async function fetchJobs(status?: JobStatus, limit: number = 50): Promise<JobsResponse> {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (limit) params.append('limit', limit.toString());

  const url = `${API_BASE}/jobs${params.toString() ? `?${params.toString()}` : ''}`;
  
  const res = await fetch(url, {
    headers: authHeadersOnly(),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Error al obtener jobs' }));
    throw new Error(error.error || 'Error al obtener jobs');
  }

  return res.json();
}

/**
 * Obtener un job específico por ID
 */
export async function fetchJob(jobId: string): Promise<JobResponse> {
  const res = await fetch(`${API_BASE}/jobs/${jobId}`, {
    headers: authHeadersOnly(),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Error al obtener job' }));
    throw new Error(error.error || 'Error al obtener job');
  }

  return res.json();
}

/**
 * Cancelar un job
 */
export async function cancelJob(jobId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/jobs/${jobId}`, {
    method: 'DELETE',
    headers: authHeadersOnly(),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Error al cancelar job' }));
    throw new Error(error.error || 'Error al cancelar job');
  }
}
