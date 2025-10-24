import { NextResponse } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'src', 'data', 'form-config.json');
    const raw = await fs.readFile(filePath, 'utf8');
    const config = JSON.parse(raw);

    return NextResponse.json({ ok: true, config });
  } catch (err) {
    console.error('FORM_CONFIG_READ_ERROR', err);
    return NextResponse.json({ ok: false, error: 'Config not found' }, { status: 500 });
  }
}
