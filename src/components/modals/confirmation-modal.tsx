import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";

interface ConfirmDeleteModalProps {
  message: string;
  isOpen: boolean;
  onOpenChange: () => void;
  onConfirm: () => void;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  message,
  isOpen,
  onOpenChange,
  onConfirm,
}) => {
  return (
    <Modal
      placement="center"
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="sm"
      backdrop="blur"
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="sm:px-10">Confirmation</ModalHeader>
            <ModalBody className="sm:px-10">
              <p>{message}</p>
            </ModalBody>
            <ModalFooter className="sm:px-10">
              <Button size="md" variant="light" onPress={onOpenChange}>
                Cancel
              </Button>
              <Button
                color="primary"
                size="md"
                variant="solid"
                onPress={() => {
                  onConfirm();
                  onClose();
                }}
              >
                Yes
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default ConfirmDeleteModal;
