import { prisma } from "@/lib/prisma";
import { Shield, User } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      image: true,
      createdAt: true,
      _count: {
        select: {
          blogPosts: true,
          comments: true,
          questions: true,
        },
      },
    },
  });

  return (
    <div>
      <h1 className="text-3xl font-bold font-[family-name:var(--font-display)] gradient-text mb-8">
        User Management
      </h1>

      <div className="glass rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-glass-border">
              <th className="text-left px-4 py-3 text-sm text-text-secondary font-medium">
                User
              </th>
              <th className="text-left px-4 py-3 text-sm text-text-secondary font-medium hidden md:table-cell">
                Role
              </th>
              <th className="text-left px-4 py-3 text-sm text-text-secondary font-medium hidden md:table-cell">
                Activity
              </th>
              <th className="text-left px-4 py-3 text-sm text-text-secondary font-medium hidden md:table-cell">
                Joined
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className="border-b border-glass-border hover:bg-white/[0.02]"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-gold" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {user.name || "—"}
                      </p>
                      <p className="text-text-muted text-xs">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span
                    className={`flex items-center gap-1 text-xs ${
                      user.role === "ADMIN" ? "text-gold" : "text-text-secondary"
                    }`}
                  >
                    {user.role === "ADMIN" && <Shield className="w-3 h-3" />}
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <div className="text-xs text-text-muted space-y-0.5">
                    <p>{user._count.blogPosts} posts</p>
                    <p>{user._count.comments} comments</p>
                    <p>{user._count.questions} questions</p>
                  </div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-text-secondary text-sm">
                  {formatDate(user.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
