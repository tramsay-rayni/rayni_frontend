"use client";
import "./globals.css";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React from "react";
import { getAuthMe, logout } from "@/lib/api";

export default function RootLayout({ children }:{children:React.ReactNode}){
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // Don't check auth on login page
    if (pathname === "/login") {
      setLoading(false);
      return;
    }

    getAuthMe().then(userData => {
      setUser(userData);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
      router.push("/login");
    });
  }, [pathname, router]);

  async function handleLogout() {
    await logout();
    setUser(null);
    router.push("/login");
  }

  // Don't show sidebar on login page
  if (pathname === "/login") {
    return (
      <html lang="en">
        <body className="min-h-screen bg-gray-50 text-gray-900">
          {children}
        </body>
      </html>
    );
  }

  if (loading) {
    return (
      <html lang="en">
        <body className="min-h-screen bg-gray-50 text-gray-900 flex items-center justify-center">
          <div className="text-gray-500">Loading...</div>
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <div className="flex">
          <aside className="w-64 bg-white border-r min-h-screen p-4 flex flex-col">
            <div>
              <div className="mb-6">
                <Link href="/" className="text-lg font-semibold">Rayni</Link>
                <div className="text-xs text-gray-500">MVP Console</div>
              </div>

              {user && (
                <div className="mb-4 pb-4 border-b">
                  <div className="text-xs text-gray-500 mb-1">Logged in as</div>
                  <div className="font-medium text-sm">{user.name}</div>
                  <div className="text-xs text-gray-600">{user.email}</div>
                  {user.is_admin && (
                    <div className="mt-1">
                      <span className="badge badge-green text-xs">Admin</span>
                    </div>
                  )}
                  {user.isGuest && (
                    <div className="mt-1">
                      <span className="badge badge-amber text-xs">Guest</span>
                    </div>
                  )}
                </div>
              )}

              <nav className="space-y-1 text-sm">
                <Link className="block px-2 py-2 rounded hover:bg-gray-100" href="/">Dashboard</Link>
                <Link className="block px-2 py-2 rounded hover:bg-gray-100" href="/support">Support</Link>
                <Link className="block px-2 py-2 rounded hover:bg-gray-100" href="/settings/users">Users & Roles</Link>
              </nav>
            </div>

            <div className="mt-auto pt-4 border-t">
              <button
                onClick={handleLogout}
                className="btn border w-full text-sm"
              >
                Logout
              </button>
            </div>
          </aside>
          <main className="flex-1 p-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
