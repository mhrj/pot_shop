import 'server-only';
import { prisma } from '@/lib/prisma';
import { priceCart, type CartTotals, type Tier } from '@/lib/pricing';

export async function getCartTotals(userId: string): Promise<CartTotals> {
  const items = await prisma.cartItem.findMany({
    where: { userId },
    include: {
      product: {
        include: {
          tiers: { orderBy: { minQuantity: 'asc' } },
          images: { orderBy: { sortOrder: 'asc' }, take: 1 },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  return priceCart(
    items
      .filter((i) => i.product.isActive)
      .map((i) => ({
        product: {
          id: i.product.id,
          slug: i.product.slug,
          name: i.product.name,
          basePriceToman: i.product.basePriceToman,
          weightGrams: i.product.weightGrams,
          unitsPerCarton: i.product.unitsPerCarton,
          images: i.product.images,
        },
        tiers: i.product.tiers.map(
          (t): Tier => ({
            minQuantity: t.minQuantity,
            unitPriceToman: t.unitPriceToman,
            label: t.label,
          }),
        ),
        quantity: i.quantity,
      })),
  );
}

export async function addToCart(
  userId: string,
  productId: string,
  quantity: number,
) {
  const product = await prisma.product.findFirst({
    where: { id: productId, isActive: true },
    select: { id: true, stock: true },
  });
  if (!product) throw new Error('محصول یافت نشد');
  if (product.stock < quantity) throw new Error('موجودی کافی نیست');

  return prisma.cartItem.upsert({
    where: { userId_productId: { userId, productId } },
    update: { quantity: { increment: quantity } },
    create: { userId, productId, quantity },
  });
}

export async function clearCart(userId: string) {
  return prisma.cartItem.deleteMany({ where: { userId } });
}
