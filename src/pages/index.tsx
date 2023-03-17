import { IPost } from "types";

interface IProps {
  initialData: IPost[];
}

export default function Home({ initialData }: IProps) {
  return <>home page</>;
}
