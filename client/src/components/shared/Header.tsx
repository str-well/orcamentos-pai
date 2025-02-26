import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { Menu, Plus, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/budgets", label: "Orçamentos" },
  { href: "/budgets/new", label: "Novo Orçamento", icon: Plus },
];

export function Header() {
  const { logoutMutation } = useAuth();
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/') {
      return location === path;
    }
    return location.startsWith(path);
  };

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        duration: 0.6,
        ease: [0.43, 0.13, 0.23, 0.96],
        y: { duration: 0.6 },
        opacity: { duration: 0.8 }
      }}
      className="bg-white border-b sticky top-0 z-50"
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <motion.h1
            className="text-xl sm:text-2xl font-bold"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.3 }}
          >
            JH Serviços
          </motion.h1>

          {/* Desktop Navigation */}
          <div className="hidden md:flex gap-4">
            {links.map((link, index) => (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.3,
                  delay: index * 0.1,
                  ease: [0.43, 0.13, 0.23, 0.96]
                }}
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button
                    variant="outline"
                    className={cn(
                      "transition-colors duration-200",
                      isActive(link.href) && "bg-black text-white hover:bg-black/90"
                    )}
                    asChild
                  >
                    <Link href={link.href}>
                      {link.icon && <link.icon className="h-4 w-4 mr-2" />}
                      {link.label}
                    </Link>
                  </Button>
                </motion.div>
              </motion.div>
            ))}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.3,
                delay: 0.3,
                ease: [0.43, 0.13, 0.23, 0.96]
              }}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Button variant="outline" onClick={() => logoutMutation.mutate()}>
                  Sair
                </Button>
              </motion.div>
            </motion.div>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[80vw] sm:w-[350px] p-0">
                <SheetHeader className="p-6 border-b">
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col py-2">
                  {links.map((link) => (
                    <Button
                      key={link.href}
                      variant="ghost"
                      className={cn(
                        "justify-start rounded-none h-12 px-6",
                        isActive(link.href) && "bg-black text-white hover:bg-black/90"
                      )}
                      asChild
                      onClick={() => setIsOpen(false)}
                    >
                      <Link href={link.href}>
                        {link.icon && <link.icon className="h-4 w-4 mr-2" />}
                        {link.label}
                      </Link>
                    </Button>
                  ))}
                  <Button
                    variant="ghost"
                    className="justify-start rounded-none h-12 px-6 mt-auto"
                    onClick={() => {
                      setIsOpen(false);
                      logoutMutation.mutate();
                    }}
                  >
                    Sair
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </motion.header>
  );
} 