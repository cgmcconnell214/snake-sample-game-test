import React from "react";
import { Link } from "react-router-dom";

export default function FooterLinks() {
  return (
    <footer className="w-full border-t border-border bg-card/50 backdrop-blur mt-8">
      <div className="max-w-6xl mx-auto px-4 py-6 text-sm flex items-center justify-between">
        <nav className="flex items-center gap-4 text-muted-foreground">
          <Link to="/terms" className="hover:text-primary underline-offset-4 hover:underline">
            Terms
          </Link>
          <span aria-hidden>•</span>
          <Link to="/privacy" className="hover:text-primary underline-offset-4 hover:underline">
            Privacy
          </Link>
        </nav>
        <p className="text-muted-foreground">© {new Date().getFullYear()} God's Realm</p>
      </div>
    </footer>
  );
}
