import LandingPage from "@/components/LandingPage";
import Seo from "@/components/Seo";

const Index = (): JSX.Element => {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const canonicalUrl = origin + "/";
  const orgLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "God's Realm",
    url: origin,
  };
  const siteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "God's Realm",
    url: origin,
    potentialAction: {
      "@type": "SearchAction",
      target: `${origin}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
  return (
    <>
      <Seo
        title="God's Realm | Sovereign Digital Sanctuary"
        description="Tokenize assets, trade P2P, and operate under Divine Law."
        canonical={canonicalUrl}
      />
      <script type="application/ld+json">{JSON.stringify(orgLd)}</script>
      <script type="application/ld+json">{JSON.stringify(siteLd)}</script>
      <LandingPage />
    </>
  );
};

export default Index;
