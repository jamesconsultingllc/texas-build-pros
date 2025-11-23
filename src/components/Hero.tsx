import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-home.jpg";
import { ArrowRight } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative min-h-[50vh] flex items-center justify-center overflow-hidden">
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-navy/70"></div>
      </div>
      
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-4xl">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            Building Legacies.
            <span className="block text-gold">Delivering Results.</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl leading-relaxed">
            Strategic real estate investment and custom home construction across Texas. 
            We move fast, stay on budget, and deliver exceptional quality.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" className="bg-gold hover:bg-gold-light text-white text-lg h-14 px-8" asChild>
              <a href="#contact">
                Start Your Project
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
            <Button size="lg" variant="outline" className="bg-white/10 border-white text-white hover:bg-white hover:text-navy backdrop-blur-sm text-lg h-14 px-8" asChild>
              <a href="/portfolio">
                View Our Work
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
