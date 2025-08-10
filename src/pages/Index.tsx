import { Suspense, lazy } from "react";
import { Helmet } from "react-helmet-async";

const LandingPage = lazy(() => import("@/components/LandingPage"));

const Index = (): JSX.Element => {
  return (
    <>
      <Helmet>
        <title>God's Realm</title>
        <meta name="description" content="Landing page for God's Realm" />
      </Helmet>
      <Suspense fallback={<div>Loading...</div>}>
        <LandingPage />
      </Suspense>
    </>
  );
};

export default Index;
