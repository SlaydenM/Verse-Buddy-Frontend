import { NextRequest, NextResponse } from 'next/server';
import { Handler } from '@/lib/api-handler';

export async function POST(req: NextRequest) {
  try {
    const { ids } = await req.json();
    const result = await Handler.unfavoriteAll(ids);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}