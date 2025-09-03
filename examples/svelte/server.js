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
