export async function onRequestPost(context: {
  request: Request;
  env: { GEMINI_API_KEY?: string };
}) {
  try {
    const { model, payload } = await context.request.json() as {
      model: string;
      payload: any;
    };

    // Retrieve client key or fallback to environment key
    const clientKey = context.request.headers.get('x-gemini-api-key');
    const apiKey = clientKey || context.env.GEMINI_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API Key not provided. Please supply x-gemini-api-key header or configure server environment.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(errorText, {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
