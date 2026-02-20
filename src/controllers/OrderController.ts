import { Request, Response } from 'express';
import { WalletService } from '../services/WalletService';
import { orderEvents } from '../realtime/orderEvents';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type CreateOrderBody = {
  tenantId: string;
  consumerId: string;
  items: Array<{ productId: string; quantity: number }>;
};

export class OrderController {
  static async validateOrder(req: Request<unknown, unknown, CreateOrderBody>, res: Response) {
    const { tenantId, consumerId, items } = req.body;

    try {
      const validation = await WalletService.validateOrder(tenantId, consumerId, items ?? []);
      return res.status(200).json({
        walletId: validation.walletId,
        total: validation.total,
        valid: true,
      });
    } catch (error) {
      return res.status(422).json({
        valid: false,
        message: error instanceof Error ? error.message : 'Order validation failed',
      });
    }
  }

  static async create(req: Request<unknown, unknown, CreateOrderBody>, res: Response) {
    const { tenantId, consumerId, items } = req.body;

    try {
      const order = await WalletService.processTransaction({
        tenantId,
        consumerId,
        items: items ?? [],
      });

      const hydratedOrder = await prisma.order.findUnique({
        where: { id: order.id },
        include: { user: true, items: { include: { product: true } } },
      });

      if (hydratedOrder) {
        orderEvents.emitOrderPaid({
          id: hydratedOrder.id,
          studentName: hydratedOrder.user.name,
          studentPhoto: hydratedOrder.user.photoUrl ?? '',
          items: hydratedOrder.items.map((item) => item.product.name),
          status: 'PENDING',
        });
      }

      return res.status(201).json(order);
    } catch (error) {
      return res.status(422).json({
        message: error instanceof Error ? error.message : 'Failed to place order',
      });
    }
  }
}
