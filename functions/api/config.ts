export async function onRequestGet(context: { env: { GEMINI_API_KEY?: string } }) {
  const hasKey = !!context.env.GEMINI_API_KEY;
  return new Response(JSON.stringify({ hasKey }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
