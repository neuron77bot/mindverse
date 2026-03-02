export type JobStatus = 'pending' | 'running' | 'completed' | 'failed';
export type JobName = 'batch-generate-images' | 'compile-video';

export interface Job {
  jobId: string;
  name: JobName;
  status: JobStatus;
  progress: number;
  data: {
    userId: string;
    storyboardId?: string;
    frameIndices?: number[];
    aspectRatio?: string;
    videoUrls?: string[];
    youtubeUrl?: string;
    audioStartTime?: number;
    [key: string]: any;
  };
  priority?: number;
  nextRunAt?: string | null;
  lastRunAt?: string | null;
  lastFinishedAt?: string | null;
  failedAt?: string | null;
  failReason?: string;
  lockedAt?: string | null;
  state?: string;
}

export interface JobsResponse {
  success: boolean;
  jobs: Job[];
}

export interface JobResponse {
  success: boolean;
  job: Job;
}

export interface CreateJobResponse {
  success: boolean;
  jobId: string;
  message: string;
}
