import { format, formatDistanceToNow, isValid } from "date-fns";
import { enUS } from "date-fns/locale";

export const delay = (seconds: number) =>
  new Promise((resolve) => setTimeout(resolve, seconds * 1000));

export const snakeToTitle = (tag: string): string => tag.replace(/_/g, " ");
export const titleToSnake = (tag: string): string => tag.replace(/\s+/g, "_");

export const randomMessageFromList = (messages: string[]) =>
  messages[Math.floor(Math.random() * messages.length)];

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
