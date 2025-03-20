export const delay = (seconds: number) =>
  new Promise((resolve) => setTimeout(resolve, seconds * 1000));

export const snakeToTitle = (tag: string): string => tag.replace(/_/g, " ");
export const titleToSnake = (tag: string): string => tag.replace(/\s+/g, "_");

