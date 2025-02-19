import { format, formatDistanceToNow, isValid } from "date-fns";
import { enUS } from "date-fns/locale";

export function formatDate(date: string | Date) {
  const parsedDate = date instanceof Date ? date : new Date(date);
  if (!isValid(parsedDate)) return "Invalid date";
  return formatDistanceToNow(parsedDate, { addSuffix: true, locale: enUS });
}

export function formatDate2(date: string | Date) {
  const parsedDate = date instanceof Date ? date : new Date(date);
  if (!isValid(parsedDate)) return "Invalid date";
  return format(parsedDate, "d MMM yyyy", { locale: enUS });
}
