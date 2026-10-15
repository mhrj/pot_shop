import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { saveUploadedImage } from '@/lib/storage';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ message: 'دسترسی ندارید' }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const kind = (formData.get('kind') ?? 'product').toString();

    if (!(file instanceof File)) {
      return NextResponse.json({ message: 'فایلی ارسال نشده است' }, { status: 400 });
    }

    const result = await saveUploadedImage(file, kind === 'landing' ? 'landing' : 'product');
    return NextResponse.json({ ok: true, url: result.url, filename: result.filename });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'آپلود ناموفق بود';
    return NextResponse.json({ message }, { status: 400 });
  }
}
