import { staticPageMetadata } from "@/lib/seo";
import { getQuestionsPage } from "@/lib/qa";
import QAClient from "./QAClient";

export const generateMetadata = staticPageMetadata({ namespace: "qa", path: "/qa" });

export const revalidate = 60;

export default async function QAPage() {
  let questions: Awaited<ReturnType<typeof getQuestionsPage>>["questions"] = [];
  let totalPages = 1;
  try {
    const result = await getQuestionsPage({ sort: "recent", page: 1, limit: 15 });
    questions = result.questions;
    totalPages = result.totalPages;
  } catch {
    // DB unavailable — client will fetch on interaction.
  }
  return <QAClient initialQuestions={questions} initialTotalPages={totalPages} />;
}
