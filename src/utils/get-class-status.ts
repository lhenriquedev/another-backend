export type ClassStatus = "not-started" | "in-progress" | "finished";

interface GetClassStatusProps {
  startTime: Date | string;
  endTime: Date | string;
  now?: Date;
}

export function getClassStatus({
  startTime,
  endTime,
  now = new Date(),
}: GetClassStatusProps) {
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (now < start) return "not-started";
  if (now >= start && now < end) return "in-progress";
  return "finished";
}
