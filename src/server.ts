import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { appRouter } from './routes';
import { orderEvents } from './realtime/orderEvents';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', appRouter);

const httpServer = createServer(app);
const ws = new WebSocketServer({ server: httpServer, path: '/ws/kds' });

orderEvents.on('order:paid', (payload) => {
  const message = JSON.stringify({ event: 'order:paid', data: payload });
  ws.clients.forEach((client) => {
    if (client.readyState === 1) client.send(message);
  });
});

orderEvents.on('order:status', (payload) => {
  const message = JSON.stringify({ event: 'order:status', data: payload });
  ws.clients.forEach((client) => {
    if (client.readyState === 1) client.send(message);
  });
});

const port = Number(process.env.PORT ?? 4000);
httpServer.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API running on http://localhost:${port}`);
});
