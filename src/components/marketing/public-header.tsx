"use client";

/**
 * PublicHeader — PakSeekers Phase 3.
 *
 * Responsive, modern navigation header with desktop links, mobile navigation dropdown,
 * active anchor tracking, and role-aware authentication triggers.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  LayoutDashboard,
  LogIn,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui";
import { BrandLogo } from "@/components/shared";
import { SITE_CONFIG } from "@/lib/config/site";
import type { SafeUser } from "@/types";

interface PublicHeaderProps {
  currentUser?: SafeUser | null;
}

export function PublicHeader({ currentUser }: PublicHeaderProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Monitor scroll for shadow intensification
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  // Close on Escape key press
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  // Close when window resized to desktop breakpoint
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileMenuOpen(false);
  }

  const closeMobile = () => setMobileMenuOpen(false);

  const isCurrentActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <header
      className={`sticky top-0 z-50 border-b border-border transition-all duration-200 ${
        mobileMenuOpen
          ? "bg-surface shadow-md"
          : "bg-surface/95 backdrop-blur-md"
      } ${scrolled ? "shadow-xs" : ""}`}
    >
      <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Logo with Official Crest */}
        <BrandLogo
          variant="horizontal"
          size="sm"
          href="/"
          onClick={closeMobile}
          subtitle="Entry Test Prep"
          priority
          className="sm:hidden"
        />
        <BrandLogo
          variant="horizontal"
          size="md"
          href="/"
          onClick={closeMobile}
          subtitle="Entry Test Prep"
          priority
          className="hidden sm:inline-flex"
        />

        {/* Desktop Navigation Links */}
        <nav
          aria-label="Primary Navigation"
          className="hidden lg:flex items-center gap-1 text-sm font-medium"
        >
          {SITE_CONFIG.navigation.map((item) => {
            const active = isCurrentActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  active
                    ? "text-primary bg-primary/10 font-bold shadow-2xs"
                    : "text-text-secondary hover:text-primary hover:bg-surface/80"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden sm:flex items-center gap-3">
          {currentUser?.role === "student" ? (
            <Link href="/student/dashboard">
              <Button
                variant="primary"
                size="sm"
                className="font-semibold"
                leftIcon={<LayoutDashboard className="w-4 h-4" />}
              >
                Student Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/student/login">
                <Button variant="ghost" size="sm" className="text-text-secondary hover:text-primary">
                  Sign In
                </Button>
              </Link>
              <Link href="/student/register">
                <Button
                  variant="primary"
                  size="sm"
                  className="font-semibold"
                >
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex items-center gap-2 lg:hidden">
          {currentUser?.role === "student" && (
            <Link
              href="/student/dashboard"
              className="sm:hidden"
            >
              <Button size="sm" variant="primary" className="h-8 px-2.5 text-xs">
                Dashboard
              </Button>
            </Link>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            className="min-h-[44px] min-w-[44px] w-11 h-11 rounded-lg border border-border bg-surface text-text-primary flex items-center justify-center hover:bg-background focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors cursor-pointer shrink-0"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5 text-text-primary" />
            ) : (
              <Menu className="w-5 h-5 text-text-primary" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown & Overlay */}
      {mobileMenuOpen && (
        <>
          {/* Dimmed backdrop overlay covering page content below header */}
          <div
            className="fixed inset-0 top-16 sm:top-20 bg-black/50 backdrop-blur-xs z-40 lg:hidden animate-in fade-in duration-150"
            onClick={closeMobile}
            aria-hidden="true"
          />

          {/* Mobile Navigation Dropdown Panel */}
          <div
            id="mobile-navigation"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation"
            className="absolute top-full left-0 right-0 w-full bg-surface border-b border-border shadow-2xl z-50 max-h-[calc(100dvh-4rem)] sm:max-h-[calc(100dvh-5rem)] overflow-y-auto overscroll-contain lg:hidden animate-in fade-in slide-in-from-top-1 duration-150"
          >
            <div className="flex flex-col gap-4 p-4 sm:p-6 max-w-lg mx-auto w-full">
              {/* Primary Navigation Links */}
              <nav aria-label="Mobile Menu Navigation" className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold text-text-secondary tracking-wider uppercase px-2 mb-0.5">
                  Menu Navigation
                </span>
                {SITE_CONFIG.navigation.map((item) => {
                  const active = isCurrentActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeMobile}
                      aria-current={active ? "page" : undefined}
                      className={`text-sm sm:text-base font-semibold py-2.5 px-3.5 rounded-xl transition-colors flex items-center justify-between min-h-[44px] shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                        active
                          ? "text-primary bg-primary/10 border-l-4 border-primary font-bold shadow-2xs"
                          : "text-text-primary hover:text-primary hover:bg-background/80"
                      }`}
                    >
                      <span>{item.label}</span>
                      {active && (
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                      )}
                    </Link>
                  );
                })}
              </nav>

              {/* Mobile Auth Actions */}
              <div className="pt-3.5 border-t border-border flex flex-col gap-2.5 shrink-0">
                {currentUser?.role === "student" ? (
                  <Link href="/student/dashboard" onClick={closeMobile} className="w-full">
                    <Button
                      variant="primary"
                      size="md"
                      className="w-full justify-center min-h-[44px] font-semibold"
                      leftIcon={<LayoutDashboard className="w-4 h-4 shrink-0" />}
                    >
                      Go to Student Dashboard
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/student/login" onClick={closeMobile} className="w-full">
                      <Button
                        variant="outline"
                        size="md"
                        className="w-full justify-center min-h-[44px] font-semibold"
                        leftIcon={<LogIn className="w-4 h-4 text-primary shrink-0" />}
                      >
                        Student Sign In
                      </Button>
                    </Link>
                    <Link href="/student/register" onClick={closeMobile} className="w-full">
                      <Button
                        variant="primary"
                        size="md"
                        className="w-full justify-center min-h-[44px] font-semibold"
                        leftIcon={<UserPlus className="w-4 h-4 shrink-0" />}
                      >
                        Create Free Account
                      </Button>
                    </Link>
                  </>
                )}

                <p className="text-center text-[11px] text-text-secondary mt-1">
                  Pakistan’s Premier Entry Test Preparation Platform
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
