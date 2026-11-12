import CreateWizard from "@/components/CreateWizard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create your new storefront — fern",
};

const MODES = ["ai", "templates", "quickstart"] as const;

export default function CreatePage({
  searchParams,
}: {
  searchParams?: { mode?: string };
}) {
  const requested = searchParams?.mode;
  const mode = MODES.find((m) => m === requested);
  return <CreateWizard initialMode={mode ?? "quickstart"} />;
}
