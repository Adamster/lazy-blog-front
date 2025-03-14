"use client";

import { useEffect, useState } from "react";
import LoginForm from "./login-form";
import RegisterForm from "./register-form";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";

export function AuthModal({
  isOpen,
  onOpenChange,
}: {
  isOpen: boolean;
  onOpenChange: () => void;
}) {
  const [isLogin, setIsLogin] = useState(true);

  useEffect(() => {
    if (!isOpen) {
      setIsLogin(true);
    }
  }, [isOpen]);

  return (
    <Modal
      placement="top-center"
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size={"md"}
      // classNames={{ backdrop: "z-40" }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="sm:px-10">
              <p>{isLogin ? "Log In" : "Create an Account"}</p>
            </ModalHeader>

            <ModalBody className="sm:px-10">
              {isLogin ? (
                <LoginForm onSuccess={onClose} />
              ) : (
                <RegisterForm onSuccess={onClose} />
              )}
            </ModalBody>

            <ModalFooter className="sm:px-10">
              <Button
                size="md"
                variant="light"
                onPress={() => setIsLogin(!isLogin)}
              >
                {isLogin ? "Create an Account" : "Log In"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
