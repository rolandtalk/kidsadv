export async function onRequestGet(context: { request: Request }) {
  try {
    const urlObj = new URL(context.request.url);
    const query = urlObj.searchParams.get('q');
    
    if (!query) {
      return new Response(JSON.stringify({ error: "Missing 'q' query parameter" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const lexicaUrl = `https://lexica.art/api/v1/search?q=${encodeURIComponent(query)}`;
    const response = await fetch(lexicaUrl);
    
    if (!response.ok) {
      return new Response(JSON.stringify({ error: `Lexica API returned status ${response.status}` }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
