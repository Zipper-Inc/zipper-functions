import { Queue, Worker } from 'bullmq';
import { env } from './env';
import IORedis from 'ioredis';
import { prisma } from './prisma';
import fetch from 'node-fetch';
import getRunUrl from '../utils/get-run-url';
import { generateAccessToken } from '../utils/jwt-utils';

export const redis = new IORedis(+env.REDIS_PORT, env.REDIS_HOST, {
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
        const schedule = await prisma.schedule.findUnique({
          where: { id: job.data.scheduleId },
          include: { app: true },
        });
        if (schedule?.app) {
          const inputs = JSON.parse(JSON.stringify(schedule.inputs));

          const inputsWithoutAnnotations: Record<string, string> = {};
          Object.keys(inputs).forEach((inputKey) => {
            const splitKey = inputKey.split(':');
            splitKey.pop();

            inputsWithoutAnnotations[splitKey.join(':')] = inputs[inputKey];
          });

          let token: undefined | string = undefined;
          if (schedule.userId) {
            const user = await prisma.user.findUnique({
              where: { id: schedule.userId },
            });

            if (user) {
              token = generateAccessToken(
                { userId: schedule.userId, profile: user },
                { expiresIn: '30s' },
              );
            }
          }

          /**
           * @todo
           * this should be the version of the app specific to the cron
           */
          const url = getRunUrl(schedule.app.slug, 'latest', schedule.filename);

          try {
            await fetch(url, {
              method: 'POST',
              headers: {
                'x-zipper-schedule-id': schedule.id,
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(inputsWithoutAnnotations),
            });
          } catch (error) {
            console.log(`[Job Queue] Error with job ID ${job.id}`);
            console.log(error);
          }
        }
      },
      { connection: redis },
    )
      ?.on('completed', (job) => {
        console.log(`[Job Queue] Completed job ID ${job?.id}`);
      })
      ?.on('failed', (job, err) => {
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
      connection: redis,
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
