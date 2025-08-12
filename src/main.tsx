import { createRoot } from "react-dom/client";
import { Suspense } from "react";
import App from "./App.tsx";
import "./index.css";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorBoundary from "@/components/ErrorBoundary";

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <Suspense fallback={<LoadingSpinner />}>
      <App />
    </Suspense>
  </ErrorBoundary>
);
