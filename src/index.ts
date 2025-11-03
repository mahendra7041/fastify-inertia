import fp from "fastify-plugin";
import type { FastifyInstance, FastifyRequest } from "fastify";
import {
  defineConfig,
  Inertia,
  Flash,
  type InertiaConfig,
} from "node-inertiajs";
import { ViteDevServer, createServer as createViteServer } from "vite";
import { FastifyAdapter } from "./fastify_adapter.js";

export { FastifyAdapter } from "./fastify_adapter.js";

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
    vite = await createViteServer(config.vite as any);

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
    const flash = new Flash(request as any, reply as any);
    request.flash = flash;
    // @ts-ignore
    request.raw.flash = flash;
    done();
  });

  // Add Inertia instance to reply
  fastify.addHook("onRequest", (request, reply, done) => {
    const adapter = new FastifyAdapter(request, reply);
    reply.inertia = new Inertia(adapter, config, vite);
    done();
  });
});
