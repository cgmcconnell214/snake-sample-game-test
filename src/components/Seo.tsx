import React from "react";
import { Helmet } from "react-helmet-async";

interface SeoProps {
  title: string;
  description?: string;
  canonical?: string;
  noindex?: boolean;
}

const Seo: React.FC<SeoProps> = ({ title, description, canonical, noindex }) => {
  if (!title) {
    console.warn("SEO: Missing title prop on a page.");
  }
  if (!description) {
    console.warn("SEO: Missing meta description for:", title);
  }

  const metaTitle = title;
  const metaDescription = description ?? "";

  return (
    <Helmet>
      <title>{metaTitle}</title>
      {metaDescription && <meta name="description" content={metaDescription} />}
      {canonical && <link rel="canonical" href={canonical} />}
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:title" content={metaTitle} />
      {metaDescription && (
        <meta property="og:description" content={metaDescription} />
      )}
      {canonical && <meta property="og:url" content={canonical} />}
      <meta property="og:type" content="website" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={metaTitle} />
      {metaDescription && (
        <meta name="twitter:description" content={metaDescription} />
      )}
    </Helmet>
  );
};

export default Seo;
