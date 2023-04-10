interface IProps {
  code?: string;
}

export default function ErrorMessage({ code = "" }: IProps) {
  const message = (): string => {
    switch (code) {
      case "Post.NotFound":
        return "Пост не найден, попробуйте еще раз.";
      case "User.NotFound":
        return "Данного юзера не существует, но, вы все еще можете его создать.";
      default:
        return "Где-то, что-то не работает.";
    }
  };

  return (
    <div className="background-white rounded-md p-in">
      <h2 className="text-2xl font-bold mb-4">
        К нашему величайшему сожалению
      </h2>
      <p className="color-gray">{message()}</p>
    </div>
  );
}
