import { Dialog } from "@headlessui/react";

export default function PasswordMatch() {
  return (
    <>
      <Dialog className="dialog" open={false} onClose={() => {}}>
        <Dialog.Panel className="dialog-panel">
          <Dialog.Title className="dialog-title">
            Проверка на пароль
          </Dialog.Title>

          <p className="mb-4">
            Дабы все были счастливы и довольны, <br />
            давай проверим что ты помнишь свой пароль
          </p>

          <div className="mb-4">
            <input
              className="input"
              name="password"
              type="password"
              required
              placeholder="Пароль"
              onChange={(e) => {}}
            />
          </div>

          <button className="btn">Блин, забыл</button>
        </Dialog.Panel>
      </Dialog>
    </>
  );
}
