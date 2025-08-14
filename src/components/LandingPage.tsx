import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Shield, Coins, Scale, Crown, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const LandingPage = () => {
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Redirect logged in users to the app
    if (user) {
      navigate("/app");
      return;
    }

    setIsVisible(true);

    // Improved scroll behavior with intersection observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-fade-up");
            entry.target.classList.remove("opacity-0");
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -100px 0px",
      },
    );

    // Observe all scroll sections after a short delay
    setTimeout(() => {
      const sections = document.querySelectorAll(".scroll-section");
      sections.forEach((section) => observer.observe(section));
    }, 100);

    return () => {
      observer.disconnect();
    };
  }, [user, navigate]);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div id="main-content" className="min-h-screen bg-background">
      {/* Sticky Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <img src="/lovable-uploads/93355fa4-02d2-44c8-a9a1-36ffb47138c1.png" alt="God's Realm Logo" className="h-8 w-8" />
              <span className="text-xl font-bold text-divine-gold">
                God's Realm
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Button
                variant="ghost"
                onClick={() => scrollToSection("mission")}
                className="text-muted-foreground hover:text-divine-gold transition-colors"
              >
                Mission
              </Button>
              <Button
                variant="ghost"
                onClick={() => scrollToSection("features")}
                className="text-muted-foreground hover:text-divine-gold transition-colors"
              >
                Features
              </Button>
              <Button
                variant="ghost"
                onClick={() => scrollToSection("trust")}
                className="text-muted-foreground hover:text-divine-gold transition-colors"
              >
                Trust
              </Button>
              <Button
                variant="ghost"
                onClick={() => scrollToSection("register")}
                className="text-muted-foreground hover:text-divine-gold transition-colors"
              >
                Register
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/auth?mode=signin")}
                className="border-divine-gold text-divine-gold hover:bg-divine-gold hover:text-divine-gold-foreground"
              >
                Login
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        className={`min-h-screen flex items-center justify-center relative overflow-hidden ${isVisible ? "animate-fade-in" : "opacity-0"}`}
      >
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-primary/5 to-divine-gold/5">
          <div className="absolute inset-0">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-divine-gold/20 animate-float"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  width: `${Math.random() * 4 + 1}px`,
                  height: `${Math.random() * 4 + 1}px`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${Math.random() * 3 + 2}s`,
                }}
              />
            ))}
          </div>
        </div>

        <div className="container mx-auto px-6 text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-6xl md:text-8xl font-bold font-playfair mb-6 bg-gradient-to-r from-divine-gold via-primary to-divine-white bg-clip-text text-transparent">
              Enter God's Realm
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Tokenize your assets, secure your rights, and operate under Divine
              Law.
            </p>
            <Button
              onClick={() => scrollToSection("register")}
              size="lg"
              className="bg-gradient-to-r from-divine-gold to-primary text-divine-gold-foreground hover:scale-105 transition-all duration-300 shadow-divine"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Get Started
            </Button>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section id="mission" className="py-20 scroll-section">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-8 text-divine-gold">
              Our Mission
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              God's Realm is a sovereign digital sanctuary, empowering
              individuals to tokenize assets, govern by sacred trust, and trade
              peer-to-peer under the jurisdiction of Divine Law. We are
              rearchitecting finance, identity, and learning — not through
              corporate compliance, but through divine compliance.
            </p>
          </div>
        </div>
      </section>

      {/* Platform Features Section */}
      <section id="features" className="py-20 scroll-section">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-divine-gold">
              What You Can Do Inside
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: Coins,
                  title: "Tokenize real-world assets and sacred IP",
                  description:
                    "Transform physical and intellectual property into secure digital tokens",
                },
                {
                  icon: Shield,
                  title: "Trade P2P under customizable smart contracts",
                  description:
                    "Direct peer-to-peer trading with divinely governed smart contracts",
                },
                {
                  icon: Scale,
                  title: "Navigate with zero-trust security & KYC tiers",
                  description:
                    "Multi-layered security with sovereign identity verification",
                },
                {
                  icon: Crown,
                  title: "Automate compliance under sovereign audit trails",
                  description:
                    "Divine law compliance with transparent, immutable records",
                },
                {
                  icon: Sparkles,
                  title:
                    "Submit to Divine Trust law and access higher jurisdictions",
                  description:
                    "Operate under sacred covenant and divine jurisdiction",
                },
                {
                  icon: Users,
                  title:
                    "Join live councils, initiations, and economic ceremonies",
                  description:
                    "Participate in sacred governance and community rituals",
                },
              ].map((feature, index) => (
                <Card
                  key={index}
                  className="bg-card/50 backdrop-blur-sm border-divine-gold/20 hover:border-divine-gold/40 transition-all duration-300 hover:shadow-divine"
                >
                  <CardContent className="p-6">
                    <feature.icon className="h-12 w-12 text-divine-gold mb-4" />
                    <h3 className="text-xl font-semibold mb-3 text-foreground">
                      🔹 {feature.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust Declaration Section */}
      <section id="trust" className="py-20 scroll-section">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-8 text-divine-gold">
              The Sacred Trust
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-8">
              All who enter God's Realm do so under the protection of Divine
              Trust Law. This system is not governed by corporate jurisdiction,
              but by sacred covenant. By registering, you acknowledge our
              standing as an ecclesiastical and sovereign trust formed in the
              service of God's eternal will.
            </p>
            <Button
              variant="outline"
              className="border-divine-gold text-divine-gold hover:bg-divine-gold hover:text-divine-gold-foreground transition-all duration-300"
              onClick={() => {
                // Open declaration in new tab or modal
                toast({
                  title: "Sacred Declaration",
                  description: "Opening the full divine trust declaration",
                });
              }}
            >
              📜 Read Full Declaration
            </Button>
          </div>
        </div>
      </section>

      {/* Registration Section */}
      <section id="register" className="py-20 scroll-section">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-8 text-divine-gold">
              Ready to Enter?
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              Sign the Book of Entry and claim your sovereign rights.
            </p>
            <Button
              size="lg"
              className="bg-gradient-to-r from-primary to-divine-gold text-primary-foreground hover:scale-105 transition-all duration-300 shadow-divine"
              onClick={() => navigate("/auth?mode=signup")}
            >
              🔓 Register Now
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-divine-gold/20">
        <div className="container mx-auto px-6 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <img src="/lovable-uploads/93355fa4-02d2-44c8-a9a1-36ffb47138c1.png" alt="God's Realm Logo" className="h-6 w-6" />
            <span className="text-lg font-semibold text-divine-gold">
              God's Realm
            </span>
          </div>
          <p className="text-muted-foreground">
            A sovereign digital sanctuary under Divine Law
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
