import {
  useState,
  useEffect,
  useRef,
  useCallback,
  startTransition,
} from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  IoMenuOutline,
  IoGridOutline,
  IoSearchOutline,
  IoPersonOutline,
  IoMedicalOutline,
  IoLogOutOutline,
  IoPersonCircleOutline,
  IoSettingsOutline,
  IoChevronDownOutline,
} from "react-icons/io5";

import { useAuthContext } from "@/context/AuthContext";
import { ThemeSwitch } from "@/components/theme-switch";
import { patientService } from "@/services/patientService";
import { doctorService } from "@/services/doctorService";
import { clinicService } from "@/services/clinicService";
import { Clinic } from "@/types/models";
import { storage, APPWRITE_BUCKET_ID } from "@/config/appwrite";
// Custom UI — zero HeroUI
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Card, CardBody } from "@/components/ui/card";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  DropdownSection,
} from "@/components/ui/dropdown";
import { addToast } from "@/components/ui/toast";

// ── Types ─────────────────────────────────────────────────────────────────────
type SearchResult = {
  id: string;
  type: "patient" | "doctor";
  title: string;
  subtitle: string;
  extraInfo?: string;
  href: string;
};

export interface DashboardHeaderProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────
export const DashboardHeader = ({
  isSidebarOpen,
  toggleSidebar,
}: DashboardHeaderProps) => {
  const { currentUser, logout, clinicId } = useAuthContext();
  const navigate = useNavigate();

  // ── Search state ──────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [clinicData, setClinicData] = useState<Clinic | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // ── Logout ────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    try {
      await logout();
      addToast({
        title: "Logged out",
        description: "See you soon!",
        color: "success",
      });
    } catch {
      addToast({
        title: "Error",
        description: "Failed to log out. Try again.",
        color: "danger",
      });
    }
  };

  // ── Fetch clinic branding ──────────────────────────────────────────────────
  const fetchBranding = useCallback(async () => {
    if (!clinicId) return;
    try {
      const data = await clinicService.getClinicById(clinicId);

      startTransition(() => {
        setClinicData(data);
      });
    } catch (err) {
      console.error("Failed to fetch clinic branding:", err);
    }
  }, [clinicId]);

  useEffect(() => {
    fetchBranding();
  }, [fetchBranding]);

  // Listen for branding updates from other components (like ClinicSettingsPage)
  useEffect(() => {
    const handleUpdate = () => fetchBranding();

    window.addEventListener("clinic-branding-updated", handleUpdate);

    return () =>
      window.removeEventListener("clinic-branding-updated", handleUpdate);
  }, [fetchBranding]);

  const getLogoUrl = (logo?: string) => {
    if (!logo) return null;
    if (logo.startsWith("http")) return logo;
    try {
      // Add timestamp to bust cache
      const url = storage.getFileView(APPWRITE_BUCKET_ID, logo);

      return `${url.toString()}&t=${Date.now()}`;
    } catch {
      return null;
    }
  };

  // ── Search ────────────────────────────────────────────────────────────────
  const performSearch = useCallback(
    async (query: string) => {
      if (!clinicId || !query.trim()) return;

      setIsSearching(true);
      try {
        const [patients, doctors] = await Promise.all([
          patientService.getPatientsByClinic(clinicId),
          doctorService.getDoctorsByClinic(clinicId),
        ]);

        const ql = query.toLowerCase();
        const results: SearchResult[] = [];

        patients.forEach((p) => {
          if (
            p.name?.toLowerCase().includes(ql) ||
            p.email?.toLowerCase().includes(ql) ||
            p.mobile?.toLowerCase().includes(ql) ||
            p.regNumber?.toLowerCase().includes(ql)
          ) {
            results.push({
              id: p.id,
              type: "patient",
              title: p.name,
              subtitle: `Reg# ${p.regNumber}`,
              extraInfo: p.mobile || p.email,
              href: `/dashboard/patients/${p.id}`,
            });
          }
        });

        doctors.forEach((d) => {
          if (
            d.name?.toLowerCase().includes(ql) ||
            d.speciality?.toLowerCase().includes(ql) ||
            d.nmcNumber?.toLowerCase().includes(ql)
          ) {
            results.push({
              id: d.id,
              type: "doctor",
              title: d.name,
              subtitle: d.speciality,
              extraInfo: d.nmcNumber ? `NMC: ${d.nmcNumber}` : undefined,
              href: `/dashboard/doctors/${d.id}`,
            });
          }
        });

        // Patients first, then sort by match position
        results.sort((a, b) => {
          if (a.type === "patient" && b.type === "doctor") return -1;
          if (a.type === "doctor" && b.type === "patient") return 1;

          return (
            a.title.toLowerCase().indexOf(ql) -
            b.title.toLowerCase().indexOf(ql)
          );
        });

        setSearchResults(results.slice(0, 8));
        setShowResults(true);
      } catch {
        addToast({ title: "Search failed", color: "danger" });
      } finally {
        setIsSearching(false);
      }
    },
    [clinicId],
  );

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowResults(false);

      return;
    }
    debounceRef.current = setTimeout(() => performSearch(searchQuery), 300);

    return () => clearTimeout(debounceRef.current);
  }, [searchQuery, performSearch]);

  // Close results on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handler);

    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Ctrl/Cmd+K → focus search; Esc → close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "Escape") {
        setShowResults(false);
        searchInputRef.current?.blur();
      }
    };

    document.addEventListener("keydown", handler);

    return () => document.removeEventListener("keydown", handler);
  }, []);

  const handleResultClick = (result: SearchResult) => {
    navigate(result.href);
    setSearchQuery("");
    setShowResults(false);
  };

  const displayName =
    currentUser?.displayName || currentUser?.email?.split("@")[0] || "User";

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <header className="fixed top-0 left-0 right-0 z-30 h-12 bg-white dark:bg-zinc-950 border-b border-mountain-200 dark:border-zinc-800 flex items-center px-3 gap-3 print:hidden transition-colors duration-200">
      {/* ── Left: toggle + logo ─────────────────────────────────────────── */}
      <div className="flex items-center gap-2 shrink-0">
        <Button
          isIconOnly
          aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          className="text-mountain-500 dark:text-zinc-400 bg-mountain-50 dark:bg-zinc-900 hover:bg-mountain-100 dark:hover:bg-zinc-800 transition-colors border-transparent"
          color="default"
          radius="sm"
          size="sm"
          variant="flat"
          onClick={toggleSidebar}
        >
          {isSidebarOpen ? (
            <IoGridOutline className="w-[18px] h-[18px]" />
          ) : (
            <IoMenuOutline className="w-[18px] h-[18px]" />
          )}
        </Button>

        <Link
          className="flex items-center gap-1.5 text-mountain-900 dark:text-zinc-100 no-underline font-bold transition-colors"
          to="/"
        >
          <div className="w-8 h-8 rounded bg-teal-600 flex items-center justify-center shrink-0 overflow-hidden shadow-sm shadow-teal-600/20">
            {clinicData?.logo ? (
              <img
                alt="logo"
                className="w-full h-full object-cover"
                src={getLogoUrl(clinicData.logo) || ""}
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            ) : (
              <span className="text-white text-[15px] font-bold">
                {clinicData?.name?.charAt(0) || "P"}
              </span>
            )}
          </div>
          <span className="font-bold text-[13px] hidden sm:block leading-none text-mountain-900 dark:text-zinc-100 tracking-tight">
            {clinicData?.name || "Procare Nepal"}
          </span>
        </Link>
      </div>

      {/* ── Center: search ─────────────────────────────────────────────── */}
      <div
        className="hidden md:block relative max-w-sm"
        style={{ minWidth: "240px" }}
      >
        <Input
          ref={searchInputRef}
          fullWidth
          endContent={
            searchQuery && (
              <button
                className="text-mountain-400 hover:text-mountain-600"
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setShowResults(false);
                }}
              >
                ×
              </button>
            )
          }
          placeholder="Search patients, doctors… (⌘K)"
          size="sm"
          startContent={
            isSearching ? (
              <span className="w-3.5 h-3.5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <IoSearchOutline className="w-3.5 h-3.5 text-mountain-400" />
            )
          }
          value={searchQuery}
          variant="bordered"
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => {
            if (searchQuery && searchResults.length > 0) setShowResults(true);
          }}
        />

        {/* Search results popover */}
        {showResults && (
          <div className="absolute top-full left-0 right-0 mt-1 z-50">
            <Card className="border border-mountain-200 rounded overflow-hidden">
              <CardBody className="p-1.5">
                {searchResults.length === 0 ? (
                  <div className="text-center py-4">
                    <IoSearchOutline className="w-5 h-5 mx-auto mb-1 text-mountain-300" />
                    <p className="text-xs text-mountain-500">
                      No results for "{searchQuery}"
                    </p>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {searchResults.map((result) => (
                      <button
                        key={`${result.type}-${result.id}`}
                        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded text-left hover:bg-mountain-50 transition-colors duration-75 focus:outline-none focus:bg-mountain-50"
                        type="button"
                        onClick={() => handleResultClick(result)}
                      >
                        {/* Icon */}
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                            result.type === "patient"
                              ? "bg-teal-100 text-teal-700"
                              : "bg-health-100 text-health-700"
                          }`}
                        >
                          {result.type === "patient" ? (
                            <IoPersonOutline className="w-3.5 h-3.5" />
                          ) : (
                            <IoMedicalOutline className="w-3.5 h-3.5" />
                          )}
                        </div>
                        {/* Text */}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-mountain-900 truncate">
                            {result.title}
                          </p>
                          <p className="text-[11px] text-mountain-500 truncate">
                            {result.subtitle}
                          </p>
                        </div>
                        {/* Type badge */}
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-mountain-100 text-mountain-500 shrink-0 capitalize">
                          {result.type}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        )}
      </div>

      {/* ── Right: actions + user ───────────────────────────────────────── */}
      <div className="ml-auto flex items-center gap-1.5 shrink-0">
        {/* Theme switch */}
        <ThemeSwitch />

        {/* User menu */}
        <Dropdown placement="bottom-end">
          <DropdownTrigger>
            <button
              aria-label="User menu"
              className="flex items-center gap-1.5 px-1.5 py-1 rounded bg-transparent hover:bg-mountain-50 dark:hover:bg-zinc-800 transition-colors duration-100"
              type="button"
            >
              <Avatar color="primary" name={displayName} size="sm" />
              <span className="hidden sm:block text-[12px] font-medium text-mountain-900 dark:text-zinc-200 max-w-[80px] truncate">
                {displayName}
              </span>
              <IoChevronDownOutline className="w-3 h-3 text-mountain-400 dark:text-zinc-500" />
            </button>
          </DropdownTrigger>

          <DropdownMenu aria-label="User actions">
            {/* Header info */}
            <DropdownSection showDivider>
              <div className="px-3 py-1.5">
                <p className="text-[11px] font-semibold text-mountain-900 truncate">
                  {displayName}
                </p>
                <p className="text-[10px] text-mountain-400 truncate">
                  {currentUser?.email}
                </p>
              </div>
            </DropdownSection>

            <DropdownSection showDivider>
              <DropdownItem
                startContent={<IoPersonCircleOutline className="w-3.5 h-3.5" />}
                onClick={() => navigate("/dashboard/profile")}
              >
                My Profile
              </DropdownItem>
              <DropdownItem
                startContent={<IoSettingsOutline className="w-3.5 h-3.5" />}
                onClick={() => navigate("/dashboard/settings")}
              >
                Settings
              </DropdownItem>
            </DropdownSection>

            <DropdownItem
              color="danger"
              startContent={<IoLogOutOutline className="w-3.5 h-3.5" />}
              onClick={handleLogout}
            >
              Log Out
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>
    </header>
  );
};
