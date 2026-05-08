import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// import { cloudflare } from "@cloudflare/vite-plugin";  // Disabled for local dev
import tailwind from "@tailwindcss/vite"
import path from "path";
import emailRelayPlugin from "./vite/plugins/email-relay-plugin";

export default defineConfig({
	plugins: [react(), emailRelayPlugin(), /* cloudflare(), */ tailwind()],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src/web"),
		},
	},
	server: {
		allowedHosts: true,
		hmr: { overlay: false, },
		port: 5173,
	}
});
