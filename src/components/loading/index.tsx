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
          ? "flex justify-center my-8"
          : `min-h-screen flex items-center justify-center ${
              compensateHeader ? "-mt-16" : ""
            }`
      }
    >
      <Spinner color="primary" size={inline ? "md" : "lg"} />
    </div>
  );
};
