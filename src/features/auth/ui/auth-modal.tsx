import {
  Divider,
  Link,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";
import LoginForm from "./login-form";

export function AuthModal({
  isOpen,
  onOpenChange,
}: {
  isOpen: boolean;
  onOpenChange: () => void;
}) {
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
              <p>Log In</p>
            </ModalHeader>

            <ModalBody className="sm:px-10">
              <LoginForm closeModal={onClose} />
            </ModalBody>

            <ModalFooter className="flex flex-col items-center gap-4 sm:px-10 sm:pb-10">
              <Divider />

              <div className="text-sm text-gray">
                Not a member yet?{" "}
                <Link
                  href="/auth/create-account"
                  className="text-sm cursor-pointer hover:underline"
                  onPress={() => onClose()}
                >
                  Create an Account
                </Link>
              </div>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
