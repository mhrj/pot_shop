import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEitaaNotification } from '@/lib/eitaa';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fullName, phone, businessName, estimatedQty, message } = body;

    const trimmedName = typeof fullName === 'string' ? fullName.trim() : '';
    const trimmedPhone = typeof phone === 'string' ? phone.trim() : '';
    const trimmedBusiness = typeof businessName === 'string' ? businessName.trim() : '';
    const trimmedQty = typeof estimatedQty === 'string' ? estimatedQty.trim() : '';
    const trimmedMsg = typeof message === 'string' ? message.trim() : '';

    if (!trimmedName || trimmedName.length < 2) {
      return NextResponse.json(
        { error: 'لطفاً نام و نام خانوادگی خود را کامل وارد کنید.' },
        { status: 400 },
      );
    }

    // Validate phone (support Persian/English numerals for 11-digit mobile starting with 09)
    const normalizedPhone = trimmedPhone.replace(/[۰-۹]/g, (d) =>
      String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)),
    );
    if (!/^09\d{9}$/.test(normalizedPhone) && !/^\d{8,11}$/.test(normalizedPhone)) {
      return NextResponse.json(
        { error: 'شماره تماس معتبر نیست (مثال: ۰۹۱۲۳۴۵۶۷۸۹).' },
        { status: 400 },
      );
    }

    if (!trimmedQty) {
      return NextResponse.json(
        { error: 'لطفاً تیراژ تقریبی مورد نیاز را مشخص کنید.' },
        { status: 400 },
      );
    }

    const inquiry = await prisma.wholesaleInquiry.create({
      data: {
        fullName: trimmedName,
        phone: normalizedPhone,
        businessName: trimmedBusiness || null,
        estimatedQty: trimmedQty,
        message: trimmedMsg || null,
      },
    });

    // Send instant Eitaa notification to admin
    try {
      const eitaaText = `🌿 <b>درخواست استعلام عمده جدید (B2B)!</b>

👤 نام متقاضی: <b>${inquiry.fullName}</b>
📞 شماره تماس: <code>${inquiry.phone}</code>
🏢 کسب‌وکار: ${inquiry.businessName ?? 'ثبت نشده'}
📦 تیراژ تقریبی: <b>${inquiry.estimatedQty}</b>
${inquiry.message ? `📝 یادداشت: <i>${inquiry.message}</i>` : ''}

⏰ ثبت در سیستم: ${new Date().toLocaleTimeString('fa-IR')}`;

      await sendEitaaNotification(eitaaText);
    } catch (eitaaErr) {
      console.error('[wholesale] Failed to dispatch Eitaa alert:', eitaaErr);
    }

    return NextResponse.json({
      ok: true,
      message: 'درخواست شما با موفقیت ثبت شد. کارشناسان ما به زودی با شما تماس خواهند گرفت.',
      id: inquiry.id,
    });
  } catch (error) {
    console.error('[api/wholesale] error creating inquiry:', error);
    return NextResponse.json(
      { error: 'خطایی در ثبت درخواست رخ داد. لطفاً مجدداً تلاش کنید.' },
      { status: 500 },
    );
  }
}
