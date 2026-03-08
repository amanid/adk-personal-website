import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { publications } from "@/data/publications";

export const revalidate = 3600; // Cache for 1 hour

export async function GET() {
  try {
    const [
      postsCount,
      totalViews,
      subscribersCount,
      questionsCount,
    ] = await Promise.all([
      prisma.blogPost.count({ where: { published: true } }),
      prisma.pageView.count(),
      prisma.subscriber.count({ where: { confirmed: true } }),
      prisma.question.count(),
    ]);

    return NextResponse.json({
      publications: publications.length,
      blogPosts: postsCount,
      totalViews,
      subscribers: subscribersCount,
      questions: questionsCount,
      yearsExperience: 13,
      organizations: 11,
      countries: 6,
    }, {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json({
      publications: publications.length,
      yearsExperience: 13,
      organizations: 11,
      countries: 6,
    });
  }
}
