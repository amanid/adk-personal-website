import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/routing";
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Users,
  Briefcase,
  Mail,
  BookOpen,
  Building2,
  FolderOpen,
  GraduationCap,
  Settings,
  BarChart3,
  DollarSign,
} from "lucide-react";

const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/finance", label: "Finance", icon: DollarSign },
  { href: "/admin/blog", label: "Blog", icon: FileText },
  { href: "/admin/publications", label: "Publications", icon: BookOpen },
  { href: "/admin/experience", label: "Experience", icon: Building2 },
  { href: "/admin/projects", label: "Projects", icon: FolderOpen },
  { href: "/admin/skills", label: "Skills & Education", icon: GraduationCap },
  { href: "/admin/services", label: "Services", icon: Briefcase },
  { href: "/admin/qa", label: "Q&A", icon: MessageSquare },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/messages", label: "Messages", icon: Mail },
  { href: "/admin/settings", label: "Site Settings", icon: Settings },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 glass-strong border-r border-glass-border p-4 hidden lg:block">
        <div className="mb-8">
          <h2 className="text-lg font-bold gradient-text font-[family-name:var(--font-display)]">
            Admin Panel
          </h2>
        </div>
        <nav className="space-y-1">
          {adminLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 px-3 py-2.5 text-sm text-text-secondary hover:text-gold hover:bg-gold/5 rounded-lg transition-all"
            >
              <link.icon className="w-4 h-4" />
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Mobile nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 glass-strong border-t border-glass-border z-50 px-1 py-1">
        <div className="flex justify-around overflow-x-auto">
          {adminLinks.slice(0, 9).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex flex-col items-center gap-0.5 p-1.5 text-text-secondary hover:text-gold transition-colors min-w-[48px]"
            >
              <link.icon className="w-4 h-4" />
              <span className="text-[9px] truncate max-w-[48px]">{link.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 p-6 lg:p-8 pb-20 lg:pb-8">{children}</main>
    </div>
  );
}
