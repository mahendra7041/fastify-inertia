import type { FastifyRequest, FastifyReply } from "fastify";
import { Adapter } from "node-inertiajs";

export class FastifyAdapter extends Adapter {
  constructor(protected req: FastifyRequest, protected reply: FastifyReply) {
    super();
  }

  get url(): string {
    return this.req.url || "/";
  }

  get method(): string {
    return this.req.method || "GET";
  }

  get statusCode(): number {
    return this.reply.statusCode || 200;
  }

  set statusCode(code: number) {
    this.reply.code(code);
  }

  get request(): FastifyRequest {
    return this.req;
  }

  get response(): FastifyReply {
    return this.reply;
  }

  getHeader(name: string): string | string[] | undefined {
    // Fastify normalizes headers to lowercase
    return this.req.headers[name.toLowerCase()];
  }

  setHeader(name: string, value: string): void {
    this.reply.header(name, value);
  }

  send(content: string): void {
    if (!this.reply.hasHeader("Content-Type")) {
      this.reply.header("Content-Type", "text/html");
    }
    this.reply.send(content);
  }

  json(data: unknown): void {
    try {
      this.reply.type("application/json").send(data);
    } catch {
      this.reply.code(500).send({ error: "Failed to serialize JSON" });
    }
  }

  redirect(statusOrUrl: number | string, url?: string): void {
    if (typeof statusOrUrl === "number" && typeof url === "string") {
      this.reply.redirect(url, statusOrUrl);
    } else if (typeof statusOrUrl === "string") {
      this.reply.redirect(statusOrUrl);
    } else {
      throw new Error("Invalid redirect arguments");
    }
  }
}
