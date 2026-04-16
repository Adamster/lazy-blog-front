import { Button, Link } from "@heroui/react";

export default function NotFound() {
  return (
    <div className="min-h-screen -mt-16 flex flex-col gap-4 items-center justify-center">
      <h2 className="text-6xl font-bold">404</h2>
      <p className="text-gray">
        Couldn&apos;t find what you were looking for.
      </p>
      <Button color="primary" variant="flat" as={Link} href="/">
        Go home
      </Button>
    </div>
  );
}
