import Logo from "@/components/Logo";

const Footer = () => {
  return (
    <footer className="bg-navy text-white py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[80%]">
        <div className="grid md:grid-cols-3 gap-4 mb-8 text-center">
          <div>
            <a href="/" aria-label="Go to Home">
              <Logo className="h-40 w-full md:h-40 lg:h-40 w-auto mx-auto text-white -mt-4" ariaLabel="Legacy Builders" houseColor="#ffffff" />
            </a>
            <p className="text-white/80 -mt-4">
              Building exceptional homes and creating lasting value across Texas.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-4 text-gold">Services</h2>
            <ul className="space-y-2 text-white/80">
              <li>Real Estate Investment</li>
              <li>Custom Home Building</li>
              <li>Property Development</li>
              <li>Major Renovations</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-4 text-gold">Contact</h2>
            <ul className="space-y-2 text-white/80">
              <li>(214) 997-3361</li>
              <li><a href="mailto:contact@lbinvestmentsllc.com">contact@lbinvestmentsllc.com</a></li>
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
