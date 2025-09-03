import fp from "fastify-plugin";
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import {
  defineConfig,
  Inertia,
  Flash,
  type InertiaConfig,
} from "node-inertiajs";
import { ViteDevServer, createServer as createViteServer } from "vite";

declare module "fastify" {
  interface FastifyReply {
    inertia: InstanceType<typeof Inertia>;
  }
  interface FastifyRequest {
    session?: Record<string, any>;
    flash: InstanceType<typeof Flash>;
  }
}

export default fp<InertiaConfig>(async function inertiaPlugin(
  fastify: FastifyInstance,
  opts: InertiaConfig
) {
  if (!opts) {
    throw new Error("Inertia.js configuration is required");
  }

  let vite: ViteDevServer | undefined;

  if (process.env.NODE_ENV !== "production") {
    vite = await createViteServer(config.vite);

    fastify.addHook("onRequest", (request, reply, done) => {
      vite!.middlewares(request.raw, reply.raw, done);
    });
  }

  // Add flash middleware FIRST
  fastify.addHook("onRequest", (request, reply, done) => {
    if (!request.session) {
      done(new Error("Flash requires fastify/session plugin."));
      return;
    }

    if (!request.session.flash) {
      request.session.flash = {};
    }

    // Create Flash instance and attach to request
    request.flash = new Flash(request, reply);
    done();
  });

  // Configure shared data AFTER flash is available
  const config = defineConfig({
    ...opts,
    sharedData: {
      errors: (request: FastifyRequest) => request.flash.get("errors") || {},
      flash: (request: FastifyRequest) => ({
        error: request.flash.get("error") || null,
        success: request.flash.get("success") || null,
      }),
      ...opts.sharedData,
    },
  });

  // Add Inertia instance to reply
  fastify.addHook("onRequest", (request, reply, done) => {
    reply.inertia = new Inertia(request.raw, reply.raw, config, vite);
    done();
  });
});
