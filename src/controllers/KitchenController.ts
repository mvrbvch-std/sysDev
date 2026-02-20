import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { orderEvents } from '../realtime/orderEvents';

const prisma = new PrismaClient();

export class KitchenController {
  static async queue(req: Request, res: Response) {
    const tenantId = req.query.tenantId as string;

    const orders = await prisma.order.findMany({
      where: {
        tenantId,
        status: { in: ['PENDING', 'PREPARING', 'READY'] },
      },
      include: {
        user: true,
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return res.status(200).json(
      orders.map((order) => ({
        id: order.id,
        studentName: order.user.name,
        studentPhoto: order.user.photoUrl,
        items: order.items.map((item) => item.product.name),
        status: order.status,
      })),
    );
  }

  static async updateStatus(req: Request<{ orderId: string }, unknown, { status: 'PENDING' | 'PREPARING' | 'READY' }>, res: Response) {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });

    orderEvents.emitOrderStatus({ orderId: order.id, status });
    return res.status(200).json(order);
  }
}
