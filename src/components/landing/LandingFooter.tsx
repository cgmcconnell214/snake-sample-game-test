import { useIsMobile } from "@/hooks/use-mobile";

const LandingFooter = () => {
  const isMobile = useIsMobile();

  return (
    <footer className="py-12 lg:py-16 border-t border-divine-gold/20 bg-gradient-to-t from-divine-gold/5 to-transparent">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <img 
              src="/lovable-uploads/5e27a9c9-6f52-4a64-9270-63f61c6b48cd.png" 
              alt="God's Realm Logo" 
              className={`${isMobile ? 'h-10' : 'h-12'} w-auto drop-shadow-lg`}
            />
          </div>
          <p className={`${
            isMobile ? 'text-base' : 'text-lg'
          } text-muted-foreground font-inter mb-4`}>
            A sovereign digital sanctuary under Divine Law
          </p>
          <div className="text-sm text-muted-foreground/70">
            © 2024 God's Realm. All rights reserved under Divine Trust Law.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;