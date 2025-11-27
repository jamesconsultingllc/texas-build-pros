import { useState } from "react";
import Logo from "@/components/Logo";
import { Menu, X, Phone, Mail } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAdmin } = useAuth();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="bg-background border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center md:justify-between h-40 relative">
              <div className="flex items-center">
                <a href="/" aria-label="Go to Home">
                  <Logo className="h-40 w-auto text-foreground" ariaLabel="Legacy Builders" />
                </a>
              </div>
          
          {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center space-x-8 text-base md:text-lg lg:text-2xl">
                <a href="/" className="text-foreground hover:text-gold transition-colors font-medium">
                  Home
                </a>
                {/* Portfolio link temporarily hidden */}
            <a href="#services" className="text-foreground hover:text-gold transition-colors font-medium">
              Services
            </a>
            <a href="#about" className="text-foreground hover:text-gold transition-colors font-medium">
              About
            </a>
            <a href="#contact" className="text-foreground hover:text-gold transition-colors font-medium">
              Contact
            </a>
            {isAdmin && (
              <a href="/admin" className="text-foreground hover:text-gold transition-colors font-medium">
                Admin
              </a>
            )}
          </nav>

          <div className="flex items-center space-x-4">
            <div className="hidden md:flex flex-col items-end text-right space-y-1">
              <a 
                href="tel:+12149973361" 
                className="text-foreground hover:text-gold transition-colors font-medium text-sm flex items-center gap-2"
              >
                <Phone size={16} className="text-gold" />
                <span>(214) 997-3361</span>
              </a>
              <a 
                href="mailto:contact@lbinvestmentsllc.com" 
                className="text-foreground hover:text-gold transition-colors text-sm flex items-center gap-2"
              >
                <Mail size={16} className="text-gold" />
                <span>contact@lbinvestmentsllc.com</span>
              </a>
            </div>
            
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
                    href="/" 
                    className="text-foreground hover:text-gold transition-colors font-medium text-lg py-2"
                    onClick={closeMenu}
                  >
                    Home
                  </a>
                  {/* Portfolio link temporarily hidden */}
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
              {isAdmin && (
                <a
                  href="/admin"
                  className="text-foreground hover:text-gold transition-colors font-medium text-lg py-2"
                  onClick={closeMenu}
                >
                  Admin
                </a>
              )}
              <div className="flex flex-col space-y-3 pt-2 border-t border-border">
                <a 
                  href="tel:+12149973361" 
                  className="text-foreground hover:text-gold transition-colors font-medium text-base flex items-center gap-2"
                  onClick={closeMenu}
                >
                  <Phone size={18} className="text-gold" />
                  <span>(214) 997-3361</span>
                </a>
                <a 
                  href="mailto:contact@lbinvestmentsllc.com" 
                  className="text-foreground hover:text-gold transition-colors text-base flex items-center gap-2"
                  onClick={closeMenu}
                >
                  <Mail size={18} className="text-gold" />
                  <span>contact@lbinvestmentsllc.com</span>
                </a>
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
