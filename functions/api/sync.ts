interface Env {
  LIBRARY_KV?: KVNamespace;
}

export async function onRequest(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const urlObj = new URL(request.url);

  // Check KV Namespace binding
  if (!env.LIBRARY_KV) {
    return new Response(
      JSON.stringify({ 
        error: "KV_NOT_BOUND",
        message: "Cloudflare KV namespace 'LIBRARY_KV' is not bound. Please bind a KV namespace named 'LIBRARY_KV' in your Pages project settings." 
      }), 
      {
        status: 200, // Return 200 so the frontend can read the JSON error code gracefully
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    if (request.method === 'GET') {
      const syncKey = urlObj.searchParams.get('key');
      if (!syncKey) {
        return new Response(JSON.stringify({ error: "Missing 'key' query parameter" }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // KV keys must be simple strings. We will prefix the key to namespace it.
      const kvKey = `sync:${syncKey}`;
      const data = await env.LIBRARY_KV.get(kvKey);
      
      if (!data) {
        return new Response(JSON.stringify([]), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(data, {
        headers: { 'Content-Type': 'application/json' }
      });
    } 
    
    if (request.method === 'POST') {
      const body: any = await request.json();
      const { key, books } = body;

      if (!key) {
        return new Response(JSON.stringify({ error: "Missing 'key' in body" }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (!books || !Array.isArray(books)) {
        return new Response(JSON.stringify({ error: "Missing or invalid 'books' array in body" }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const kvKey = `sync:${key}`;
      // Store books as a minified JSON string
      await env.LIBRARY_KV.put(kvKey, JSON.stringify(books));

      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
