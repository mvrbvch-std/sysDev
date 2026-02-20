import { Prisma, PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

const prisma = new PrismaClient();

type CreateOrderBody = {
  tenantId: string;
  consumerId: string;
  items: Array<{ productId: string; quantity: number }>;
};

export class OrderController {
  static async create(req: Request<unknown, unknown, CreateOrderBody>, res: Response) {
    const { tenantId, consumerId, items } = req.body;

    if (!tenantId || !consumerId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'tenantId, consumerId and items are required' });
    }

    try {
      const order = await prisma.$transaction(async (tx) => {
        const wallet = await tx.wallet.findFirst({
          where: { userId: consumerId, tenantId },
          include: {
            user: {
              include: {
                productBlacklists: true,
              },
            },
          },
        });

        if (!wallet) {
          throw new Error('Wallet not found for this consumer');
        }

        const productIds = items.map((i) => i.productId);
        const products = await tx.product.findMany({
          where: {
            id: { in: productIds },
            tenantId,
            active: true,
          },
        });

        if (products.length !== productIds.length) {
          throw new Error('One or more products are invalid or inactive');
        }

        const blacklisted = new Set(wallet.user.productBlacklists.map((b) => b.productId));
        const hasBlockedItem = productIds.some((id) => blacklisted.has(id));

        if (hasBlockedItem) {
          throw new Error('Order contains blacklisted products');
        }

        const productById = new Map(products.map((p) => [p.id, p]));
        const total = items.reduce((acc, item) => {
          const product = productById.get(item.productId);
          if (!product) return acc;
          if (item.quantity <= 0) {
            throw new Error('Quantity must be greater than zero');
          }
          if (product.stock < item.quantity) {
            throw new Error(`Insufficient stock for ${product.name}`);
          }

          return acc.plus(new Prisma.Decimal(product.price).mul(item.quantity));
        }, new Prisma.Decimal(0));

        // 1. Balance + credit limit validation
        const available = new Prisma.Decimal(wallet.balance).plus(wallet.creditLimit);
        if (available.lessThan(total)) {
          throw new Error('Insufficient balance + credit limit');
        }

        // 2. Daily spending validation
        const dayStart = new Date();
        dayStart.setHours(0, 0, 0, 0);

        const spentTodayAggregate = await tx.ledger.aggregate({
          where: {
            walletId: wallet.id,
            type: 'DEBIT',
            createdAt: { gte: dayStart },
          },
          _sum: { amount: true },
        });

        const spentToday = spentTodayAggregate._sum.amount ?? new Prisma.Decimal(0);
        const dailyRemaining = new Prisma.Decimal(wallet.dailySpendingLimit).minus(spentToday);
        if (dailyRemaining.lessThan(total)) {
          throw new Error('Daily spending limit exceeded');
        }

        const createdOrder = await tx.order.create({
          data: {
            tenantId,
            userId: consumerId,
            walletId: wallet.id,
            totalPrice: total,
            status: 'PENDING',
            items: {
              create: items.map((item) => {
                const product = productById.get(item.productId)!;
                const unitPrice = new Prisma.Decimal(product.price);
                return {
                  productId: item.productId,
                  quantity: item.quantity,
                  unitPrice,
                  totalPrice: unitPrice.mul(item.quantity),
                };
              }),
            },
          },
          include: { items: true },
        });

        await Promise.all(
          items.map((item) =>
            tx.product.update({
              where: { id: item.productId },
              data: {
                stock: { decrement: item.quantity },
              },
            }),
          ),
        );

        await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: { decrement: total },
          },
        });

        await tx.ledger.create({
          data: {
            walletId: wallet.id,
            amount: total,
            type: 'DEBIT',
            method: 'WALLET',
            description: `Order ${createdOrder.id}`,
          },
        });

        return createdOrder;
      });

      return res.status(201).json(order);
    } catch (error) {
      return res.status(422).json({
        message: error instanceof Error ? error.message : 'Failed to place order',
      });
    }
  }
}
