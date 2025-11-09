import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center">
            <Logo className="h-16 md:h-20 w-auto text-foreground" ariaLabel="Legacy Builders" />
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
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
            <Button variant="outline" className="hidden sm:inline-flex">
              Schedule Consultation
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
