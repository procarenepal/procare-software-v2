import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import clsx from "clsx";

import { addToast } from "@/components/ui/toast";
import { siteConfig } from "@/config/site";
import { useAuth } from "@/hooks/useAuth";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@/components/ui/dropdown";

export const Navbar = () => {
  const { currentUser, logout, isLoading } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  // Close mobile menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await logout();
      addToast({
        title: "Logged out",
        description: "You have been successfully logged out",
        color: "success",
      });
    } catch (error) {
      addToast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        color: "danger",
      });
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 transition-all duration-300 shadow-none">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 h-[56px] flex items-center justify-between">
        {/* Brand & Logo */}
        <div className="flex items-center gap-8 h-full">
          <Link
            className="flex items-center gap-2.5 transition-opacity hover:opacity-80 focus:outline-none"
            to="/"
          >
            <div className="p-1 border border-slate-200 bg-slate-50 flex items-center justify-center rounded relative overflow-hidden group">
              <div className="absolute inset-0 bg-teal-100 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
              <img
                alt="Procare Software Logo"
                className="w-6 h-6 object-contain relative z-10"
                src="/logo.png"
              />
            </div>
            <div className="flex flex-col justify-center translate-y-[2px]">
              <span className="font-bold text-[15px] text-slate-900 leading-none tracking-tight">
                Procare Software
              </span>
              <span className="text-[10px] uppercase font-bold text-teal-700 tracking-wider">
                Nepal
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-1 h-full">
            {siteConfig.navItems.map((item) => {
              const isActive = location.pathname === item.href;

              return (
                <Link
                  key={item.href}
                  className={clsx(
                    "px-3 py-1.5 text-[13px] font-medium rounded transition-all duration-200 border border-transparent flex items-center h-[32px] hover:border-slate-200 hover:bg-slate-50",
                    isActive
                      ? "text-teal-700 font-bold bg-teal-50 border-teal-100"
                      : "text-slate-600",
                  )}
                  to={item.href}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right Actions */}
        <div className="hidden md:flex items-center gap-3">
          {isLoading ? (
            <div className="flex items-center gap-2 px-3 h-[32px] border border-slate-200 rounded text-slate-500 text-[13px]">
              <svg
                className="animate-spin h-3.5 w-3.5 text-teal-600"
                fill="none"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  fill="currentColor"
                />
              </svg>
              Processing
            </div>
          ) : currentUser ? (
            <Dropdown placement="bottom-end">
              <DropdownTrigger>
                <button className="flex items-center gap-2 p-1 pl-2.5 pr-1 border border-slate-200 hover:border-teal-500 hover:bg-slate-50 rounded bg-white transition-all text-sm font-medium focus:outline-none h-[32px]">
                  <span className="text-[13px] text-slate-700 pr-1 truncate max-w-[100px]">
                    {currentUser.displayName ||
                      currentUser.email?.split("@")[0] ||
                      "User"}
                  </span>
                  <div className="w-6 h-6 bg-teal-600 text-white rounded flex items-center justify-center font-bold text-xs uppercase">
                    {currentUser.email ? currentUser.email[0] : "U"}
                  </div>
                </button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="User menu"
                className="w-56 mt-2 rounded border border-slate-200 bg-white shadow-none"
              >
                <div className="px-3 py-2 border-b border-slate-100 bg-slate-50">
                  <p className="font-bold text-[13px] text-slate-900 truncate">
                    {currentUser.displayName || "Clinic admin"}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {currentUser.email}
                  </p>
                </div>
                <div className="p-1">
                  <DropdownItem
                    className="rounded font-medium text-[13px] text-slate-700"
                    href="/dashboard"
                  >
                    Go to Dashboard
                  </DropdownItem>
                  <DropdownItem
                    className="rounded font-medium text-[13px] text-slate-700"
                    href="/settings"
                  >
                    Account Settings
                  </DropdownItem>
                </div>
                <div className="p-1 border-t border-slate-100">
                  <DropdownItem
                    className="rounded font-medium text-[13px]"
                    color="danger"
                    onClick={handleLogout}
                  >
                    Log out securely
                  </DropdownItem>
                </div>
              </DropdownMenu>
            </Dropdown>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                className="px-4 h-[32px] inline-flex items-center text-[13px] font-semibold text-slate-600 border border-slate-200 rounded hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 transition-colors bg-white focus:outline-none"
                to={siteConfig.links.login}
              >
                Log In
              </Link>
              <Link
                className="px-4 h-[32px] inline-flex items-center text-[13px] font-bold text-white bg-teal-700 border border-teal-800 rounded hover:bg-teal-600 transition-colors focus:outline-none"
                to={siteConfig.links.demo}
              >
                Request Demo
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu toggle */}
        <div className="md:hidden flex items-center gap-2">
          {currentUser && (
            <Link
              className="w-[32px] h-[32px] mr-1 bg-teal-600 text-white rounded flex items-center justify-center font-bold text-sm border border-teal-700 focus:outline-none uppercase"
              to="/dashboard"
            >
              {currentUser.email ? currentUser.email[0] : "U"}
            </Link>
          )}
          <button
            aria-label="Toggle Menu"
            className="w-[32px] h-[32px] flex flex-col justify-center items-center gap-1 border border-slate-200 rounded bg-white hover:bg-slate-50 transition-colors focus:outline-none relative"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              // Close Icon
              <svg
                className="w-4 h-4 text-slate-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M6 18L18 6M6 6l12 12"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              </svg>
            ) : (
              // Menu Icon
              <svg
                className="w-4 h-4 text-slate-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M4 6h16M4 12h16M4 18h16"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Content */}
      <div
        className={clsx(
          "lg:hidden absolute top-[100%] left-0 w-full bg-white overflow-hidden transition-all duration-300",
          isMenuOpen ? "max-h-[500px] border-b border-slate-200" : "max-h-0",
        )}
      >
        <div className="px-4 py-4 flex flex-col gap-2">
          {siteConfig.navMenuItems.map((item) => {
            const isActive = location.pathname === item.href;

            return (
              <Link
                key={item.href}
                className={clsx(
                  "px-4 py-2.5 rounded text-[13px] font-semibold transition-colors border",
                  isActive
                    ? "bg-teal-50 border-teal-100 text-teal-700"
                    : "bg-white border-transparent text-slate-700 hover:border-slate-200 hover:bg-slate-50",
                )}
                to={item.href}
              >
                {item.label}
              </Link>
            );
          })}

          <div className="mt-2 pt-4 border-t border-slate-100 flex flex-col gap-2">
            {currentUser ? (
              <>
                <Link
                  className="px-4 py-2.5 rounded text-[13px] font-semibold bg-slate-900 border border-slate-900 text-white text-center"
                  to="/dashboard"
                >
                  Go to Dashboard
                </Link>
                <button
                  className="px-4 py-2.5 rounded text-[13px] font-semibold bg-white border border-red-200 text-red-600 text-center hover:bg-red-50 transition-colors"
                  onClick={handleLogout}
                >
                  Log Out Securely
                </button>
              </>
            ) : (
              <>
                <Link
                  className="px-4 py-2.5 rounded text-[13px] font-semibold bg-white border border-slate-200 text-slate-700 text-center hover:bg-slate-50 transition-colors"
                  to={siteConfig.links.login}
                >
                  Log In to Clinic
                </Link>
                <Link
                  className="px-4 py-2.5 rounded text-[13px] font-bold bg-teal-700 border border-teal-800 text-white text-center hover:bg-teal-600 transition-colors"
                  to={siteConfig.links.demo}
                >
                  Request a Demo
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
