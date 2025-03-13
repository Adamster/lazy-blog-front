/* eslint-disable @typescript-eslint/no-explicit-any */
export const delay = (seconds: number) =>
  new Promise((resolve) => setTimeout(resolve, seconds * 1000));

export const snakeToTitle = (tag: string): string => {
  return tag
    .split("_")
    .map((word: any) => `${word[0].toUpperCase()}${word.slice(1)}`)
    .join(" ");
};

export const titleToSnake = (tag: string): string => {
  return tag.replace(/\s+/g, "_").toLowerCase();
};
