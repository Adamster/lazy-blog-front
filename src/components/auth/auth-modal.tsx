"use client";

import { Dialog } from "@headlessui/react";
import { useEffect, useState } from "react";
import LoginForm from "./login-form";
import RegisterForm from "./register-form";

export function AuthModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [isLogin, setIsLogin] = useState(true);

  useEffect(() => {
    if (!isOpen) {
      setIsLogin(true);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="auth-form">
          {isLogin ? (
            <LoginForm onSuccess={onClose} />
          ) : (
            <RegisterForm onSuccess={onClose} />
          )}

          <div className="mt-4 text-center">
            <button
              className="text-blue-600 hover:underline"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin
                ? "Нет аккаунта? Зарегистрируйтесь"
                : "Уже есть аккаунт? Войти"}
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
