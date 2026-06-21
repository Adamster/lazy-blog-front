import { ErrorMessage } from "@/shared/ui/error-message";

export default function NotFound() {
  return <ErrorMessage error="Not Found." status={404} />;
}
