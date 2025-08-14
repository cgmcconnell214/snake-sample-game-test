import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface HeroSectionProps {
  isVisible: boolean;
  scrollToSection: (id: string) => void;
}

const HeroSection = ({ isVisible, scrollToSection }: HeroSectionProps) => {
  const isMobile = useIsMobile();

  return (
    <section
      className={`min-h-screen flex items-center justify-center relative overflow-hidden pt-20 ${
        isVisible ? "animate-fade-in" : "opacity-0"
      }`}
    >
      {/* Luxury Subtle Background */}
      <div className="absolute inset-0 bg-gradient-hero">
        <div className="absolute inset-0">
          {[...Array(isMobile ? 8 : 15)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-divine-gold/5 animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${Math.random() * (isMobile ? 2 : 3) + 1}px`,
                height: `${Math.random() * (isMobile ? 2 : 3) + 1}px`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${Math.random() * 4 + 3}s`,
              }}
            />
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-6 text-center relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Removed duplicate logo - using only header logo */}
          
          <h1 className={`${
            isMobile ? 'text-4xl' : 'text-5xl md:text-7xl'
          } font-bold font-playfair mb-6 text-foreground leading-tight`}>
            <span className="text-divine-gold">God's Realm</span>
            <br />
            <span className="text-muted-foreground text-3xl md:text-5xl font-inter font-light">
              The Sovereign Digital Sanctuary
            </span>
          </h1>
          
          <p className={`${
            isMobile ? 'text-lg' : 'text-xl md:text-2xl'
          } text-muted-foreground mb-8 max-w-3xl mx-auto font-inter leading-relaxed`}>
            Tokenize assets, secure rights, and operate under Divine Law in the ultimate luxury digital realm for discerning individuals.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12">
            <Button
              onClick={() => scrollToSection("register")}
              size={isMobile ? "default" : "lg"}
              className="bg-divine-gold text-divine-gold-foreground hover:bg-divine-gold-dark hover:scale-105 transition-all duration-500 shadow-divine font-inter font-semibold px-8 py-4 text-lg w-full sm:w-auto border-0"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Enter the Realm
            </Button>
            
            <Button
              onClick={() => scrollToSection("mission")}
              variant="outline"
              size={isMobile ? "default" : "lg"}
              className="border-divine-gold/30 text-divine-gold hover:bg-divine-gold/10 hover:border-divine-gold transition-all duration-500 w-full sm:w-auto"
            >
              Discover More
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;