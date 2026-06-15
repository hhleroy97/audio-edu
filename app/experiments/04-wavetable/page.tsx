import { loadExperimentLesson } from "@/lib/experiments/load-lesson";
import { WavetablePlayground } from "./WavetablePlayground";

export default function WavetablePage() {
  const lesson = loadExperimentLesson("04-wavetable");
  if (!lesson) return null;
  return <WavetablePlayground lesson={lesson} />;
}
