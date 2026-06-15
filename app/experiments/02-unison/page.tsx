import { loadExperimentLesson } from "@/lib/experiments/load-lesson";
import { UnisonPlayground } from "./UnisonPlayground";

export default function UnisonPage() {
  const lesson = loadExperimentLesson("02-unison");
  if (!lesson) return null;
  return <UnisonPlayground lesson={lesson} />;
}
