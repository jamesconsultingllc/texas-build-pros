import Logo from "@/components/Logo";

const Footer = () => {
  return (
    <footer className="bg-navy text-white py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div>
            <Logo className="h-24 md:h-32 lg:h-40 w-auto mx-auto text-white" ariaLabel="Legacy Builders" houseColor="#ffffff" />
            <p className="text-white/80">
              Building exceptional homes and creating lasting value across Texas.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4 text-gold">Services</h3>
            <ul className="space-y-2 text-white/80">
              <li>Real Estate Investment</li>
              <li>Custom Home Building</li>
              <li>Property Development</li>
              <li>Major Renovations</li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4 text-gold">Contact</h3>
            <ul className="space-y-2 text-white/80">
              <li>Texas, USA</li>
              <li>(555) 123-4567</li>
              <li>info@legacybuilders.com</li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/20 pt-8 text-center text-white/60">
          <p>&copy; {new Date().getFullYear()} Legacy Builders. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
