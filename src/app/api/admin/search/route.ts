import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getActiveAdmin } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const admin = await getActiveAdmin();
  if (!admin) {
    return NextResponse.json({ message: 'دسترسی غیرمجاز' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim() ?? '';

  if (!q) {
    return NextResponse.json({ users: [], orders: [], products: [] });
  }

  const [users, orders, products] = await Promise.all([
    prisma.user.findMany({
      where: {
        OR: [
          { phone: { contains: q, mode: 'insensitive' } },
          { fullName: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        role: true,
        isActive: true,
      },
      take: 5,
    }),
    prisma.order.findMany({
      where: {
        orderNumber: { contains: q, mode: 'insensitive' },
      },
      select: {
        id: true,
        orderNumber: true,
        totalToman: true,
        status: true,
        paymentStatus: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
      take: 5,
    }),
    prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { slug: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        basePriceToman: true,
        stock: true,
        images: {
          select: { url: true },
          take: 1,
          orderBy: { sortOrder: 'asc' },
        },
      },
      take: 5,
    }),
  ]);

  return NextResponse.json({ users, orders, products });
}
