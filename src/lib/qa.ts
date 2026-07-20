import { prisma } from "./prisma";

export interface QAQuestion {
  id: string;
  title: string;
  content: string;
  isAnswered: boolean;
  votes: number;
  createdAt: string;
  author: { name: string | null };
  answers: {
    id: string;
    content: string;
    votes: number;
    isBestAnswer: boolean;
    createdAt: string;
    author: { name: string | null; role?: string };
  }[];
  _count?: { answers: number };
}

export interface QAPage {
  questions: QAQuestion[];
  total: number;
  page: number;
  totalPages: number;
}

interface QAQueryOptions {
  q?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

/**
 * Paginated question list — shared by the /api/qa route and the server-rendered
 * Q&A page so both use identical query logic. Dates are serialized to ISO
 * strings for safe client transfer.
 */
export async function getQuestionsPage({
  q = "",
  sort = "recent",
  page = 1,
  limit = 20,
}: QAQueryOptions): Promise<QAPage> {
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { content: { contains: q, mode: "insensitive" } },
    ];
  }
  if (sort === "unanswered") where.isAnswered = false;

  const orderBy: Record<string, string> = sort === "popular" ? { votes: "desc" } : { createdAt: "desc" };

  const [rows, total] = await Promise.all([
    prisma.question.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        author: { select: { name: true } },
        answers: {
          orderBy: [{ isBestAnswer: "desc" }, { votes: "desc" }, { createdAt: "asc" }],
          include: { author: { select: { name: true, role: true } } },
        },
        _count: { select: { answers: true } },
      },
    }),
    prisma.question.count({ where }),
  ]);

  const questions: QAQuestion[] = rows.map((qq) => ({
    id: qq.id,
    title: qq.title,
    content: qq.content,
    isAnswered: qq.isAnswered,
    votes: qq.votes,
    createdAt: qq.createdAt.toISOString(),
    author: { name: qq.author.name },
    answers: qq.answers.map((a) => ({
      id: a.id,
      content: a.content,
      votes: a.votes,
      isBestAnswer: a.isBestAnswer,
      createdAt: a.createdAt.toISOString(),
      author: { name: a.author.name, role: a.author.role },
    })),
    _count: qq._count,
  }));

  return { questions, total, page, totalPages: Math.ceil(total / limit) };
}
