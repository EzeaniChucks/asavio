// components/layout/Footer.tsx
import Link from "next/link";
import {
  FaInstagram,
  FaTwitter,
  FaFacebookF,
  FaLinkedinIn,
} from "react-icons/fa";

const footerLinks = {
  Explore: [
    { label: "Properties", href: "/properties" },
    { label: "Luxury Vehicles", href: "/vehicles" },
    { label: "Search", href: "/search" },
  ],
  Company: [
    { label: "About Us", href: "/about" },
    { label: "Careers", href: "/careers" },
    { label: "Press", href: "/press" },
  ],
  Support: [
    { label: "Help Center", href: "/help" },
    { label: "Contact Us", href: "/contact" },
    { label: "Safety", href: "/safety" },
  ],
  Hosting: [
    { label: "Become a Host", href: "/register?role=host" },
    { label: "Host Resources", href: "/host-resources" },
    { label: "Host Dashboard", href: "/dashboard/host" },
  ],
};

const socialLinks = [
  { icon: <FaInstagram />, href: "#", label: "Instagram" },
  { icon: <FaTwitter />, href: "#", label: "Twitter" },
  { icon: <FaFacebookF />, href: "#", label: "Facebook" },
  { icon: <FaLinkedinIn />, href: "#", label: "LinkedIn" },
];

export default function Footer() {
  return (
    <footer className="bg-black text-white pt-16 pb-8">
      <div className="container mx-auto px-4">
        {/* Top section */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link
              href="/"
              className="font-playfair text-2xl font-bold text-secondary mb-4 block"
            >
              Asavio
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed">
              Premium shortlet properties and luxury vehicles for the
              discerning traveller.
            </p>
            {/* Social */}
            <div className="flex gap-3 mt-6">
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="w-9 h-9 rounded-full border border-gray-700 flex items-center justify-center text-gray-400 hover:border-secondary hover:text-secondary transition-colors"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([group, links]) => (
            <div key={group}>
              <h4 className="font-semibold text-white mb-4">{group}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-gray-400 text-sm hover:text-secondary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <hr className="border-gray-800 mb-8" />

        {/* Bottom */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Asavio. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-secondary transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-secondary transition-colors">
              Terms of Service
            </Link>
            <Link href="/cookies" className="hover:text-secondary transition-colors">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
