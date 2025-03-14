"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/react";
import EditProfileForm from "./edit-profile-form";

interface EditProfileModalProps {
  isOpen: boolean;
  onOpenChange: () => void;
}

export function EditProfileModal({
  isOpen,
  onOpenChange,
}: EditProfileModalProps) {
  return (
    <Modal
      placement="top-center"
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size={window.innerWidth < 640 ? "full" : "md"}
      scrollBehavior="inside"
    >
      <ModalContent>
        <ModalHeader className="sm:px-10">Edit Profile</ModalHeader>
        <ModalBody className="sm:px-10">
          <EditProfileForm onOpenChange={onOpenChange} />
        </ModalBody>
        <ModalFooter className="sm:px-10"></ModalFooter>
      </ModalContent>
    </Modal>
  );
}
