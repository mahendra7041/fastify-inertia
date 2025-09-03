# express-inertia

[![npm version](https://img.shields.io/npm/v/fastify-inertiajs)](https://www.npmjs.com/package/fastify-inertiajs)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A lightweight Fastify plugin for [Inertia.js](https://inertiajs.com/) that lets you build modern single-page applications with server-side rendering. It allows seamless integration of React, Vue, or Svelte components while preserving the simplicity of classic apps.

## Features

- **Server-Side Rendering (SSR)** support for improved SEO and performance
- **Vite integration** for fast development and optimized builds
- **Framework agnostic** - works with React, Vue, or Svelte
- **Lightweight** Fastify plugin with minimal configuration
- **TypeScript support** with full type definitions

## Quick Start

The fastest way to get started is using our official templates:

```bash
# For React
npx degit mahendra7041/fastify-inertia/examples/react my-inertia-app

# For Vue
npx degit mahendra7041/fastify-inertia/examples/vue my-inertia-app

# For Svelte
npx degit mahendra7041/fastify-inertia/examples/svelte my-inertia-app

cd my-inertia-app
npm install
npm run dev
```

## Setup Guide

### Prerequisites

- Node.js 18 or higher
- Fastify
- Vite

### Step 1: Create a Vite Project

First, create a new project using Vite with your preferred framework:

```bash
# For React (used in this guide)
npm create vite@latest my-inertia-app -- --template react

# For Vue
npm create vite@latest my-inertia-app -- --template vue

# For Svelte
npm create vite@latest my-inertia-app -- --template svelte

cd my-inertia-app
```

### Step 2: Install Required Packages

Install the necessary dependencies for Fastify and Inertia:

```bash
# For React (used in this guide)
npm install fastify-inertiajs @fastify/cookie @fastify/session @fastify/static @inertiajs/react

# For Vue
npm install fastify-inertiajs @fastify/cookie @fastify/session @fastify/static @inertiajs/vue3

# For Svelte
npm install fastify-inertiajs @fastify/cookie @fastify/session @fastify/static @inertiajs/svelte

# Additional dev dependencies
npm install -D nodemon
```

### Step 3: Project Structure

Set up your project structure as follows:

```
my-inertia-app/
├── build/                 # Generated build artifacts
├── public/                # Static assets
├── src/
│   ├── pages/            # Inertia page components
│   ├── assets/           # Styles, images, etc.
│   ├── main.jsx          # Client entry point (or .js/.vue/.svelte)
│   └── ssr.jsx           # SSR entry point (optional)
├── index.html            # HTML template
├── vite.config.js        # Vite configuration
├── server.js             # Express server
└── package.json
```

### Step 4: Express Server Setup (`server.js`)

```javascript
import fastify from "fastify";
import fastifyStatic from "@fastify/static";
import fastifyCookie from "@fastify/cookie";
import fastifySession from "@fastify/session";
import inertiaConfig from "./configs/inertia.config.js";
import sessionConfig from "./configs/session.config.js";
import inertia from "fastify-inertiajs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function bootstrap() {
  const app = fastify();
  const PORT = process.env.PORT || 5000;

  // Serve static files in production
  if (process.env.NODE_ENV === "production") {
    await app.register(fastifyStatic, {
      root: path.join(__dirname, "build/client"),
      prefix: "/",
      decorateReply: false,
    });
  }

  await app.register(fastifyCookie);
  await app.register(fastifySession, sessionConfig);
  await app.register(inertia, inertiaConfig);

  app.get("/", (req, reply) => {
    reply.inertia.render("home");
  });

  try {
    await app.listen({ port: PORT });
    console.log(`Server is running at http://localhost:${PORT}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

bootstrap().catch(console.error);
```

### Step 5: Update Package.json Scripts

```json
{
  "scripts": {
    "dev": "nodemon server.js",
    "start": "cross-env NODE_ENV=production node server.js",
    "build": "npm run build:ssr && npm run build:client",
    "build:client": "vite build --outDir build/client",
    "build:ssr": "vite build --outDir build/ssr --ssr src/ssr.jsx"
  }
}
```

### Step 6: Client Entry Point (src/main.jsx)

Update your framework's main entry point accordingly. For more details, visit [Inertia.js Client-Side Setup](https://inertiajs.com/client-side-setup#initialize-the-inertia-app):

```javascript
import { createInertiaApp } from "@inertiajs/react";
import { createRoot } from "react-dom/client";

createInertiaApp({
  id: "root",
  resolve: (name) => {
    const pages = import.meta.glob("./pages/**/*.jsx", { eager: true });

    return pages[`./pages/${name}.jsx`];
  },
  setup({ el, App, props }) {
    createRoot(el).render(<App {...props} />);
  },
});
```

### Step 7: SSR Entry Point (src/ssr.jsx) - Optional

Add Server-Side Rendering support for improved SEO and performance.

```javascript
import ReactDOMServer from "react-dom/server";
import { createInertiaApp } from "@inertiajs/react";

export default function render(page) {
  return createInertiaApp({
    id: "root",
    page,
    render: ReactDOMServer.renderToString,
    resolve: (name) => {
      const pages = import.meta.glob("./pages/**/*.jsx", { eager: true });

      return pages[`./pages/${name}.jsx`];
    },
    setup: ({ App, props }) => <App {...props} />,
  });
}
```

## Configuration

### Middleware Options

| Option                 | Type                 | Default                                                   | Description                                                   |
| ---------------------- | -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `rootElementId`        | `string?`            | `"app"`                                                   | DOM element ID where the Inertia app mounts                   |
| `assetsVersion`        | `string?`            | `"v1"`                                                    | Version string used for inertia                               |
| `encryptHistory`       | `boolean?`           | `true`                                                    | Encrypts the Inertia history state for security               |
| `indexEntrypoint`      | `string?`            | `"index.html"`                                            | Path to your base HTML template (used in dev mode)            |
| `indexBuildEntrypoint` | `string?`            | `"build/client/index.html"`                               | Path to the built client HTML entrypoint (used in production) |
| `ssrEnabled`           | `boolean?`           | `false`                                                   | Enables/disables server-side rendering (SSR)                  |
| `ssrEntrypoint`        | `string?`            | Required if `ssrEnabled: true`                            | Path to your SSR entry file (used in development)             |
| `ssrBuildEntrypoint`   | `string?`            | Required if `ssrEnabled: true`                            | Path to the built SSR bundle (used in production)             |
| `vite`                 | `ViteResolveConfig?` | `{ server: { middlewareMode: true }, appType: "custom" }` | Passes custom options to the Vite dev server                  |

## API Reference

### `inertia(config?, vite?)`

Initializes and returns the Express middleware.

```javascript
await fastify.register(inertia, inertiaConfig);
```

### `reply.inertia.render(component, props?)`

Renders an Inertia page component.

```javascript
fastify.get('/users', (request, reply) => {
  const users = await User.findAll();

  reply.inertia.render('user/index', {
    users: users,
    page: req.query.page || 1
  });
});
```

### `reply.inertia.share(data)`

Shares data with the current and subsequent requests.

```javascript
reply.inertia.share({
  auth: {
    user: req.user,
    permissions: req.user?.permissions,
  },
});
```

### `reply.inertia.redirect(urlOrStatus, url?)`

Redirects the user to a different location while preserving Inertia’s client-side navigation.

```javascript
fastify.get("/home", (req, reply) => {
  // Redirect with default status (302 Found)
  reply.inertia.redirect("/dashboard");

  // Redirect with explicit status
  reply.inertia.redirect(301, "/new-home");
});
```

## Contributing

We welcome contributions! Please feel free to submit issues, feature requests, or pull requests.

### Guidelines

1. **Fork** the repository
2. **Create** your feature branch:

   ```bash
   git checkout -b feat/amazing-feature
   ```

3. **Commit** your changes with a descriptive message:

   ```bash
   git commit -m "feat: add amazing feature"
   ```

4. **Push** to your branch:

   ```bash
   git push origin feat/amazing-feature
   ```

5. **Open a Pull Request**

### Breaking Changes

If your contribution introduces a **breaking change** (e.g. changes to configuration options, API methods, or default behavior), please **open an issue or discussion first** before submitting a PR. This ensures we can:

- Discuss the impact on existing users
- Decide if a major version bump is required
- Provide a clear migration path in the documentation

## License

This project is licensed under the MIT License - see the [LICENSE](https://opensource.org/licenses/MIT) file for details.

## Resources

- [Inertiajs Documentation](https://inertiajs.com/)
- [Reactjs Documentation](https://react.dev/)
- [Fastify Documentation](https://fastify.dev/)
- [Vite Documentation](https://vitejs.dev/)
