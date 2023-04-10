import s from "./comments.module.scss";

interface IProps {
  id: string;
}

export function Comments({ id }: IProps) {
  return (
    <>
      <div className={s.container}>
        <h3 className="text-xl font-bold">Комментарии</h3>
      </div>
    </>
  );
}
