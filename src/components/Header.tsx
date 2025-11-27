import { useState } from "react";
import Logo from "@/components/Logo";
import { Menu, X, LogIn, LogOut, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isAdmin, isLoading, login, logout } = useAuth();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  
  const closeMenu = () => setIsMenuOpen(false);

  const renderDesktopAuth = () => {
    if (isLoading) {
      return <span className="text-muted-foreground text-sm">Loading...</span>;
    }

    if (user) {
      return (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-foreground">
            <User size={16} className="text-gold" />
            <span className="text-sm font-medium">{user.userDetails}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            className="flex items-center gap-2"
          >
            <LogOut size={16} />
            Logout
          </Button>
        </div>
      );
    }

    return (
      <Button
        variant="outline"
        size="sm"
        onClick={login}
        className="flex items-center gap-2"
      >
        <LogIn size={16} />
        Login
      </Button>
    );
  };

  const renderMobileAuth = () => {
    if (isLoading) {
      return <span className="text-muted-foreground text-base py-2">Loading...</span>;
    }

    if (user) {
      return (
        <>
          <div className="flex items-center gap-2 text-foreground py-2">
            <User size={18} className="text-gold" />
            <span className="font-medium">{user.userDetails}</span>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              closeMenu();
              logout();
            }}
            className="flex items-center gap-2 justify-center"
          >
            <LogOut size={18} />
            Logout
          </Button>
        </>
      );
    }

    return (
      <Button
        variant="outline"
        onClick={() => {
          closeMenu();
          login();
        }}
        className="flex items-center gap-2 justify-center"
      >
        <LogIn size={18} />
        Login
      </Button>
    );
  };

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
            <div className="hidden md:flex items-center space-x-3">
              {renderDesktopAuth()}
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
                {renderMobileAuth()}
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
