// Health check endpoint for uptime monitoring
export async function GET() {
  return Response.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'design-studio',
      version: '0.1.0',
    },
    { status: 200 }
  );
}
