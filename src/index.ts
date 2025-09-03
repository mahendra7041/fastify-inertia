import fp from "fastify-plugin";
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { defineConfig, Inertia, Flash, InertiaConfig } from "node-inertiajs";
import { ViteDevServer, createServer as createViteServer } from "vite";

declare module "fastify" {
  interface FastifyReply {
    inertia: InstanceType<typeof Inertia>;
  }
  interface FastifyRequest {
    flash: InstanceType<typeof Flash>;
    session?: Record<string, any>;
  }
}

export default fp<InertiaConfig>(async function inertiaPlugin(
  fastify: FastifyInstance,
  opts: InertiaConfig
) {
  if (!opts) {
    throw new Error("Inertia.js configuration is required");
  }

  // Merge defaults first, user overrides after
  opts.sharedData = {
    errors: (request: FastifyRequest) => request.flash.get("errors") || {},
    flash: (request: FastifyRequest) => ({
      error: request.flash.get("error") || null,
      success: request.flash.get("success") || null,
    }),
    ...opts.sharedData,
  };

  const config = defineConfig(opts);

  let vite: ViteDevServer | undefined;
  if (process.env.NODE_ENV !== "production") {
    vite = await createViteServer(config.vite);

    fastify.addHook("onRequest", (request, reply, done) => {
      vite!.middlewares(request.raw, reply.raw, done);
    });
  }

  // Properly declare properties

  // @ts-ignore
  fastify.decorateRequest<InstanceType<typeof Flash>>("flash", undefined);
  // @ts-ignore
  fastify.decorateReply<InstanceType<typeof Inertia>>("inertia", undefined);

  fastify.addHook("preHandler", (request, reply, done) => {
    if (!request.session) {
      return done(new Error("Flash requires fastify/session plugin."));
    }

    if (!request.session.flash) {
      request.session.flash = {};
    }

    request.flash = new Flash(request, reply);
    reply.inertia = new Inertia(request.raw, reply.raw, config, vite);

    done();
  });
});
