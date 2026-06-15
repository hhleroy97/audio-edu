import { loadExperimentLesson } from "@/lib/experiments/load-lesson";
import { OscillatorPlayground } from "./OscillatorPlayground";

export default function OscillatorPage() {
  const lesson = loadExperimentLesson("01-oscillator");
  if (!lesson) return null;
  return <OscillatorPlayground lesson={lesson} />;
}
