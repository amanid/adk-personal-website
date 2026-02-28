import { prisma } from "@/lib/prisma";
import DashboardClient from "@/components/admin/DashboardClient";

export default async function AdminDashboard() {
  const [
    usersCount,
    postsCount,
    publicationsCount,
    questionsCount,
    serviceRequestsCount,
    messagesCount,
    totalViews,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.blogPost.count(),
    prisma.publication.count(),
    prisma.question.count(),
    prisma.serviceRequest.count(),
    prisma.contactMessage.count({ where: { isRead: false } }),
    prisma.blogPost.aggregate({ _sum: { views: true } }),
  ]);

  const recentRequests = await prisma.serviceRequest.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, serviceType: true, status: true },
  });

  const recentMessages = await prisma.contactMessage.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, subject: true, isRead: true },
  });

  return (
    <DashboardClient
      usersCount={usersCount}
      postsCount={postsCount}
      publicationsCount={publicationsCount}
      questionsCount={questionsCount}
      serviceRequestsCount={serviceRequestsCount}
      messagesCount={messagesCount}
      totalViews={totalViews._sum.views || 0}
      recentRequests={recentRequests}
      recentMessages={recentMessages}
    />
  );
}
