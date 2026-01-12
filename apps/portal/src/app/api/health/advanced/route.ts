/**
 * Advanced Health Check Endpoint
 * Detailed system health and performance metrics
 * Phase 4 Performance & Monitoring
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCacheStats } from '@/lib/cache-layer';

export const runtime = 'nodejs';

interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: {
    database: {
      status: 'healthy' | 'unhealthy';
      responseTime?: number;
      error?: string;
    };
    cache: {
      status: 'healthy' | 'unhealthy';
      keys: number;
      hitRate: number;
    };
    memory: {
      status: 'healthy' | 'warning';
      usage: number;
      percentage: number;
    };
  };
  metrics: {
    requestCount: number;
    errorCount: number;
    avgResponseTime: number;
  };
}

// In-memory metrics tracking
const metrics = {
  requestCount: 0,
  errorCount: 0,
  totalResponseTime: 0,
  startTime: Date.now()
};

export function recordRequest(duration: number, isError: boolean = false) {
  metrics.requestCount++;
  metrics.totalResponseTime += duration;
  if (isError) {
    metrics.errorCount++;
  }
}

export async function GET(): Promise<NextResponse<HealthCheckResponse>> {
  const startTime = Date.now();
  const checks = {
    database: { status: 'healthy' as const },
    cache: { status: 'healthy' as const, keys: 0, hitRate: 0 },
    memory: { status: 'healthy' as const, usage: 0, percentage: 0 }
  };

  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

  // ========================================================================
  // DATABASE CHECK
  // ========================================================================
  const dbStart = Date.now();
  try {
    const user = await db.user.findFirst({
      take: 1,
      select: { id: true }
    });
    
    const dbDuration = Date.now() - dbStart;
    checks.database = {
      status: 'healthy',
      responseTime: dbDuration
    };

    if (dbDuration > 500) {
      overallStatus = 'degraded';
    }
  } catch (error) {
    checks.database = {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    overallStatus = 'unhealthy';
  }

  // ========================================================================
  // CACHE CHECK
  // ========================================================================
  try {
    const cacheStats = getCacheStats();
    checks.cache = {
      status: 'healthy',
      keys: cacheStats.keys,
      hitRate: cacheStats.hitRate
    };
  } catch (error) {
    checks.cache = {
      status: 'healthy',
      keys: 0,
      hitRate: 0
    };
  }

  // ========================================================================
  // MEMORY CHECK
  // ========================================================================
  try {
    const memUsage = process.memoryUsage();
    const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;

    checks.memory = {
      status: heapUsedPercent > 80 ? 'warning' : 'healthy',
      usage: Math.round(memUsage.heapUsed / 1024 / 1024),
      percentage: Math.round(heapUsedPercent)
    };

    if (heapUsedPercent > 80) {
      overallStatus = 'degraded';
    }
  } catch (error) {
    checks.memory = {
      status: 'healthy',
      usage: 0,
      percentage: 0
    };
  }

  // ========================================================================
  // RESPONSE
  // ========================================================================
  const uptime = (Date.now() - metrics.startTime) / 1000;
  const avgResponseTime = metrics.requestCount > 0 
    ? metrics.totalResponseTime / metrics.requestCount 
    : 0;

  const response: HealthCheckResponse = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime,
    checks,
    metrics: {
      requestCount: metrics.requestCount,
      errorCount: metrics.errorCount,
      avgResponseTime: Math.round(avgResponseTime)
    }
  };

  const statusCode = overallStatus === 'unhealthy' ? 503 : 200;
  
  return NextResponse.json(response, { status: statusCode });
}
