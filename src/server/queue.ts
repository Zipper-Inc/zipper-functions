import { Queue, Worker } from 'bullmq';
import { env } from './env';
import IORedis from 'ioredis';
const connection = new IORedis(+env.REDIS_PORT, env.REDIS_HOST, {
  password: env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
});

const queueWorkersGlobal = global as typeof global & {
  workers?: Worker[];
  queues?: Record<'schedule', Queue>;
};

const initializeWorkers = () => {
  console.log('[BullMQ] Initializing workers');
  return [
    new Worker(
      'schedule-queue',
      async (job) => {
        console.log(job.data);
      },
      { connection },
    )
      .on('completed', (job) => {
        console.log(`[Job Queue] Completed job ID ${job.id}`);
      })
      .on('failed', (job, err) => {
        console.log(`[Job Queue] Failed job ID ${job.id} with error ${err}`);
      }),
  ];
};

export const workers: Worker[] =
  queueWorkersGlobal.workers || initializeWorkers();

const initializeQueues = () => {
  console.log('[BullMQ] Initializing queues');
  return {
    schedule: new Queue('schedule-queue', {
      connection,
      defaultJobOptions: { removeOnComplete: 1000, removeOnFail: 5000 },
    }),
  };
};

export const queues: Record<'schedule', Queue> =
  queueWorkersGlobal.queues || initializeQueues();

export const initializeQueuesAndWorkers = () => {
  initializeQueues();
  initializeWorkers();
};

if (env.NODE_ENV !== 'production') {
  queueWorkersGlobal.workers = workers;
  queueWorkersGlobal.queues = queues;
}
