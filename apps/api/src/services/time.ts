export function getQuotaDate(now = new Date()) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getEndOfDayMs(now = new Date()) {
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  return end.getTime();
}

export function toIso(value: number | null | undefined) {
  return value ? new Date(value).toISOString() : undefined;
}
