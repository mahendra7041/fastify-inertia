import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";
import { defineConfig, Inertia, Flash } from "node-inertiajs";
import { ViteDevServer, createServer as createViteServer } from "vite";

declare module "fastify" {
  interface FastifyReply {
    inertia: InstanceType<typeof Inertia>;
    flash?: InstanceType<typeof Flash>;
  }
  interface FastifyRequest {
    session?: Record<string, any>;
  }
}

interface InertiaPluginOptions {
  inertiaConfig: Parameters<typeof defineConfig>[0];
  vite?: ViteDevServer | null;
}

export default fp<InertiaPluginOptions>(async function inertiaPlugin(
  fastify: FastifyInstance,
  opts: InertiaPluginOptions
) {
  if (!opts.inertiaConfig) {
    throw new Error("Inertia.js configuration is required");
  }
  const config = defineConfig(opts.inertiaConfig);

  let vite: ViteDevServer | undefined;

  if (process.env.NODE_ENV !== "production") {
    vite =
      opts.vite ??
      (await createViteServer({
        server: { middlewareMode: true },
        appType: "custom",
      }));

    if (vite && !opts.vite) {
      fastify.addHook("onRequest", (request, reply, done) => {
        vite!.middlewares(request.raw, reply.raw, done);
      });
    }
  }

  fastify.addHook("onRequest", (request, reply, done) => {
    if (!request.session) {
      done(new Error("Flash middleware requires session middleware."));
      return;
    }

    if (!request.session.flash) {
      request.session.flash = {};
    }

    reply.flash = new Flash(request, reply);

    done();
  });

  fastify.addHook("onRequest", (request, reply, done) => {
    reply.inertia = new Inertia(request.raw, reply.raw, config, vite);
    done();
  });
});
