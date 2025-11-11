import { Mail, Phone } from "lucide-react";
import ContactForm from "./ContactForm";

const CTA = () => {
  return (
    <section id="contact" className="py-6 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 md:mb-6">
            Ready to Build Your Legacy?
          </h2>
          <p className="text-xl text-muted-foreground mb-1 max-w-2xl mx-auto">
            Whether you're investing in your next property or building your dream home, 
            let's discuss how we can bring your vision to life.
          </p>

          <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto mt-12">
            <div className="flex items-center justify-center gap-3 p-6 bg-muted rounded-lg">
              <Phone className="h-6 w-6 text-gold flex-shrink-0" />
              <div className="text-left">
                <div className="text-sm text-muted-foreground">Call Us</div>
                <div className="text-lg font-semibold text-foreground">(214) 997-3361</div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3 p-6 bg-muted rounded-lg">
              <Mail className="h-6 w-6 text-gold flex-shrink-0" />
              <div className="text-left">
                <div className="text-sm text-muted-foreground">Email Us</div>
                <div className="text-lg font-semibold text-foreground"><a href="mailto:contact@lbinvestmentsllc.com">contact@lbinvestmentsllc.com</a></div>
              </div>
            </div>
          </div>
          
          <ContactForm />

          
        </div>
      </div>
    </section>
  );
};

export default CTA;
