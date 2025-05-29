import { FastifyReply, FastifyRequest } from "fastify";

type HTTPMethod = 'get' | 'post' | 'put' | 'delete';

interface Route {
  method: HTTPMethod;
  path?: string;
  handler: (req: FastifyRequest, reply: FastifyReply) => Promise<any> | any;
}

export type { HTTPMethod };

export default Route;