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
      className={`min-h-screen flex items-center justify-center relative overflow-hidden ${
        isVisible ? "animate-fade-in" : "opacity-0"
      }`}
    >
      {/* Optimized Animated Background */}
      <div className="absolute inset-0 bg-gradient-divine">
        <div className="absolute inset-0">
          {[...Array(isMobile ? 20 : 50)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-divine-gold/10 animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${Math.random() * (isMobile ? 3 : 4) + 1}px`,
                height: `${Math.random() * (isMobile ? 3 : 4) + 1}px`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${Math.random() * 3 + 2}s`,
              }}
            />
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-6 text-center relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Logo Display */}
          <div className="mb-8 flex justify-center">
            <img 
              src="/lovable-uploads/5e27a9c9-6f52-4a64-9270-63f61c6b48cd.png" 
              alt="God's Realm - Divine Sanctuary" 
              className={`${isMobile ? 'h-24' : 'h-32'} w-auto drop-shadow-2xl animate-glow`}
            />
          </div>
          
          <h1 className={`${
            isMobile ? 'text-4xl' : 'text-5xl md:text-7xl'
          } font-bold font-playfair mb-6 bg-gradient-text bg-clip-text text-transparent leading-tight`}>
            Welcome to the Divine Sanctuary
          </h1>
          
          <p className={`${
            isMobile ? 'text-lg' : 'text-xl md:text-2xl'
          } text-muted-foreground mb-8 max-w-3xl mx-auto font-inter leading-relaxed`}>
            Tokenize your assets, secure your rights, and operate under Divine
            Law in the ultimate sovereign digital realm.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              onClick={() => scrollToSection("register")}
              size={isMobile ? "default" : "lg"}
              className="bg-gradient-divine text-divine-gold-foreground hover:scale-105 transition-all duration-300 shadow-divine font-inter font-semibold px-8 py-4 text-lg w-full sm:w-auto"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Enter the Realm
            </Button>
            
            <Button
              onClick={() => scrollToSection("mission")}
              variant="outline"
              size={isMobile ? "default" : "lg"}
              className="border-divine-gold/50 text-divine-gold hover:bg-divine-gold/10 hover:border-divine-gold transition-all duration-300 w-full sm:w-auto"
            >
              Learn More
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;