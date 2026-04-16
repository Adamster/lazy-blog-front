import dynamic from "next/dynamic";
import { Loading } from "@/shared/ui/loading";

export const Crepe = dynamic(() => import("./crepe"), {
  ssr: false,
  loading: () => <Loading inline />,
});
