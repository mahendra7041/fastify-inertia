import type { FastifyRequest, FastifyReply } from "fastify";
import { Adapter } from "node-inertiajs";

/**
 * Fastify Adapter for Inertia.js
 * Uses Fastify's native request and reply methods to ensure
 * all Fastify lifecycle methods work correctly
 */
export class FastifyAdapter extends Adapter {
  constructor(
    protected request: FastifyRequest,
    protected reply: FastifyReply
  ) {
    super();
  }

  getRequest(): FastifyRequest {
    return this.request;
  }

  getResponse(): FastifyReply {
    return this.reply;
  }

  getHeader(name: string): string | string[] | undefined {
    return this.request.headers[name.toLowerCase()];
  }

  setHeader(name: string, value: any): void {
    this.reply.header(name, value);
  }

  getMethod(): string {
    return this.request.method || "GET";
  }

  getUrl(): string {
    return this.request.url || "/";
  }

  json(data: Record<string, any>): void {
    this.reply.type("application/json").send(data);
  }

  html(content: string): void {
    this.reply.type("text/html").send(content);
  }

  redirect(statusOrUrl: number | string, url?: string): void {
    let status = 302;
    let location = "";

    if (typeof statusOrUrl === "number" && typeof url === "string") {
      status = statusOrUrl;
      location = url;
    } else if (typeof statusOrUrl === "string") {
      location = statusOrUrl;
    }

    this.reply.redirect(location, status);
  }

  setStatus(code: number): void {
    this.reply.status(code);
  }

  end(data?: any): void {
    if (data !== undefined) {
      this.reply.send(data);
    } else {
      this.reply.send();
    }
  }
}
