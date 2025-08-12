import LandingPage from "@/components/LandingPage";
import Seo from "@/components/Seo";

const Index = (): JSX.Element => {
  const canonicalUrl = (typeof window !== "undefined" ? window.location.origin : "") + "/";
  return (
    <>
      <Seo
        title="God's Realm | Sovereign Digital Sanctuary"
        description="Tokenize assets, trade P2P, and operate under Divine Law."
        canonical={canonicalUrl}
      />
      <LandingPage />
    </>
  );
};

export default Index;
