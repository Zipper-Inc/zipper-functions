import { Queue, Worker } from 'bullmq';
import { env } from './env';
import IORedis from 'ioredis';
import { prisma } from './prisma';
import fetch from 'node-fetch';
import getRunUrl from '../utils/get-run-url';
import { randomUUID } from 'crypto';
import { hash } from 'bcryptjs';

const connection = new IORedis(+env.REDIS_PORT, env.REDIS_HOST, {
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
          if (schedule.app.requiresAuthToRun && schedule.userId) {
            const secret = randomUUID().replace(/-/g, '').slice(0, 21);
            const identifier = randomUUID().replace(/-/g, '').slice(0, 21);

            const hashedSecret = await hash(secret, 10);

            await prisma.appAccessToken.create({
              data: {
                identifier,
                appId: schedule.appId,
                userId: schedule.userId,
                hashedSecret,
                description: `Temporary token for ${schedule.id}`,
                scheduleId: schedule.id,
              },
            });

            token = `zaat.${identifier}.${secret}`;
          }

          /**
           * @todo
           * this should be the version of the app specific to the cron
           */
          const url = getRunUrl(
            schedule.app.slug,
            schedule.app.lastDeploymentVersion,
            schedule.filename,
          );

          try {
            const raw = await fetch(url, {
              method: 'POST',
              headers: {
                'x-zipper-schedule-id': schedule.id,
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(inputsWithoutAnnotations),
            });

            const res = (await raw.json()) as any;

            await prisma.appRun.create({
              data: {
                app: { connect: { id: schedule.appId } },
                success: true,
                result: JSON.stringify(res, null, 2),
                inputs: JSON.stringify(schedule.inputs, null, 2),
                schedule: { connect: { id: schedule.id } },
                deploymentId: `${
                  schedule.appId
                }@${schedule.app.updatedAt?.getTime()}`,
              },
            });
          } catch (error) {
            console.log(`[Job Queue] Error with job ID ${job.id}`);
            console.log(error);
            await prisma.appRun.create({
              data: {
                app: { connect: { id: schedule.appId } },
                success: false,
                result: {},
                inputs: JSON.stringify(schedule.inputs, null, 2),
                schedule: { connect: { id: schedule.id } },
                deploymentId: `${
                  schedule.appId
                }@${schedule.app.updatedAt?.getTime()}`,
              },
            });
          }
        }
      },
      { connection },
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
