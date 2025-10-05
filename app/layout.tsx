"use client";
import "./globals.css";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React from "react";
import { getAuthMe, logout } from "@/lib/api";
import SettingsModal from "./components/SettingsModal";

export default function RootLayout({ children }:{children:React.ReactNode}){
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [settingsOpen, setSettingsOpen] = React.useState(false);

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
                <Link className="nav-item" href="/">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Dashboard
                </Link>
                <Link className="nav-item" href="/support">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Support
                </Link>
                <Link className="nav-item" href="/settings/users">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Users & Roles
                </Link>
              </nav>
            </div>

            <div className="mt-auto pt-4 border-t space-y-2">
              <button
                onClick={() => setSettingsOpen(true)}
                className="btn-secondary w-full text-sm"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </button>
              <button
                onClick={handleLogout}
                className="btn-secondary w-full text-sm"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </aside>
          <main className="flex-1 p-6">{children}</main>
        </div>

        {/* Settings Modal */}
        <SettingsModal
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          user={user}
        />
      </body>
    </html>
  );
}
