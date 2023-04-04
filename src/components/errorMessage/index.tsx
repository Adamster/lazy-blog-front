export default function ErrorMessage({code}: {code: string}) {

  const message = (): string => {
    switch(code) {
      case 'Post.NotFound': 
        return 'К нашему величайшему сожалению - пост не найден, попробуйте еще раз.';
      default:
        return 'Где-то, чё-то не работает.' 
    }
  }

  return (
    <div className="bg-white rounded-md p-8">
      <h2 className="text-2xl font-bold mb-4">Ошибкен</h2>
      <p className="color-gray">{message()}</p>
    </div>
  );
}

