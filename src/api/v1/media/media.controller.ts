import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import Controller from '../../../interfaces/controller.interface';

class MediaCardController implements Controller {
	register(app: FastifyInstance, prefix = ''): void {
		const basePath = `${prefix}/media`;
		app.get(`${basePath}/card`, async (req: FastifyRequest, reply: FastifyReply) => {
			return { message: 'Media Card Endpoint' };
		});

		app.post(`${basePath}/card`, async (req: FastifyRequest, reply: FastifyReply) => {
			// handle media card creation with sharp and req.body
		});
	}
}

export default MediaCardController;