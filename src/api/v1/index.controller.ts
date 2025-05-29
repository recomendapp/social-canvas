import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import Controller from '../../interfaces/controller.interface';
import Route from '../../interfaces/route.interface';

class HelloController implements Controller {
  public basePath = '/';
  public routes: Route[] = [
    {
      method: 'get',
      handler: async (req: FastifyRequest, reply: FastifyReply) => {
        return { message: 'Hello World' };
      },
    },
  ];
}

export default HelloController;