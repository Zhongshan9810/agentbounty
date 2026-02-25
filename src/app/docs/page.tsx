"use client";

import { useEffect, useRef } from "react";

export default function DocsPage() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/swagger-ui-dist@5/swagger-ui.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js";
    script.onload = () => {
      // @ts-expect-error - SwaggerUIBundle is loaded from CDN
      window.SwaggerUIBundle({
        url: "/api/v1/openapi.json",
        dom_id: "#swagger-ui",
      });
    };
    document.body.appendChild(script);
  }, []);

  return <div id="swagger-ui" style={{ minHeight: "100vh" }} />;
}
