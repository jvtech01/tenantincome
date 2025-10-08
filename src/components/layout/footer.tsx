import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Github, Twitter, Linkedin } from 'lucide-react';
import Link from 'next/link';

const socialLinks = [
  { name: 'GitHub', icon: Github, url: '#' },
  { name: 'Twitter', icon: Twitter, url: '#' },
  { name: 'LinkedIn', icon: Linkedin, url: '#' },
];

const footerLinks = [
    {
        title: "Properties",
        links: [
            { name: "Browse", href: "/browse" },
            { name: "List Your Apartment", href: "/list" },
        ]
    },
    {
        title: "Company",
        links: [
            { name: "About Us", href: "#" },
            { name: "Contact", href: "/contact" },
            { name: "Careers", href: "#" },
        ]
    },
    {
        title: "Legal",
        links: [
            { name: "Terms of Service", href: "#" },
            { name: "Privacy Policy", href: "#" },
        ]
    }
];

export function Footer() {
  return (
    <footer className="border-t bg-card">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="flex flex-col gap-4 md:col-span-1">
            <Logo />
            <p className="text-sm text-muted-foreground">
              Tenant Powered Rentals. No Agents. Earn 5% for Listing Your Apartment.
            </p>
            <div className="flex gap-2">
              {socialLinks.map((social) => (
                <Button key={social.name} variant="ghost" size="icon" asChild>
                  <a href={social.url} aria-label={social.name}>
                    <social.icon className="h-5 w-5" />
                  </a>
                </Button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 md:col-span-3 md:grid-cols-3">
            {footerLinks.map((section) => (
              <div key={section.title}>
                <h3 className="font-headline font-semibold">{section.title}</h3>
                <ul className="mt-4 space-y-2">
                  {section.links.map((link) => (
                    <li key={link.name}>
                      <Link href={link.href} className="text-sm text-muted-foreground hover:text-primary">
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} JVHOUZIN. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
