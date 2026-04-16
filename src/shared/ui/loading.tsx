import { Spinner } from "@heroui/react";
import React from "react";

interface IProps {
  inline?: boolean;
  compensateHeader?: boolean;
}

export const Loading = ({
  inline = false,
  compensateHeader = true,
}: IProps) => {
  return (
    <div
      className={
        inline
          ? "my-6 flex justify-center"
          : `flex min-h-screen items-center justify-center ${
              compensateHeader ? "-mt-16" : ""
            }`
      }
    >
      <Spinner color="primary" size={inline ? "md" : "lg"} />
    </div>
  );
};
