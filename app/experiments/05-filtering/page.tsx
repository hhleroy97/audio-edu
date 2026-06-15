import { loadExperimentLesson } from "@/lib/experiments/load-lesson";
import { FilteringPlayground } from "./FilteringPlayground";

export default function FilteringPage() {
  const lesson = loadExperimentLesson("05-filtering");
  if (!lesson) return null;
  return <FilteringPlayground lesson={lesson} />;
}
