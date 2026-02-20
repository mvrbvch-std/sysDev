import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

const prisma = new PrismaClient();

type StatementParams = {
  consumerId: string;
};

type GovernanceBody = {
  dailySpendingLimit?: number;
  productId?: string;
  blocked?: boolean;
};

export class SponsorController {
  static async statement(req: Request<StatementParams>, res: Response) {
    const { consumerId } = req.params;

    const wallet = await prisma.wallet.findUnique({
      where: { userId: consumerId },
      include: {
        ledgerEntries: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        user: true,
      },
    });

    if (!wallet) {
      return res.status(404).json({ message: 'Consumer wallet not found' });
    }

    return res.status(200).json({
      balance: wallet.balance,
      creditLimit: wallet.creditLimit,
      dailySpendingLimit: wallet.user.dailySpendingLimit,
      productBlacklistIds: wallet.user.productBlacklistIds,
      ledger: wallet.ledgerEntries,
    });
  }

  static async updateGovernance(req: Request<StatementParams, unknown, GovernanceBody>, res: Response) {
    const { consumerId } = req.params;
    const { dailySpendingLimit, productId, blocked } = req.body;

    try {
      const consumer = await prisma.user.findUnique({ where: { id: consumerId } });
      if (!consumer || consumer.role !== 'CONSUMER') {
        return res.status(404).json({ message: 'Consumer not found' });
      }

      const blacklist = new Set(consumer.productBlacklistIds);
      if (productId) {
        if (blocked) blacklist.add(productId);
        else blacklist.delete(productId);
      }

      const updated = await prisma.user.update({
        where: { id: consumerId },
        data: {
          dailySpendingLimit: dailySpendingLimit ?? consumer.dailySpendingLimit,
          productBlacklistIds: [...blacklist],
        },
      });

      return res.status(200).json(updated);
    } catch (error) {
      return res.status(422).json({ message: error instanceof Error ? error.message : 'Governance update failed' });
    }
  }
}
