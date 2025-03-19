import { ResponseError } from "@/api/apis";
import { addToast } from "@heroui/react";

export const addToastSuccess = (message: string) => {
  addToast({
    title: "Success",
    description: message,
    color: "success",
    variant: "flat",
  });
};

export const addToastError = async (message: string, error?: Error) => {
  // const errors: string[] = [];

  if (error && error instanceof ResponseError) {
    const errorBody = await error.response.json();
    message = errorBody.detail || message;

    // if (errorBody.errors) {
    //   errorBody.errors.forEach((error: { message: string }) => {
    //     errors.push(error.message);
    //   });
    // }
  } else if (error instanceof Error) {
    message = error.message;
  }

  addToast({
    title: "Error",
    description: message,
    color: "danger",
    variant: "flat",
    // classNames: { base: "flex flex-col items-start" },
    // endContent: (
    //   <div className="flex min-w-full">
    //     <ul className="ps-14 list-disc">
    //       {errors.length &&
    //         errors.map((e, index) => (
    //           <li key={index} className="text-danger-500 text-sm">
    //             {e}
    //           </li>
    //         ))}
    //     </ul>
    //   </div>
    // ),
  });
};
