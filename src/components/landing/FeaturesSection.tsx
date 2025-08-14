import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Shield, Coins, Scale, Crown, Users } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const FeaturesSection = () => {
  const isMobile = useIsMobile();

  const features = [
    {
      icon: Coins,
      title: "Tokenize real-world assets and sacred IP",
      description: "Transform physical and intellectual property into secure digital tokens",
    },
    {
      icon: Shield,
      title: "Trade P2P under customizable smart contracts",
      description: "Direct peer-to-peer trading with divinely governed smart contracts",
    },
    {
      icon: Scale,
      title: "Navigate with zero-trust security & KYC tiers",
      description: "Multi-layered security with sovereign identity verification",
    },
    {
      icon: Crown,
      title: "Automate compliance under sovereign audit trails",
      description: "Divine law compliance with transparent, immutable records",
    },
    {
      icon: Sparkles,
      title: "Submit to Divine Trust law and access higher jurisdictions",
      description: "Operate under sacred covenant and divine jurisdiction",
    },
    {
      icon: Users,
      title: "Join live councils, initiations, and economic ceremonies",
      description: "Participate in sacred governance and community rituals",
    },
  ];

  return (
    <section id="features" className="py-16 lg:py-24 scroll-section opacity-0">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className={`${
              isMobile ? 'text-3xl' : 'text-4xl md:text-5xl'
            } font-bold text-divine-gold font-playfair mb-4`}>
              What You Can Do Inside
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-inter">
              Discover the powerful features that make God's Realm the ultimate sovereign digital sanctuary
            </p>
          </div>
          
          <div className={`grid ${
            isMobile ? 'grid-cols-1 gap-6' : 'md:grid-cols-2 lg:grid-cols-3 gap-8'
          }`}>
            {features.map((feature, index) => (
              <Card
                key={index}
                className="group bg-card/80 backdrop-blur-sm border-divine-gold/20 hover:border-divine-gold/40 transition-all duration-500 hover:shadow-divine hover:scale-105"
              >
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="p-3 rounded-lg bg-divine-gold/10 group-hover:bg-divine-gold/20 transition-colors duration-300">
                      <feature.icon className="h-8 w-8 text-divine-gold" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-foreground font-playfair">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground font-inter leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;