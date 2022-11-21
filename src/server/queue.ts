import { Queue, Worker } from 'bullmq';
import { env } from './env';
import IORedis from 'ioredis';
import { prisma } from './prisma';
const connection = new IORedis(+env.REDIS_PORT, env.REDIS_HOST, {
  maxRetriesPerRequest: null,
});

const queueWorkersGlobal = global as typeof global & {
  workers?: Worker[];
  queues?: Record<'schedule', Queue>;
};

const getRunUrl = (appId: string, updatedAt?: Date | null) => {
  const version = new Date(updatedAt || Date.now()).getTime().toString();
  return `${process.env.ZIPPER_URL}/run/${appId}@${version}`;
};

const initializeWorkers = () => {
  console.log('[BullMQ] Initializing workers');
  return [
    new Worker(
      'schedule-queue',
      async (job) => {
        const schedule = await prisma.schedule.findUnique({
          where: { id: job.data.scheduleId },
          include: { app: true },
        });
        if (schedule?.app) {
          const raw = await fetch(
            getRunUrl(schedule.appId, schedule.app.updatedAt),
            {
              method: 'POST',
              body: JSON.stringify(schedule.inputs),
            },
          );

          const res = await raw.json();

          await prisma.appRun.create({
            data: {
              app: { connect: { id: schedule.appId } },
              success: res.ok,
              result: JSON.stringify(res.data, null, 2),
              inputs: JSON.stringify(schedule.inputs, null, 2),
              scheduled: true,
              deploymentId: `${
                schedule.appId
              }@${schedule.app.updatedAt?.getTime()}`,
            },
          });
        }
      },
      { connection },
    )
      .on('completed', (job) => {
        console.log(`[Job Queue] Completed job ID ${job.id}`);
      })
      .on('failed', (job, err) => {
        console.log(`[Job Queue] Failed job ID ${job?.id} with error ${err}`);
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
  queueWorkersGlobal.workers = workers;
  queueWorkersGlobal.queues = queues;
};
