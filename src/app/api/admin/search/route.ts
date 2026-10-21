import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getActiveAdmin } from '@/lib/auth';
import { toEn } from '@/lib/format';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const admin = await getActiveAdmin();
  if (!admin) {
    return NextResponse.json({ message: 'دسترسی غیرمجاز' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const rawQ = (searchParams.get('q') ?? '').trim();
  const q = toEn(rawQ);

  if (!rawQ && !q) {
    return NextResponse.json({ users: [], orders: [], products: [] });
  }

  const [users, orders, products] = await Promise.all([
    prisma.user.findMany({
      where: {
        OR: [
          { phone: { contains: q, mode: 'insensitive' } },
          { fullName: { contains: rawQ, mode: 'insensitive' } },
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
        OR: [
          { orderNumber: { contains: q, mode: 'insensitive' } },
          { id: { contains: q, mode: 'insensitive' } },
          { refId: { contains: q, mode: 'insensitive' } },
          { shipPhone: { contains: q, mode: 'insensitive' } },
          { shipFullName: { contains: rawQ, mode: 'insensitive' } },
          { user: { fullName: { contains: rawQ, mode: 'insensitive' } } },
        ],
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
          { name: { contains: rawQ, mode: 'insensitive' } },
          { id: { contains: q, mode: 'insensitive' } },
          { slug: { contains: q, mode: 'insensitive' } },
          { sku: { contains: q, mode: 'insensitive' } },
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
