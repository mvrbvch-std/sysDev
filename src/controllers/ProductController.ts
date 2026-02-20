import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

const prisma = new PrismaClient();

type UpsertProductBody = {
  tenantId: string;
  category: string;
  name: string;
  price: number;
  cost: number;
  stock: number;
  imageUrl?: string;
  isAvailable?: boolean;
};

export class ProductController {
  static async list(req: Request, res: Response) {
    const tenantId = req.query.tenantId as string;

    const products = await prisma.product.findMany({
      where: { tenantId, isAvailable: true },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    return res.status(200).json(products);
  }

  static async upsert(req: Request<{ id?: string }, unknown, UpsertProductBody>, res: Response) {
    const { id } = req.params;
    const data = req.body;

    if (!data.tenantId || !data.name) {
      return res.status(400).json({ message: 'tenantId and name are required' });
    }

    if (id) {
      const product = await prisma.product.update({
        where: { id },
        data: {
          ...data,
          price: data.price,
          cost: data.cost,
          isAvailable: data.isAvailable ?? true,
        },
      });
      return res.status(200).json(product);
    }

    const product = await prisma.product.create({
      data: {
        ...data,
        isAvailable: data.isAvailable ?? true,
      },
    });

    return res.status(201).json(product);
  }
}
