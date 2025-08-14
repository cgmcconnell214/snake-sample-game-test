import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { UserPlus, ArrowRight } from "lucide-react";

const RegisterSection = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  return (
    <section id="register" className="py-16 lg:py-24 scroll-section opacity-0">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative">
            <div className="relative p-8 lg:p-16 bg-card/50 backdrop-blur-sm rounded-3xl border border-border shadow-luxury">
              <h2 className={`${
                isMobile ? 'text-3xl' : 'text-4xl md:text-5xl'
              } font-bold mb-8 text-divine-gold font-playfair`}>
                Join the Elite
              </h2>
              <p className={`${
                isMobile ? 'text-lg' : 'text-lg md:text-xl'
              } text-muted-foreground mb-8 font-inter`}>
                Secure your position in the world's most exclusive digital sanctuary.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button
                  size={isMobile ? "default" : "lg"}
                  className="bg-divine-gold text-divine-gold-foreground hover:bg-divine-gold-dark hover:scale-105 transition-all duration-500 shadow-divine font-inter font-semibold px-8 py-4 text-lg w-full sm:w-auto border-0"
                  onClick={() => navigate("/auth?mode=signup")}
                >
                  <UserPlus className="mr-2 h-5 w-5" />
                  Apply for Membership
                </Button>
                <Button
                  variant="ghost"
                  size={isMobile ? "default" : "lg"}
                  className="text-divine-gold hover:text-divine-gold-foreground hover:bg-divine-gold/10 transition-all duration-500 w-full sm:w-auto"
                  onClick={() => navigate("/auth?mode=signin")}
                >
                  Member Access
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RegisterSection;