import { loadExperimentLesson } from "@/lib/experiments/load-lesson";
import { LayeringPlayground } from "./LayeringPlayground";

export default function LayeringPage() {
  const lesson = loadExperimentLesson("06-layering");
  if (!lesson) return null;
  return <LayeringPlayground lesson={lesson} />;
}
