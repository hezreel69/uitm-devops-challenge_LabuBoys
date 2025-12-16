'use client'

import Link from "next/link"
import { Search, Heart, User, Menu } from 'lucide-react'
import { usePathname } from 'next/navigation'
import useAuthStore from '@/stores/authStore'

function NavBarBottom() {
  const pathname = usePathname()
  const { isLoggedIn } = useAuthStore()

  // Determine active tab based on pathname
  const getActiveTab = () => {
    if (pathname === '/wishlist') return 'wishlists'
    if (pathname === '/menu' || pathname === '/auth') return 'profile'
    return 'explore'
  }

  const activeTab = getActiveTab()

  return (
    <nav className="fixed z-50 block md:hidden bottom-0 left-0 right-0 bg-white border-t border-slate-200 pb-safe">
      <ul className="flex items-center justify-around pt-3 pb-4 px-4" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
        <li>
          <Link
            href='/'
            className="flex flex-col items-center space-y-1 group"
          >
            <Search
              size={24}
              className={`transition-colors duration-200 ${activeTab === 'explore'
                ? 'text-teal-600'
                : 'text-slate-400 group-hover:text-slate-600'
                }`}
            />
            <span
              className={`text-xs font-medium transition-colors duration-200 ${activeTab === 'explore'
                ? 'text-teal-600'
                : 'text-slate-400 group-hover:text-slate-600'
                }`}
            >
              Explore
            </span>
          </Link>
        </li>
        <li>
          <Link
            href='/wishlist'
            className="flex flex-col items-center space-y-1 group"
          >
            <Heart
              size={24}
              className={`transition-colors duration-200 ${activeTab === 'wishlists'
                ? 'text-teal-600'
                : 'text-slate-400 group-hover:text-slate-600'
                }`}
            />
            <span
              className={`text-xs font-medium transition-colors duration-200 ${activeTab === 'wishlists'
                ? 'text-teal-600'
                : 'text-slate-400 group-hover:text-slate-600'
                }`}
            >
              Wishlists
            </span>
          </Link>
        </li>
        <li>
          {isLoggedIn ? (
            <Link
              href='/menu'
              className="flex flex-col items-center space-y-1 group"
            >
              <Menu
                size={24}
                className={`transition-colors duration-200 ${activeTab === 'profile'
                  ? 'text-teal-600'
                  : 'text-slate-400 group-hover:text-slate-600'
                  }`}
              />
              <span
                className={`text-xs font-medium transition-colors duration-200 ${activeTab === 'profile'
                  ? 'text-teal-600'
                  : 'text-slate-400 group-hover:text-slate-600'
                  }`}
              >
                Options
              </span>
            </Link>
          ) : (
            <Link
              href='/auth'
              className="flex flex-col items-center space-y-1 group"
            >
              <User
                size={24}
                className={`transition-colors duration-200 ${activeTab === 'profile'
                  ? 'text-teal-600'
                  : 'text-slate-400 group-hover:text-slate-600'
                  }`}
              />
              <span
                className={`text-xs font-medium transition-colors duration-200 ${activeTab === 'profile'
                  ? 'text-teal-600'
                  : 'text-slate-400 group-hover:text-slate-600'
                  }`}
              >
                Log in
              </span>
            </Link>
          )}
        </li>
      </ul>
    </nav>
  )
}

export default NavBarBottom