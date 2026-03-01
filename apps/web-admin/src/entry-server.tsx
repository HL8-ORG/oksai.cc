import {
  createStart,
  renderRouterToStream,
} from '@tanstack/react-start/server';
import { getRouter } from './router';

const router = getRouter();

const Start = createStart({ router, render: renderRouterToStream });

Start.render();
