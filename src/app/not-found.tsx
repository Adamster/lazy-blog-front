import { ErrorMessage } from "@/shared/ui";

export default function NotFound() {
  return <ErrorMessage error="Not Found." status={404} />;
}
