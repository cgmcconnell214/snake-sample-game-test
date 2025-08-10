import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const NotFound = (): JSX.Element => {
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-6">Oops! Page not found</p>
        <form
          className="mb-6 flex justify-center"
          onSubmit={(e) => {
            e.preventDefault();
            if (query.trim().length > 0) {
              navigate(`/search?q=${encodeURIComponent(query)}`);
            }
          }}
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            className="border rounded-l px-3 py-2 w-64"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded-r hover:bg-blue-600"
          >
            Search
          </button>
        </form>
        <div className="space-x-4">
          <button
            onClick={() => navigate("/")}
            className="text-blue-500 hover:text-blue-700 underline"
          >
            Return Home
          </button>
          <button
            onClick={() =>
              (window.location.href = `mailto:support@example.com?subject=Missing%20Page&body=I%20couldn't%20find:%20${location.pathname}`)
            }
            className="text-blue-500 hover:text-blue-700 underline"
          >
            Report Missing Page
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
