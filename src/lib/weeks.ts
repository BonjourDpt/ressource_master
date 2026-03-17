/** ISO week: Monday = start of week. */

export function getIsoMonday(d: Date): Date {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = date.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setUTCDate(date.getUTCDate() + diff);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

export function addWeeks(d: Date, n: number): Date {
  const out = new Date(d);
  out.setUTCDate(out.getUTCDate() + n * 7);
  return out;
}

export function formatWeekLabel(weekStart: Date): string {
  return weekStart.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

export function getWeekRange(startWeek: Date, span: number): Date[] {
  const weeks: Date[] = [];
  for (let i = 0; i < span; i++) {
    weeks.push(addWeeks(startWeek, i));
  }
  return weeks;
}
