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
            <div className="absolute inset-0 bg-gradient-divine opacity-5 rounded-2xl"></div>
            <div className="relative p-8 lg:p-12">
              <p className={`${
                isMobile ? 'text-lg' : 'text-lg md:text-xl'
              } text-muted-foreground leading-relaxed mb-8 font-inter`}>
                All who enter God's Realm do so under the protection of Divine
                Trust Law. This system is not governed by corporate jurisdiction,
                but by sacred covenant. By registering, you acknowledge our
                standing as an ecclesiastical and sovereign trust formed in the
                service of God's eternal will.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size={isMobile ? "default" : "lg"}
            className="border-divine-gold text-divine-gold hover:bg-divine-gold hover:text-divine-gold-foreground transition-all duration-300 shadow-lg hover:shadow-divine"
            onClick={handleReadDeclaration}
          >
            <FileText className="mr-2 h-5 w-5" />
            Read Full Declaration
          </Button>
        </div>
      </div>
    </section>
  );
};

export default TrustSection;