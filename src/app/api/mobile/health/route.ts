import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import axios from 'axios';

export async function GET() {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  const status = {
    server: true,
    database: false,
    bapenda: false,
    timestamp: new Date().toISOString(),
  };

  try {
    // 1. Check Database
    await prisma.$queryRaw`SELECT 1`;
    status.database = true;

    // 2. Check Bapenda Connectivity (Simple Ping to the base domain)
    try {
      const bapendaRes = await axios.get('https://bapenda.jombangkab.go.id', { 
        timeout: 3000,
        validateStatus: () => true 
      });
      status.bapenda = bapendaRes.status === 200;
    } catch (e) {
      status.bapenda = false;
    }

    return NextResponse.json({ success: true, status }, { headers });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      status: { ...status, server: true, database: false } 
    }, { status: 500, headers });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
