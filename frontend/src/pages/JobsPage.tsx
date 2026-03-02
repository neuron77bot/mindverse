import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { fetchJobs, cancelJob } from '../services/jobs';
import type { Job, JobStatus } from '../types/job';
import Breadcrumb from '../components/UI/Breadcrumb';

type FilterType = 'all' | 'in-progress' | 'completed' | 'failed';

export default function JobsPage() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [pollingInterval, setPollingInterval] = useState<number | null>(null);

  const loadJobs = useCallback(async () => {
    try {
      const data = await fetchJobs();
      setJobs(data.jobs || []);
    } catch (err: any) {
      console.error('Error cargando jobs:', err);
      if (!jobs.length) {
        toast.error(err.message || 'Error al cargar jobs');
      }
    } finally {
      setLoading(false);
    }
  }, [jobs.length]);

  useEffect(() => {
    loadJobs();
  }, []);

  // Auto-refresh: polling cada 5 segundos si hay jobs running
  useEffect(() => {
    const hasRunningJobs = jobs.some((j) => j.status === 'running' || j.status === 'pending');

    if (hasRunningJobs && !pollingInterval) {
      const interval = setInterval(() => {
        loadJobs();
      }, 5000);
      setPollingInterval(interval);
    } else if (!hasRunningJobs && pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }

    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [jobs, pollingInterval, loadJobs]);

  const handleCancel = async (jobId: string) => {
    if (!confirm('¿Cancelar este job?')) return;

    toast.promise(cancelJob(jobId), {
      loading: 'Cancelando job...',
      success: () => {
        loadJobs();
        return 'Job cancelado';
      },
      error: (err) => err.message || 'Error al cancelar job',
    });
  };

  const handleViewDetails = (job: Job) => {
    if (job.data.storyboardId) {
      navigate(`/storyboard/detail/${job.data.storyboardId}`);
    }
  };

  const filteredJobs = jobs.filter((job) => {
    if (filter === 'all') return true;
    if (filter === 'in-progress') return job.status === 'pending' || job.status === 'running';
    if (filter === 'completed') return job.status === 'completed';
    if (filter === 'failed') return job.status === 'failed';
    return true;
  });

  const getJobTypeLabel = (name: string) => {
    switch (name) {
      case 'batch-generate-images':
        return 'Generación masiva';
      case 'compile-video':
        return 'Compilación de video';
      default:
        return name;
    }
  };

  const getStatusBadge = (status: JobStatus) => {
    const baseClasses = 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium';
    
    switch (status) {
      case 'pending':
        return (
          <span className={`${baseClasses} bg-yellow-500/20 text-yellow-300 border border-yellow-500/30`}>
            ⏳ Pendiente
          </span>
        );
      case 'running':
        return (
          <span className={`${baseClasses} bg-blue-500/20 text-blue-300 border border-blue-500/30`}>
            🔄 En progreso
          </span>
        );
      case 'completed':
        return (
          <span className={`${baseClasses} bg-green-500/20 text-green-300 border border-green-500/30`}>
            ✅ Completado
          </span>
        );
      case 'failed':
        return (
          <span className={`${baseClasses} bg-red-500/20 text-red-300 border border-red-500/30`}>
            ❌ Fallido
          </span>
        );
      default:
        return <span className={baseClasses}>{status}</span>;
    }
  };

  const getTimeAgo = (date?: string | null) => {
    if (!date) return '—';
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Hace unos segundos';
    if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
  };

  if (loading) {
    return (
      <div className="p-6">
        <Breadcrumb items={[{ label: 'Jobs', path: '/jobs' }]} />
        <div className="mt-6 flex items-center justify-center">
          <div className="text-slate-400">Cargando jobs...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Breadcrumb items={[{ label: 'Jobs', path: '/jobs' }]} />

      <div className="mt-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Jobs</h1>
          
          {/* Filtros */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilter('in-progress')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === 'in-progress'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              En progreso
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === 'completed'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Completados
            </button>
            <button
              onClick={() => setFilter('failed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === 'failed'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Fallidos
            </button>
          </div>
        </div>

        {filteredJobs.length === 0 ? (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
            <div className="text-slate-400 text-lg">No hay jobs {filter !== 'all' ? 'con este filtro' : ''}</div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <div
                key={job.jobId}
                className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-slate-600 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold text-white">
                        {getJobTypeLabel(job.name)}
                      </h3>
                      {getStatusBadge(job.status)}
                    </div>

                    {/* Progress bar para running jobs */}
                    {job.status === 'running' && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-sm text-slate-400 mb-1">
                          <span>Progreso</span>
                          <span>{job.progress}%</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full transition-all duration-500 ease-out animate-pulse"
                            style={{ width: `${job.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="space-y-1 text-sm text-slate-400">
                      {job.data.frameIndices && (
                        <div>📸 {job.data.frameIndices.length} imágenes</div>
                      )}
                      {job.data.videoUrls && (
                        <div>🎬 {job.data.videoUrls.length} videos</div>
                      )}
                      {job.data.aspectRatio && (
                        <div>📐 Aspect ratio: {job.data.aspectRatio}</div>
                      )}
                      
                      {/* Timestamps */}
                      <div className="flex items-center gap-4 mt-2">
                        {job.lastRunAt && (
                          <span>Iniciado: {getTimeAgo(job.lastRunAt)}</span>
                        )}
                        {job.lastFinishedAt && (
                          <span>Completado: {getTimeAgo(job.lastFinishedAt)}</span>
                        )}
                        {job.failedAt && (
                          <span className="text-red-400">Falló: {getTimeAgo(job.failedAt)}</span>
                        )}
                      </div>

                      {/* Fail reason */}
                      {job.failReason && (
                        <div className="mt-2 p-3 bg-red-900/20 border border-red-500/30 rounded text-red-300 text-xs">
                          <strong>Error:</strong> {job.failReason}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-2 ml-4">
                    {job.status === 'completed' && job.data.storyboardId && (
                      <button
                        onClick={() => handleViewDetails(job)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-all"
                      >
                        Ver detalles
                      </button>
                    )}
                    
                    {(job.status === 'pending' || job.status === 'running') && (
                      <button
                        onClick={() => handleCancel(job.jobId)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-all"
                      >
                        Cancelar
                      </button>
                    )}

                    {/* TODO: Implementar retry para failed jobs si se añade endpoint */}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
