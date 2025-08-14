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
            <div className="absolute inset-0 bg-gradient-divine opacity-10 rounded-3xl"></div>
            <div className="relative p-8 lg:p-16">
              <h2 className={`${
                isMobile ? 'text-3xl' : 'text-4xl md:text-5xl'
              } font-bold mb-8 text-divine-gold font-playfair`}>
                Ready to Enter?
              </h2>
              <p className={`${
                isMobile ? 'text-lg' : 'text-lg md:text-xl'
              } text-muted-foreground mb-8 font-inter`}>
                Sign the Book of Entry and claim your sovereign rights.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button
                  size={isMobile ? "default" : "lg"}
                  className="bg-gradient-divine text-divine-gold-foreground hover:scale-105 transition-all duration-300 shadow-divine font-inter font-semibold px-8 py-4 text-lg w-full sm:w-auto"
                  onClick={() => navigate("/auth?mode=signup")}
                >
                  <UserPlus className="mr-2 h-5 w-5" />
                  Register Now
                </Button>
                <Button
                  variant="ghost"
                  size={isMobile ? "default" : "lg"}
                  className="text-divine-gold hover:text-divine-gold-foreground hover:bg-divine-gold/10 transition-all duration-300 w-full sm:w-auto"
                  onClick={() => navigate("/auth?mode=signin")}
                >
                  Already a Member?
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