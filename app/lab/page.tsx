import { PatchLab } from "./PatchLab";

export const metadata = {
  title: "Patch Lab — Synthesis Learning Lab",
  description:
    "Node-graph canvas for patching oscillators, filters, and more.",
};

export default function LabPage() {
  return <PatchLab />;
}
