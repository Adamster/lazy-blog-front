interface IProps {
  code?: keyof typeof errorMessages;
}

const errorMessages = {
  "Post.NotFound": "Пост не найден, попробуйте еще раз.",
  "User.NotFound":
    "Данного юзера не существует, но, вы все еще можете его создать.",
  "User.EmailAlreadyInUse": "Оный email уже занят.",
} as const;

const defaultMessage = "Где-то, что-то не работает.";

export default function ErrorMessage({ code }: IProps) {
  const message = code ? errorMessages[code] : defaultMessage;

  return (
    <div className="background-white rounded-md p-in">
      <h2 className="text-2xl font-bold mb-4">
        К нашему величайшему сожалению
      </h2>
      <p className="color-gray">{message}</p>
    </div>
  );
}
