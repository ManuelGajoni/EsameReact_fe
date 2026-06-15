"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

function getInitials(name: string): string {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

        <Link href={user ? "/dashboard" : "/login"} className="text-green-600 font-extrabold text-2xl tracking-tight">
          Fields
        </Link>

        {user ? (
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm text-gray-500 hover:text-green-600 transition-colors hidden sm:flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Le mie sedi
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {getInitials(user.name)}
              </div>
              <span className="text-sm font-medium text-gray-700 hidden md:block">{user.name}</span>
            </div>
            <button
              onClick={logout}
              className="text-sm text-gray-400 hover:text-red-500 transition-colors"
            >
              Esci
            </button>
          </div>
        ) : (
          <Link href="/login">
            <button className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-colors duration-200">
              Accedi / Registrati
            </button>
          </Link>
        )}
      </div>
    </nav>
  );
}
