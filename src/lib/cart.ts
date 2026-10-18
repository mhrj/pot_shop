import { prisma } from '@/lib/prisma';
import { priceCart, type CartTotals, type Tier } from '@/lib/pricing';
import { parseBundleItems } from '@/lib/product-features';

export function getStockShortages(
  items: Array<{ name: string; quantity: number; stock: number }>,
): Array<{ name: string; available: number }> {
  return items
    .filter((item) => item.quantity > item.stock)
    .map((item) => ({ name: item.name, available: item.stock }));
}

export function isPaymentAlreadyProcessed(
  order: { paymentStatus?: string | null; refId?: string | null } | null,
) {
  return !!order && order.paymentStatus === 'PAID' && !!order.refId;
}

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
          bundleSize: i.product.bundleSize,
          bundleLabel: i.product.bundleLabel,
          bundleItems: parseBundleItems(i.product.bundleItems),
          images: i.product.images,
          allowBatchDiscount: i.product.allowBatchDiscount,
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
    select: {
      id: true,
      stock: true,
      bundleSize: true,
      bundleLabel: true,
      minOrderQuantity: true,
    },
  });
  if (!product) throw new Error('محصول یافت نشد');

  const bundleSize = product.bundleSize || 1;
  const isBundle = Boolean(product.bundleLabel) && bundleSize > 1;
  const minQty = product.minOrderQuantity || 1;

  if (quantity < minQty) {
    throw new Error(`حداقل تعداد سفارش این کالا ${minQty} عدد است`);
  }

  if (isBundle && quantity % bundleSize !== 0) {
    throw new Error(`تعداد این کالا باید مضربی از ${bundleSize} باشد`);
  }

  // Validate the resulting line, not just this increment: adding 10 to a cart
  // that already holds 10 must fail against a stock of 15. Checkout re-checks
  // stock before creating an order, so this only spares the customer a trip to
  // the gateway for a basket that cannot be filled — it is not the authority.
  const existing = await prisma.cartItem.findUnique({
    where: { userId_productId: { userId, productId } },
    select: { quantity: true },
  });
  const target = (existing?.quantity ?? 0) + quantity;

  if (product.stock < target) {
    throw new Error(
      existing
        ? `موجودی کافی نیست — ${existing.quantity} عدد در سبد شماست و حداکثر موجودی ${product.stock} عدد است`
        : 'موجودی کافی نیست',
    );
  }

  return prisma.cartItem.upsert({
    where: { userId_productId: { userId, productId } },
    update: { quantity: target },
    create: { userId, productId, quantity: target },
  });
}

export async function clearCart(userId: string) {
  return prisma.cartItem.deleteMany({ where: { userId } });
}
