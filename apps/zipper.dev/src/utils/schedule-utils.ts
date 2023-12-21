import parser from 'cron-parser';
import { Prisma } from '@prisma/client';
import { prisma } from '~/server/prisma';
import { queues, removeFromQueue } from '~/server/queue';

export const createScheduleAndAddToQueue = async ({
  data,
  userId,
  defaultSelect,
}: {
  data: Prisma.ScheduleCreateArgs['data'];
  userId?: string;
  defaultSelect?: Prisma.ScheduleSelect;
}) => {
  try {
    const parsed = parser.parseExpression(data.crontab);
    console.log(parsed.fields.second.toString());
    if (parsed.fields.second && parsed.fields.second.toString() !== '0') {
      throw new Error('No seconds allowed');
    }
  } catch (error) {
    throw new Error('Invalid crontab');
  }

  const schedule = await prisma.schedule.create({
    data,
    select: defaultSelect,
  });

  queues.schedule.add(
    schedule.id,
    { scheduleId: schedule.id },
    { repeat: { pattern: schedule.crontab } },
  );

  return schedule;
};

export const deleteSchedulesAndRemoveFromQueue = async ({
  where,
}: {
  where: Prisma.ScheduleDeleteManyArgs['where'];
}) => {
  const deletedIds = (
    await prisma.schedule.findMany({
      where,
      select: {
        id: true,
      },
    })
  ).map((s) => s.id);

  await prisma.schedule.deleteMany({
    where,
  });

  await removeFromQueue('schedule', deletedIds);

  return deletedIds;
};
