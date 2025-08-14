import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { FileText } from "lucide-react";

const TrustSection = () => {
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const handleReadDeclaration = () => {
    toast({
      title: "Sacred Declaration",
      description: "Opening the full divine trust declaration",
    });
  };

  return (
    <section id="trust" className="py-16 lg:py-24 scroll-section opacity-0">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className={`${
            isMobile ? 'text-3xl' : 'text-4xl md:text-5xl'
          } font-bold mb-8 text-divine-gold font-playfair`}>
            The Sacred Trust
          </h2>
          <div className="relative mb-8">
            <div className="relative p-8 lg:p-12 bg-card/50 backdrop-blur-sm rounded-2xl border border-border shadow-elegant">
              <p className={`${
                isMobile ? 'text-lg' : 'text-lg md:text-xl'
              } text-muted-foreground leading-relaxed mb-8 font-inter`}>
                Entry into God's Realm establishes membership within an exclusive ecclesiastical trust, 
                governed not by conventional corporate structures, but by divine covenant and sacred law. 
                Our jurisdiction operates under the highest principles of sovereignty, offering unmatched 
                protection and discretion for the most discerning clientele.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size={isMobile ? "default" : "lg"}
            className="border-divine-gold/30 text-divine-gold hover:bg-divine-gold/10 hover:border-divine-gold transition-all duration-500 shadow-elegant hover:shadow-divine"
            onClick={handleReadDeclaration}
          >
            <FileText className="mr-2 h-5 w-5" />
            Review Trust Declaration
          </Button>
        </div>
      </div>
    </section>
  );
};

export default TrustSection;