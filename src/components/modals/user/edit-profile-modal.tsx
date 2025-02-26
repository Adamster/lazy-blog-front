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
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="md">
      <ModalContent>
        <ModalHeader className="px-10">Edit Profile</ModalHeader>
        <ModalBody className="px-10">
          <EditProfileForm onOpenChange={onOpenChange} />
        </ModalBody>
        <ModalFooter></ModalFooter>
      </ModalContent>
    </Modal>
  );
}
