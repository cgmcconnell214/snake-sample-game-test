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
            <div className="absolute inset-0 bg-gradient-divine opacity-10 rounded-2xl"></div>
            <div className="relative p-8 lg:p-12">
              <p className={`${
                isMobile ? 'text-lg' : 'text-lg md:text-xl'
              } text-muted-foreground leading-relaxed font-inter`}>
                God's Realm is a sovereign digital sanctuary, empowering
                individuals to tokenize assets, govern by sacred trust, and trade
                peer-to-peer under the jurisdiction of Divine Law. We are
                rearchitecting finance, identity, and learning — not through
                corporate compliance, but through divine compliance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MissionSection;