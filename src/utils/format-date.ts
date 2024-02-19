import moment from "moment";

// moment.updateLocale("en", {
//   relativeTime: {
//     future: "в %s",
//     past: "%s назад",
//     s: "несколько секунд",
//     ss: "%d секунд",
//     m: "минуту",
//     mm: "%d минут",
//     h: "час",
//     hh: "%d часов",
//     d: "день",
//     dd: "%d дней",
//     w: "неделю",
//     ww: "%d недель",
//     M: "месяц",
//     MM: "%d месяцев",
//     y: "год",
//     yy: "%d лет",
//   },
// });

export function formatDate(date: string) {
  return moment.parseZone(date).utcOffset(date).fromNow();
}

export function formatDate2(date: string) {
  return moment(date).format("D MMM YYYY");
}
