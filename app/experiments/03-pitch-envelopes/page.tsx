import { loadExperimentLesson } from "@/lib/experiments/load-lesson";
import { PitchEnvelopesPlayground } from "./PitchEnvelopesPlayground";

export default function PitchEnvelopesPage() {
  const lesson = loadExperimentLesson("03-pitch-envelopes");
  if (!lesson) return null;
  return <PitchEnvelopesPlayground lesson={lesson} />;
}
