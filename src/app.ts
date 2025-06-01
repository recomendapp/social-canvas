import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import bearerAuth from '@fastify/bearer-auth';
import Controller from './interfaces/controller.interface';
import path from 'path';
import fs from 'fs';

class App {
  public app: FastifyInstance;
  public port: number = parseInt(process.env.PORT || '9000');
  public apiKeys: Set<string> = new Set(process.env.API_KEYS?.split(',') || []);

  constructor() {
    this.app = Fastify({
		logger: {
			level: process.env.LOG_LEVEL || 'info',
		},
		ignoreDuplicateSlashes: true,
		ignoreTrailingSlash: true,
	});
  }

  public async init() {
    await this.initializePlugins();
    await this.initializeControllers();
  }

  public listen() {
    this.app.listen({ port: this.port }, (err, address) => {
      if (err) {
        this.app.log.error(err);
        process.exit(1);
      }
      this.app.log.info(`Server listening at ${address}`);
    });
  }

  public getServer() {
    return this.app;
  }

  private async initializePlugins() {
    await this.app.register(cors);
  	// await this.app.register(bearerAuth, { keys: this.apiKeys });
  }

	private async initializeControllers() {
		const apiPath = path.join(__dirname, 'api');

		function getControllerFiles(dir: string): string[] {
			let results: string[] = [];
			const list = fs.readdirSync(dir);

			list.forEach((file) => {
			const filePath = path.join(dir, file);
			const stat = fs.statSync(filePath);
			if (stat && stat.isDirectory()) {
				results = results.concat(getControllerFiles(filePath));
			} else if (file.endsWith('.controller.ts') || file.endsWith('.controller.js')) {
				results.push(filePath);
			}
			});

			return results;
		}

		const controllerFiles = getControllerFiles(apiPath);

		for (const filePath of controllerFiles) {
			const relativePath = path.relative(apiPath, filePath);
			const parts = relativePath.split(path.sep);
			const version = parts.shift() || ''; // 'v1'
			const controllerModule = await import(filePath);
			const ControllerClass = controllerModule.default;
			if (!ControllerClass) continue;

			const controller: Controller = new ControllerClass();
			if (!controller || !controller.register) {
				this.app.log.warn(`Controller at ${filePath} is missing required methods or properties.`);
				continue;
			}
			this.app.log.info(`Registering controller from ${relativePath}`);
			controller.register(this.app, `/${version}`);
		}
	}
}

export default App;
