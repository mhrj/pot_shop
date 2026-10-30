'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { sendEitaaNotification } from '@/lib/eitaa';

const wholesaleInquirySchema = z.object({
  fullName: z.string().trim().min(2, 'لطفاً نام و نام خانوادگی خود را کامل وارد کنید.'),
  phone: z
    .string()
    .trim()
    .transform((val) => val.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))))
    .refine(
      (val) => /^09\d{9}$/.test(val) || /^\d{8,11}$/.test(val),
      'شماره تماس معتبر نیست (مثال: ۰۹۱۲۳۴۵۶۷۸۹).',
    ),
  businessName: z.string().trim().optional().nullable(),
  estimatedQty: z.string().trim().min(1, 'لطفاً تیراژ تقریبی مورد نیاز را مشخص کنید.'),
  message: z.string().trim().optional().nullable(),
});

export type WholesaleInquiryInput = {
  fullName: string;
  phone: string;
  businessName?: string | null;
  estimatedQty: string;
  message?: string | null;
};

export async function submitWholesaleInquiryAction(input: WholesaleInquiryInput) {
  const parsed = wholesaleInquirySchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.issues[0]?.message ?? 'اطلاعات وارد شده نامعتبر است.',
    };
  }

  const { fullName, phone, businessName, estimatedQty, message } = parsed.data;

  try {
    const inquiry = await prisma.wholesaleInquiry.create({
      data: {
        fullName,
        phone,
        businessName: businessName || null,
        estimatedQty,
        message: message || null,
      },
      select: {
        id: true,
        fullName: true,
        phone: true,
        businessName: true,
        estimatedQty: true,
        message: true,
      },
    });

    // Send instant Eitaa notification to admin (best effort)
    try {
      const eitaaText = `🌿 <b>درخواست استعلام عمده جدید (B2B)!</b>\n\n👤 نام متقاضی: <b>${inquiry.fullName}</b>\n📞 شماره تماس: <code>${inquiry.phone}</code>\n🏢 کسب‌وکار: ${inquiry.businessName ?? 'ثبت نشده'}\n📦 تیراژ تقریبی: <b>${inquiry.estimatedQty}</b>\n${inquiry.message ? `📝 یادداشت: <i>${inquiry.message}</i>\n` : ''}\n⏰ ثبت در سیستم: ${new Date().toLocaleTimeString('fa-IR')}`;
      await sendEitaaNotification(eitaaText);
    } catch (eitaaErr) {
      console.error('[wholesale action] Failed to dispatch Eitaa alert:', eitaaErr);
    }

    return {
      success: true as const,
      id: inquiry.id,
      message: 'درخواست شما با موفقیت ثبت شد. کارشناسان ما به زودی با شما تماس خواهند گرفت.',
    };
  } catch (error) {
    console.error('[wholesale action] error creating inquiry:', error);
    return {
      success: false as const,
      error: 'خطایی در ثبت درخواست رخ داد. لطفاً مجدداً تلاش کنید.',
    };
  }
}
