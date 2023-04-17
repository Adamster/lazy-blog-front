export function formatDate(date: string) {
  const formatter = new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
  });

  const formattedDate = formatter.format(new Date(date));
  return formattedDate.replace(/\u202F/g, " ");
}
