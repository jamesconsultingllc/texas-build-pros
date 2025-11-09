import { useState } from "react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import { Menu, X } from "lucide-react";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="bg-background border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center md:justify-between h-40 relative">
          <div className="flex items-center">
            <Logo className="h-40 w-auto text-foreground" ariaLabel="Legacy Builders" />
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8 text-base md:text-lg lg:text-2xl">
            <a href="#services" className="text-foreground hover:text-gold transition-colors font-medium">
              Services
            </a>
            <a href="#about" className="text-foreground hover:text-gold transition-colors font-medium">
              About
            </a>
            <a href="#contact" className="text-foreground hover:text-gold transition-colors font-medium">
              Contact
            </a>
          </nav>

          <div className="flex items-center space-x-4">
            <Button variant="outline" className="hidden md:inline-flex">
              Schedule Consultation
            </Button>
            
            {/* Mobile Menu Button */}
            <button
              onClick={toggleMenu}
              className="md:hidden p-2 text-foreground hover:text-gold transition-colors absolute right-0"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col space-y-4">
              <a 
                href="#services" 
                className="text-foreground hover:text-gold transition-colors font-medium text-lg py-2"
                onClick={closeMenu}
              >
                Services
              </a>
              <a 
                href="#about" 
                className="text-foreground hover:text-gold transition-colors font-medium text-lg py-2"
                onClick={closeMenu}
              >
                About
              </a>
              <a 
                href="#contact" 
                className="text-foreground hover:text-gold transition-colors font-medium text-lg py-2"
                onClick={closeMenu}
              >
                Contact
              </a>
              <Button variant="outline" className="w-full" onClick={closeMenu}>
                Schedule Consultation
              </Button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
