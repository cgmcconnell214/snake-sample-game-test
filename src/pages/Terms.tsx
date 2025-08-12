import Seo from "@/components/Seo";

export default function Terms(): JSX.Element {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const canonicalUrl = origin + "/terms";
  return (
    <main className="container mx-auto p-6 space-y-6">
      <Seo title="Terms of Service | God's Realm" description="Read the terms governing the use of God's Realm platform." canonical={canonicalUrl} />
      <h1 className="text-3xl font-bold">Terms of Service</h1>
      <section className="space-y-3">
        <p className="text-muted-foreground">These terms outline your rights and responsibilities when using the platform.</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Use the platform lawfully and respectfully.</li>
          <li>Respect intellectual property and privacy.</li>
          <li>Comply with community and trading guidelines.</li>
        </ul>
      </section>
    </main>
  );
}
