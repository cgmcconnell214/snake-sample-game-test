import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

// Landing page components
import LandingNavigation from "./landing/LandingNavigation";
import HeroSection from "./landing/HeroSection";
import MissionSection from "./landing/MissionSection";
import FeaturesSection from "./landing/FeaturesSection";
import TrustSection from "./landing/TrustSection";
import RegisterSection from "./landing/RegisterSection";
import LandingFooter from "./landing/LandingFooter";

const LandingPage = () => {
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

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
        threshold: 0.15,
        rootMargin: "0px 0px -80px 0px",
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
    const element = document.getElementById(id);
    if (element) {
      const offsetTop = element.offsetTop - 80; // Account for fixed header
      window.scrollTo({ 
        top: offsetTop, 
        behavior: "smooth" 
      });
    }
  };

  return (
    <div id="main-content" className="min-h-screen bg-background">
      <LandingNavigation scrollToSection={scrollToSection} />
      <HeroSection isVisible={isVisible} scrollToSection={scrollToSection} />
      <MissionSection />
      <FeaturesSection />
      <TrustSection />
      <RegisterSection />
      <LandingFooter />
    </div>
  );
};

export default LandingPage;
