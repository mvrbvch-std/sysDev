import { LedgerType, PaymentMethod, Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type PrismaTx = Prisma.TransactionClient;

export type OrderInputItem = {
  productId: string;
  quantity: number;
};

export type OrderValidationResult = {
  walletId: string;
  total: Prisma.Decimal;
  products: Map<string, { id: string; name: string; price: Prisma.Decimal; stock: number }>;
};

export class WalletService {
  static async validateOrder(
    tenantId: string,
    consumerId: string,
    items: OrderInputItem[],
    tx?: PrismaTx,
  ): Promise<OrderValidationResult> {
    if (!tenantId || !consumerId || items.length === 0) {
      throw new Error('tenantId, consumerId and items are required');
    }

    const db = tx ?? prisma;

    const wallet = await db.wallet.findFirst({
      where: { tenantId, userId: consumerId },
      include: { user: true },
    });

    if (!wallet || wallet.user.role !== 'CONSUMER') {
      throw new Error('Consumer wallet not found');
    }

    const productIds = [...new Set(items.map((item) => item.productId))];
    const products = await db.product.findMany({
      where: {
        id: { in: productIds },
        tenantId,
        isAvailable: true,
      },
    });

    if (products.length !== productIds.length) {
      throw new Error('One or more products are invalid or unavailable');
    }

    const productMap = new Map(
      products.map((product) => [
        product.id,
        {
          id: product.id,
          name: product.name,
          price: new Prisma.Decimal(product.price),
          stock: product.stock,
        },
      ]),
    );

    const blocked = new Set(wallet.user.productBlacklistIds);
    const blockedInCart = productIds.filter((productId) => blocked.has(productId));
    if (blockedInCart.length > 0) {
      throw new Error(`Blacklisted products in order: ${blockedInCart.join(', ')}`);
    }

    const total = items.reduce((sum, item) => {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new Error('Product missing during order validation');
      }
      if (item.quantity <= 0) {
        throw new Error(`Invalid quantity for ${product.name}`);
      }
      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}`);
      }

      return sum.plus(product.price.mul(item.quantity));
    }, new Prisma.Decimal(0));

    const available = new Prisma.Decimal(wallet.balance).plus(wallet.creditLimit);
    if (available.lessThan(total)) {
      throw new Error('Insufficient wallet balance/fiado limit');
    }

    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);

    const spentAggregate = await db.ledger.aggregate({
      where: {
        walletId: wallet.id,
        type: LedgerType.DEBIT,
        createdAt: { gte: dayStart },
      },
      _sum: { amount: true },
    });

    const spentToday = new Prisma.Decimal(spentAggregate._sum.amount ?? 0);
    const dailyLimit = new Prisma.Decimal(wallet.user.dailySpendingLimit);
    if (dailyLimit.greaterThan(0) && spentToday.plus(total).greaterThan(dailyLimit)) {
      throw new Error('Daily spending limit exceeded');
    }

    return {
      walletId: wallet.id,
      total,
      products: productMap,
    };
  }

  static async processTransaction(params: {
    tenantId: string;
    consumerId: string;
    items: OrderInputItem[];
    paymentMethod?: PaymentMethod;
  }) {
    const { tenantId, consumerId, items, paymentMethod = PaymentMethod.WALLET } = params;

    return prisma.$transaction(async (tx) => {
      const validation = await WalletService.validateOrder(tenantId, consumerId, items, tx);

      const order = await tx.order.create({
        data: {
          tenantId,
          userId: consumerId,
          walletId: validation.walletId,
          status: 'PENDING',
          totalPrice: validation.total,
          items: {
            create: items.map((item) => {
              const product = validation.products.get(item.productId)!;
              return {
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: product.price,
                totalPrice: product.price.mul(item.quantity),
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
            data: { stock: { decrement: item.quantity } },
          }),
        ),
      );

      await tx.wallet.update({
        where: { id: validation.walletId },
        data: {
          balance: {
            decrement: validation.total,
          },
        },
      });

      await tx.ledger.create({
        data: {
          walletId: validation.walletId,
          amount: validation.total,
          type: LedgerType.DEBIT,
          method: paymentMethod,
          description: `Order ${order.id}`,
        },
      });

      return order;
    });
  }
}
