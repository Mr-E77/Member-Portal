// Health check endpoint for uptime monitoring
export async function GET() {
  return Response.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'member-portal',
      version: '0.1.0',
    },
    { status: 200 }
  );
}
