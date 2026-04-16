export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Procare Software Nepal",
  description:
    "Nepal's leading healthcare management platform designed specifically for medical professionals and healthcare facilities across the country.",
  navItems: [
    {
      label: "Home",
      href: "/",
    },
    {
      label: "Features",
      href: "/features",
    },
    {
      label: "About",
      href: "/about",
    },
  ],
  navMenuItems: [
    {
      label: "Features",
      href: "/features",
    },
    {
      label: "About",
      href: "/about",
    },
    {
      label: "Demo",
      href: "/demo",
    },
    {
      label: "Login",
      href: "/login",
    },
  ],
  links: {
    demo: "/demo",
    login: "/login",
    support: "/support",
    contact: "/contact",
    phone: "+977 986-0577865",
    email: "procarenepal@gmail.com",
  },
};
