import { useIsMobile } from "@/hooks/use-mobile";

const MissionSection = () => {
  const isMobile = useIsMobile();

  return (
    <section id="mission" className="py-16 lg:py-24 scroll-section opacity-0">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className={`${
            isMobile ? 'text-3xl' : 'text-4xl md:text-5xl'
          } font-bold mb-8 text-divine-gold font-playfair`}>
            Our Mission
          </h2>
          <div className="relative">
            <div className="relative p-8 lg:p-12 bg-card/50 backdrop-blur-sm rounded-2xl border border-border shadow-elegant">
              <p className={`${
                isMobile ? 'text-lg' : 'text-lg md:text-xl'
              } text-muted-foreground leading-relaxed font-inter`}>
                God's Realm serves as an exclusive digital sanctuary for the world's most sophisticated individuals. 
                We provide unparalleled asset tokenization, divine governance protocols, and peer-to-peer trading 
                under the highest standards of security and discretion. This is where legacy meets innovation 
                in the most refined digital environment.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MissionSection;