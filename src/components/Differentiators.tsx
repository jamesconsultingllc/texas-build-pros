import { Clock, DollarSign, MessageSquare } from "lucide-react";

const Differentiators = () => {
  const features = [
    {
      icon: Clock,
      title: "Fast Execution",
      description: "We move quickly without cutting corners. Timelines that make sense for your project and your life.",
    },
    {
      icon: DollarSign,
      title: "Budget Discipline",
      description: "Fixed pricing. No change-order games. Your budget is our commitment from day one.",
    },
    {
      icon: MessageSquare,
      title: "Total Transparency",
      description: "Clear communication at every phase. You always know where your project stands.",
    },
  ];

  return (
    <section id="about" className="py-24 bg-navy text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Why Choose Legacy Builders
          </h2>
          <p className="text-xl text-white/80 max-w-3xl mx-auto">
            We're not a side-hustle contractor. We're a professional development and construction firm 
            built on accountability, speed, and results.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gold/20 rounded-full mb-6">
                <feature.icon className="h-8 w-8 text-gold" />
              </div>
              <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
              <p className="text-white/80 text-lg leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Differentiators;
