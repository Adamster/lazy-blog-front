interface IProps {
  code?: string;
}

export default function ErrorMessage({ code = "" }: IProps) {
  const message = (): string => {
    switch (code) {
      case "Post.NotFound":
        return "Пост не найден";
      case "User.NotFound":
        return "Пользователь не найден";
      case "User.EmailAlreadyInUse":
        return "Email уже занят";
      default:
        return "Ошибка";
    }
  };

  return (
    <div className="flex flex-col items-center p-in">
      <h2 className="text-2xl font-bold mb-2">К сожалению</h2>
      <p className="color-gray">{message()}</p>
    </div>
  );
}
