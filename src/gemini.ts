export interface StoryConfig {
  theme: string;
  protagonistName: string;
  protagonistDescription: string;
  companionName?: string;
  companionDescription?: string;
  specialTool?: string;
  pagesCount: number;
  tone: string;
  ageGroup: string;
  illustrationStyle?: 'fairy' | 'simple_strokes';
}

export interface StoryPage {
  pageNumber: number;
  storyText: string;
  illustrationPrompt: string;
}

export interface GeneratedBook {
  title: string;
  pages: StoryPage[];
}

export async function generateStory(apiKey: string, config: StoryConfig, model: string = 'gemini-2.5-flash'): Promise<GeneratedBook> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const companionSection = config.companionName 
    ? `- Companion Name: ${config.companionName}\n- Companion Description: ${config.companionDescription || 'N/A'}`
    : '';

  const toolSection = config.specialTool 
    ? `- Special Tool/Item: ${config.specialTool}`
    : '';

  const stylePromptPart = config.illustrationStyle === 'simple_strokes'
    ? "minimalist simple black ink outline sketch on a clean solid white background, cute childlike marker doodle style, simple strokes, black ink on white paper, no color, no background detail"
    : "whimsical watercolor illustration or children's book art";

  const promptText = `
Write an illustrated children's adventure book with the following details:
- Theme/Genre: ${config.theme}
- Tone: ${config.tone}
- Target Age Group: ${config.ageGroup}
- Number of Pages: ${config.pagesCount}
- Protagonist Name: ${config.protagonistName}
- Protagonist Description: ${config.protagonistDescription}
${companionSection}
${toolSection}

Guidelines:
1. Break the story down into exactly ${config.pagesCount} sequential pages.
2. For each page, write 2-4 sentences of storytelling text suitable for the target age group.
3. For each page, provide a detailed image generation prompt for the illustration. The image prompt MUST include the protagonist's physical description: "${config.protagonistDescription}" (and companion if applicable) to ensure visual consistency. Specify a style aligned with: ${stylePromptPart}.
4. Output the result in JSON format matching the schema.
  `.trim();

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: promptText,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            title: { type: 'STRING' },
            pages: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  pageNumber: { type: 'INTEGER' },
                  storyText: { type: 'STRING' },
                  illustrationPrompt: { type: 'STRING' },
                },
                required: ['pageNumber', 'storyText', 'illustrationPrompt'],
              },
            },
          },
          required: ['title', 'pages'],
        },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API Error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  try {
    const jsonText = data.candidates[0].content.parts[0].text;
    return JSON.parse(jsonText) as GeneratedBook;
  } catch (e) {
    console.error('Failed to parse Gemini response text:', data);
    throw new Error('Failed to parse story JSON from Gemini API response.');
  }
}

export async function generateImage(apiKey: string, prompt: string, model: string = 'gemini-2.5-flash-image'): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini Image Error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const inlineData = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData;
  
  if (!inlineData || !inlineData.data) {
    throw new Error("No image data returned from Gemini");
  }

  return `data:${inlineData.mimeType};base64,${inlineData.data}`;
}

export async function searchLexicaImage(prompt: string): Promise<string> {
  // Use a shorter version of the prompt if it's too long, focusing on key elements
  const cleanPrompt = prompt.split(',')[0].slice(0, 100);
  const url = `https://lexica.art/api/v1/search?q=${encodeURIComponent(cleanPrompt)}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Lexica Search API Error: ${response.status}`);
  }

  const data = await response.json();
  if (data.images && data.images.length > 0) {
    // Select one of the top 3 images for some variety
    const randomIndex = Math.min(Math.floor(Math.random() * 3), data.images.length - 1);
    return data.images[randomIndex].src;
  }
  
  throw new Error("No images found matching prompt on Lexica");
}

