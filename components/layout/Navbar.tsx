"use client";

// components/layout/Navbar.tsx
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { FaBars, FaTimes, FaChevronDown, FaComments } from "react-icons/fa";
import { useAuth } from "@/hooks/useAuth";
import NotificationBell from "@/components/ui/NotificationBell";
import CurrencyToggle from "@/components/ui/CurrencyToggle";

const navLinks = [
  { href: "/properties", label: "Properties" },
  { href: "/vehicles", label: "Vehicles" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Determine if we're on a page with a hero so navbar starts transparent
  const isHeroPage = pathname === "/";

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navBg =
    isHeroPage && !isScrolled
      ? "bg-transparent"
      : "bg-white shadow-sm border-b border-gray-100";

  const textColor =
    isHeroPage && !isScrolled ? "text-white" : "text-gray-900";

  const logoColor =
    isHeroPage && !isScrolled ? "text-secondary" : "text-black";

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navBg}`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className={`font-playfair text-2xl font-bold flex items-center ${logoColor}`}>
            <Image src="/logo.png" alt="A" width={38} height={38} className="mr-0.5 inline-block" />
            Asavio
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`font-medium transition-colors hover:text-secondary ${textColor} ${
                  pathname === link.href ? "text-secondary" : ""
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-3">
            <CurrencyToggle textColor={textColor} />
            {isAuthenticated && user ? (
              <>
                {/* Messages icon */}
                <Link
                  href="/dashboard/messages"
                  className={`p-2 rounded-full hover:bg-black/10 transition-colors ${textColor}`}
                  aria-label="Messages"
                >
                  <FaComments size={18} />
                </Link>

                {/* Notification bell */}
                <NotificationBell textColor={textColor} />
              </>
            ) : null}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className={`flex items-center gap-2 ${textColor} font-medium hover:text-secondary transition-colors`}
                >
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-black font-bold text-sm">
                    {user.firstName[0].toUpperCase()}
                  </div>
                  <span>{user.firstName}</span>
                  <FaChevronDown className="text-xs" />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50"
                      onMouseLeave={() => setUserMenuOpen(false)}
                    >
                      {user.role === "admin" && (
                        <Link
                          href="/dashboard/admin"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          Admin Dashboard
                        </Link>
                      )}
                      {user.role === "host" && (
                        <Link
                          href="/dashboard/host"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          Host Dashboard
                        </Link>
                      )}
                      <Link
                        href="/dashboard/user"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        My Bookings
                      </Link>
                      <Link
                        href="/account/settings"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Account Settings
                      </Link>
                      <Link
                        href="/support"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Help &amp; Support
                      </Link>
                      <hr className="my-1 border-gray-100" />
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          logout();
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        Log out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className={`font-medium transition-colors hover:text-secondary ${textColor}`}
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="bg-secondary text-black font-semibold px-5 py-2 rounded-full hover:bg-yellow-400 transition-colors"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className={`md:hidden ${textColor}`}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-100 overflow-hidden"
          >
            <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="font-medium text-gray-900 hover:text-secondary transition-colors py-2"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <CurrencyToggle textColor="text-gray-700" />
              <hr className="border-gray-100" />
              {isAuthenticated && user ? (
                <>
                  <div className="flex items-center gap-3 py-2">
                    <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-black font-bold">
                      {user.firstName[0].toUpperCase()}
                    </div>
                    <span className="font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </span>
                  </div>
                  {user.role === "admin" && (
                    <Link
                      href="/dashboard/admin"
                      className="text-gray-700 py-2"
                      onClick={() => setMobileOpen(false)}
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  {user.role === "host" && (
                    <Link
                      href="/dashboard/host"
                      className="text-gray-700 py-2"
                      onClick={() => setMobileOpen(false)}
                    >
                      Host Dashboard
                    </Link>
                  )}
                  <Link
                    href="/dashboard/user"
                    className="text-gray-700 py-2"
                    onClick={() => setMobileOpen(false)}
                  >
                    My Bookings
                  </Link>
                  <Link
                    href="/dashboard/messages"
                    className="text-gray-700 py-2"
                    onClick={() => setMobileOpen(false)}
                  >
                    Messages
                  </Link>
                  <Link
                    href="/account/settings"
                    className="text-gray-700 py-2"
                    onClick={() => setMobileOpen(false)}
                  >
                    Account Settings
                  </Link>
                  <Link
                    href="/support"
                    className="text-gray-700 py-2"
                    onClick={() => setMobileOpen(false)}
                  >
                    Help &amp; Support
                  </Link>
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      logout();
                    }}
                    className="text-left text-red-600 py-2 font-medium"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <div className="flex gap-3 pb-2">
                  <Link
                    href="/login"
                    className="flex-1 text-center border border-black text-black font-semibold py-2 rounded-full hover:bg-black hover:text-white transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    Log in
                  </Link>
                  <Link
                    href="/register"
                    className="flex-1 text-center bg-secondary text-black font-semibold py-2 rounded-full hover:bg-yellow-400 transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
