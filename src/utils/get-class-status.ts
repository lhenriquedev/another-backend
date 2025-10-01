import { toZonedTime } from "date-fns-tz";

export type ClassStatus = "not-started" | "in-progress" | "finished";

interface GetClassStatusProps {
  startTime: Date | string;
  endTime: Date | string;
  now?: Date;
  timeZone?: string;
}

export function getClassStatus({
  startTime,
  endTime,
  now = new Date(),
  timeZone = "America/Sao_Paulo",
}: GetClassStatusProps): ClassStatus {
  if (timeZone) {
    const start = toZonedTime(new Date(startTime), timeZone);
    const end = toZonedTime(new Date(endTime), timeZone);
    const nowInZone = toZonedTime(now, timeZone);

    if (nowInZone < start) return "not-started";
    if (nowInZone >= start && nowInZone < end) return "in-progress";
    return "finished";
  }

  const start = new Date(startTime);
  const end = new Date(endTime);

  if (now < start) return "not-started";
  if (now >= start && now < end) return "in-progress";
  return "finished";
}
