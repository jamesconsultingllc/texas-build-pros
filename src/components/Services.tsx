import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Home, CheckCircle } from "lucide-react";
import constructionImage from "@/assets/construction.jpg";
import interiorImage from "@/assets/interior.jpg";

const Services = () => {
  return (
    <section id="services" className="py-10 bg-muted">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            What We Do
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Two core services. One commitment to excellence.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-10">
          <Card className="overflow-hidden border-2 hover:border-gold transition-colors">
            <div 
              className="h-64 bg-cover bg-center"
              style={{ backgroundImage: `url(${constructionImage})` }}
            />
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gold/10 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-gold" />
                </div>
                <CardTitle className="text-2xl">Real Estate Investment</CardTitle>
              </div>
              <CardDescription className="text-base">
                Strategic acquisitions, redevelopment, and value-add opportunities across Texas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-gold mt-0.5 flex-shrink-0" />
                  <span className="text-foreground">Property acquisition and market analysis</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-gold mt-0.5 flex-shrink-0" />
                  <span className="text-foreground">Value-add repositioning strategies</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-gold mt-0.5 flex-shrink-0" />
                  <span className="text-foreground">Spec home development for investors</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-2 hover:border-gold transition-colors">
            <div 
              className="h-64 bg-cover bg-center"
              style={{ backgroundImage: `url(${interiorImage})` }}
            />
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gold/10 rounded-lg">
                  <Home className="h-6 w-6 text-gold" />
                </div>
                <CardTitle className="text-2xl">Custom Home Building</CardTitle>
              </div>
              <CardDescription className="text-base">
                Ground-up construction and major renovations built to the highest standards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-gold mt-0.5 flex-shrink-0" />
                  <span className="text-foreground">Custom luxury home construction</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-gold mt-0.5 flex-shrink-0" />
                  <span className="text-foreground">Complete home renovations and additions</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-gold mt-0.5 flex-shrink-0" />
                  <span className="text-foreground">Premium finishes and craftsmanship</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Services;
