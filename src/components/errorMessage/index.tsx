export default function ErrorMessage({message}: {message: string}) {
  return (
    <div className="bg-white rounded-md p-8">
      <h2 className="text-2xl font-bold mb-4">Ошибкен</h2>
      <p className="color-gray">{message}</p>
    </div>
  );
}

