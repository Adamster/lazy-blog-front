import {
  Divider,
  Link,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";
import { useEffect, useState } from "react";
import LoginForm from "./login-form";
import RegisterForm from "./register-form";

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
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="sm:px-10 sm:pt-10">
              <p>{isLogin ? "Log In" : "Create an Account"}</p>
            </ModalHeader>

            <ModalBody className="sm:px-10">
              {isLogin ? (
                <LoginForm closeModal={onClose} />
              ) : (
                <RegisterForm closeModal={onClose} />
              )}
            </ModalBody>

            <ModalFooter className="flex flex-col items-center gap-4 sm:px-10 sm:pb-10">
              <Divider />

              <div className="text-sm text-gray">
                {isLogin ? "Not a member yet ? " : "Already a member? "}
                <Link
                  className="text-sm cursor-pointer hover:underline"
                  onPress={() => setIsLogin(!isLogin)}
                >
                  {isLogin ? "Create an Account" : "Log In"}
                </Link>
              </div>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
