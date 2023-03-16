export function formatDate(date: string) {
  const formatter = new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const formattedDate = formatter.format(new Date(date));
  return formattedDate.replace(/\u202F/g, " ");
}
