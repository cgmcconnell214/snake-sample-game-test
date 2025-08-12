import Seo from "@/components/Seo";

export default function Privacy(): JSX.Element {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const canonicalUrl = origin + "/privacy";
  return (
    <main className="container mx-auto p-6 space-y-6">
      <Seo title="Privacy Policy | God's Realm" description="Learn how we collect and protect your personal data." canonical={canonicalUrl} />
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <section className="space-y-3">
        <p className="text-muted-foreground">We value your privacy and outline our data handling practices here.</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>We store only what’s necessary to operate core features.</li>
          <li>We never sell your personal data.</li>
          <li>You can request deletion of your data at any time.</li>
        </ul>
      </section>
    </main>
  );
}
