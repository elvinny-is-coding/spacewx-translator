// lib/cors.ts

export function corsHeaders(): HeadersInit {
  return {
    "Access-Control-Allow-Origin":
      process.env.ALLOWED_ORIGINS?.split(",") || "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
}

export function handleCorsPreflight(): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(),
  });
}
