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
		logger: true,
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
  	await this.app.register(bearerAuth, { keys: this.apiKeys });
  }

  private async initializeControllers() {
    const apiPath = path.join(__dirname, 'api');
    const versions = fs.readdirSync(apiPath).filter(f => fs.statSync(path.join(apiPath, f)).isDirectory());

    for (const version of versions) {
      const versionPath = path.join(apiPath, version);
      const files = fs.readdirSync(versionPath).filter(f => f.endsWith('.controller.ts') || f.endsWith('.controller.js'));

      for (const file of files) {
        const controllerModule = await import(path.join(versionPath, file));
        const ControllerClass = controllerModule.default;
        if (!ControllerClass) continue;
        const controller: Controller = new ControllerClass();
        this.app.log.info(`Registering controller from ${version}/${file} on prefix /${version}${controller.basePath}`);
		controller.routes.forEach(route => {
			const fullPath = `/${version}${controller.basePath}${route.path || ''}`;
			this.app[route.method](fullPath, route.handler);
		});
      }
    }
  }
}

export default App;
