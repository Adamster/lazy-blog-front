import dynamic from "next/dynamic";
import { Loading } from "@/shared/ui/loading";

export const ImageCropper = dynamic(() => import("./image-cropper"), {
  ssr: false,
  loading: () => <Loading inline />,
});
