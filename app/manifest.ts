import type { MetadataRoute } from "next";
import { APP_NAME } from "@/lib/constants";

/**
 * Lets a seller "Add to Home Screen" and open the desk like an app — most of
 * them run their shop from a phone. Opens straight into the desk (the proxy
 * bounces a signed-out visitor to /login).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_NAME,
    short_name: APP_NAME,
    description: "Take orders from your DMs.",
    start_url: "/desk",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/brand/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
