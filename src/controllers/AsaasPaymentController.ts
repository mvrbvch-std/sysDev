import { Prisma, PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

const prisma = new PrismaClient();
const ASAAS_BASE_URL = process.env.ASAAS_BASE_URL ?? 'https://api-sandbox.asaas.com/v3';
const ASAAS_API_KEY = process.env.ASAAS_API_KEY ?? '';

type CreatePixBody = {
  walletId: string;
  amount: number;
  description?: string;
};

type AsaasWebhookBody = {
  event: 'PAYMENT_RECEIVED' | string;
  payment: {
    id: string;
    value: number;
    status: 'RECEIVED' | string;
  };
};

async function asaasFetch(path: string, init?: RequestInit) {
  const response = await fetch(`${ASAAS_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      access_token: ASAAS_API_KEY,
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Asaas request failed (${response.status}): ${body}`);
  }

  return response;
}

export class AsaasPaymentController {
  static async createDynamicPix(req: Request<unknown, unknown, CreatePixBody>, res: Response) {
    const { walletId, amount, description } = req.body;

    if (!walletId || !amount || amount <= 0) {
      return res.status(400).json({ message: 'walletId and positive amount are required' });
    }

    if (!ASAAS_API_KEY) {
      return res.status(500).json({ message: 'ASAAS_API_KEY is not configured' });
    }

    try {
      const wallet = await prisma.wallet.findUnique({ where: { id: walletId }, include: { user: true } });
      if (!wallet) return res.status(404).json({ message: 'Wallet not found' });

      const customerResponse = await asaasFetch('/customers', {
        method: 'POST',
        body: JSON.stringify({
          name: wallet.user.name,
          externalReference: wallet.userId,
        }),
      });
      const customer = (await customerResponse.json()) as { id: string };

      const paymentResponse = await asaasFetch('/payments', {
        method: 'POST',
        body: JSON.stringify({
          customer: customer.id,
          billingType: 'PIX',
          value: amount,
          dueDate: new Date().toISOString().split('T')[0],
          description: description ?? 'Wallet recharge',
        }),
      });
      const payment = (await paymentResponse.json()) as { id: string };

      const qrCodeResponse = await asaasFetch(`/payments/${payment.id}/pixQrCode`);
      const qrCode = (await qrCodeResponse.json()) as { payload: string };

      const record = await prisma.asaasPayment.create({
        data: {
          walletId,
          asaasPaymentId: payment.id,
          pixQrCode: qrCode.payload,
          amount: new Prisma.Decimal(amount),
          status: 'PENDING',
        },
      });

      return res.status(201).json(record);
    } catch (error) {
      return res.status(500).json({ message: error instanceof Error ? error.message : 'Asaas integration failed' });
    }
  }

  static async webhook(req: Request<unknown, unknown, AsaasWebhookBody>, res: Response) {
    const { event, payment } = req.body;

    if (event !== 'PAYMENT_RECEIVED' || payment.status !== 'RECEIVED') {
      return res.status(200).json({ ignored: true });
    }

    try {
      await prisma.$transaction(async (tx) => {
        const paymentRecord = await tx.asaasPayment.findUnique({
          where: { asaasPaymentId: payment.id },
        });

        if (!paymentRecord) {
          throw new Error('Asaas payment not registered');
        }

        if (paymentRecord.status === 'RECEIVED') {
          return;
        }

        const value = new Prisma.Decimal(payment.value);

        await tx.asaasPayment.update({
          where: { id: paymentRecord.id },
          data: { status: 'RECEIVED' },
        });

        await tx.wallet.update({
          where: { id: paymentRecord.walletId },
          data: {
            balance: { increment: value },
          },
        });

        await tx.ledger.create({
          data: {
            walletId: paymentRecord.walletId,
            amount: value,
            type: 'CREDIT',
            method: 'PIX',
            description: `Asaas recharge ${payment.id}`,
          },
        });
      });

      return res.status(200).json({ received: true });
    } catch (error) {
      return res.status(422).json({ message: error instanceof Error ? error.message : 'Webhook processing failed' });
    }
  }
}
