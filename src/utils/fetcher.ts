import axios from "axios";
export const API_URL = process.env.NEXT_PUBLIC_API;
export const fetcher = (url: string) => axios.get(url).then((res) => res.data);
