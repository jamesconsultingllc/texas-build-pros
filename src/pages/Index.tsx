import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import Differentiators from "@/components/Differentiators";
import CallToAction from "@/components/CallToAction.tsx";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      <Services />
      <Differentiators />
      <CallToAction />
      <Footer />
    </div>
  );
};

export default Index;
