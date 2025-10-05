import "./globals.css";
import Link from "next/link";
export default function RootLayout({ children }:{children:React.ReactNode}){
  return (<html lang="en"><body className="min-h-screen bg-gray-50 text-gray-900">
    <div className="flex">
      <aside className="w-64 bg-white border-r min-h-screen p-4">
        <div className="mb-6"><Link href="/" className="text-lg font-semibold">Rayni</Link><div className="text-xs text-gray-500">MVP Console</div></div>
        <nav className="space-y-1 text-sm">
          <Link className="block px-2 py-2 rounded hover:bg-gray-100" href="/">Dashboard</Link>
          <Link className="block px-2 py-2 rounded hover:bg-gray-100" href="/support">Support</Link>
          <Link className="block px-2 py-2 rounded hover:bg-gray-100" href="/settings/users">Users & Roles</Link>
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  </body></html>);
}
