/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

export const ErrorMessage = ({ error }: any) => {
  console.log(error);

  return (
    <div className="min-h-screen -mt-16 flex flex-col items-center justify-center">
      <h2 className="text-9xl font-bold mb-2">Error</h2>
    </div>
  );
};
