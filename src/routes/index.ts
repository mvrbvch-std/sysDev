import { Router } from 'express';
import { AsaasPaymentController } from '../controllers/AsaasPaymentController';
import { KitchenController } from '../controllers/KitchenController';
import { OrderController } from '../controllers/OrderController';
import { ProductController } from '../controllers/ProductController';
import { SponsorController } from '../controllers/SponsorController';
import { requireRole } from '../middleware/rbac';

export const appRouter = Router();

appRouter.get('/health', (_, res) => res.json({ ok: true }));

appRouter.post('/orders/validate', requireRole(['MERCHANT', 'SUPERADMIN']), OrderController.validateOrder);
appRouter.post('/orders', requireRole(['MERCHANT', 'SUPERADMIN']), OrderController.create);

appRouter.get('/products', requireRole(['MERCHANT', 'SUPERADMIN', 'CONSUMER', 'SPONSOR']), ProductController.list);
appRouter.post('/products', requireRole(['MERCHANT', 'SUPERADMIN']), ProductController.upsert);
appRouter.put('/products/:id', requireRole(['MERCHANT', 'SUPERADMIN']), ProductController.upsert);

appRouter.post('/payments/asaas/pix', requireRole(['SPONSOR', 'SUPERADMIN']), AsaasPaymentController.createDynamicPix);
appRouter.post('/payments/asaas/webhook', AsaasPaymentController.webhook);

appRouter.get('/sponsor/:consumerId/statement', requireRole(['SPONSOR', 'SUPERADMIN']), SponsorController.statement);
appRouter.patch('/sponsor/:consumerId/governance', requireRole(['SPONSOR', 'SUPERADMIN']), SponsorController.updateGovernance);

appRouter.get('/kitchen/queue', requireRole(['MERCHANT', 'SUPERADMIN']), KitchenController.queue);
appRouter.patch('/kitchen/orders/:orderId/status', requireRole(['MERCHANT', 'SUPERADMIN']), KitchenController.updateStatus);
