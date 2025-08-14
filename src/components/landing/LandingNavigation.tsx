import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface LandingNavigationProps {
  scrollToSection: (id: string) => void;
}

const LandingNavigation = ({ scrollToSection }: LandingNavigationProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { label: "Mission", id: "mission" },
    { label: "Features", id: "features" },
    { label: "Trust", id: "trust" },
    { label: "Register", id: "register" },
  ];

  const handleNavClick = (id: string) => {
    scrollToSection(id);
    setIsOpen(false);
  };

  const NavLinks = () => (
    <>
      {navItems.map((item) => (
        <Button
          key={item.id}
          variant="ghost"
          onClick={() => handleNavClick(item.id)}
          className="text-muted-foreground hover:text-divine-gold transition-colors font-inter"
        >
          {item.label}
        </Button>
      ))}
      <Button
        variant="outline"
        onClick={() => navigate("/auth?mode=signin")}
        className="border-divine-gold text-divine-gold hover:bg-divine-gold hover:text-divine-gold-foreground transition-all duration-300"
      >
        Login
      </Button>
    </>
  );

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/95 backdrop-blur-md border-b border-divine-gold/20 shadow-lg">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo - Updated for mobile */}
          <div className="flex items-center space-x-2">
            <img 
              src="/lovable-uploads/5e27a9c9-6f52-4a64-9270-63f61c6b48cd.png" 
              alt="God's Realm Logo" 
              className="h-8 w-auto drop-shadow-lg" 
            />
          </div>

          {/* Desktop Navigation */}
          {!isMobile && (
            <div className="flex items-center space-x-6">
              <NavLinks />
            </div>
          )}

          {/* Mobile Navigation */}
          {isMobile && (
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-divine-gold">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64 bg-background/95 backdrop-blur-md border-divine-gold/20">
                <div className="flex flex-col space-y-4 mt-8">
                  <NavLinks />
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>
    </nav>
  );
};

export default LandingNavigation;