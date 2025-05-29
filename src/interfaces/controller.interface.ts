import Route from "./route.interface";

interface Controller {
  basePath: string;
  routes: Route[];
}

export default Controller;
