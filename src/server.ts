import 'dotenv/config';
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

function broadcast(event: string, data: unknown) {
  const message = JSON.stringify({ event, data });
  ws.clients.forEach((client) => {
    if (client.readyState === 1) client.send(message);
  });
}

orderEvents.on('order:paid', (payload: unknown) => broadcast('order:paid', payload));
orderEvents.on('order:status', (payload: unknown) => broadcast('order:status', payload));

const port = Number(process.env.PORT ?? 4000);
httpServer.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API running on http://localhost:${port}`);
});
