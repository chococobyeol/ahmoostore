import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const { message, data } = await request.json();
    
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n${JSON.stringify(data, null, 2)}\n\n`;
    
    const logPath = path.join(process.cwd(), 'logs', 'payment.log');
    await fs.appendFile(logPath, logEntry);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('로그 저장 실패:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
} 