export const callGeminiAPI = async (promptOrParts, apiKey = '', modelName = "gemini-2.5-flash", localTextUrl = "", localTextModel = "") => {
    // Local Mode Route
    if (localTextUrl) {
        try {
            const promptText = Array.isArray(promptOrParts) ? promptOrParts.map(p => p.text).join('\n') : promptOrParts;
            const res = await fetch(localTextUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: localTextModel || 'llama3', 
                    prompt: promptText,
                    stream: false
                })
            });
            const data = await res.json();
            return data.response || data.choices?.[0]?.message?.content || "Local LLM responded without standard format.";
        } catch (e) {
            console.error(e);
            throw new Error("Failed to connect to local LLM: " + e.message);
        }
    }

    if (!apiKey) throw new Error("API Key is missing and Local Mode is not configured.");

    const parts = Array.isArray(promptOrParts) ? promptOrParts : [{ text: promptOrParts }];

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    role: 'user',
                    parts: parts
                }],
                generationConfig: {
                    temperature: 0.7,
                }
            })
        }
    );

    if (!response.ok) {
        const errorDetails = await response.text();
        console.error("Gemini API Error:", errorDetails);
        let msg = "Failed to generate content from AI";
        try {
            const parsed = JSON.parse(errorDetails);
            msg = parsed.error?.message || msg;
        } catch (e) { }
        throw new Error(msg);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
};

export const generateImageAPI = async (prompt, apiKey = '', localImageUrl = '') => {
    if (localImageUrl) {
        try {
            const res = await fetch(localImageUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: prompt,
                    steps: 20
                })
            });
            const data = await res.json();
            if (data.images && data.images.length > 0) {
                return `data:image/png;base64,${data.images[0]}`;
            }
            throw new Error("No image returned from local API");
        } catch (e) {
            console.error(e);
            throw new Error("Failed local image generation: " + e.message);
        }
    }

    if (apiKey) {
        try {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    instances: [{ prompt: prompt }],
                    parameters: { sampleCount: 1, aspectRatio: "16:9" }
                })
            });
            
            if (res.ok) {
                const data = await res.json();
                if (data.predictions && data.predictions.length > 0) {
                    return `data:image/jpeg;base64,${data.predictions[0].bytesBase64Encoded}`;
                }
            } else {
                console.warn("Imagen API Failed", await res.text());
            }
        } catch (e) {
            console.error("Imagen API Failed, falling back to pollinations...", e);
        }
    }
    
    // Fallback: Pollinations AI
    const seed = Math.floor(Math.random() * 100000);
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&seed=${seed}&nologo=true`;
};


export const generateStyleBreakdown = async (story, apiKey, localUrl = '', localModel = '') => {
    const prompt = `You are an expert film director and production designer. Analyze the following story and extract its visual style and general vibe. 
Return EXACTLY a JSON array of 5 to 7 strings representing the style keywords. Do not return any other text or markdown.
Story: "${story}"`;

    const text = await callGeminiAPI(prompt, apiKey, "gemini-2.5-flash", localUrl, localModel);
    try {
        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleaned);
    } catch (e) {
        return ['Cinematic', 'Dramatic', 'Moody', 'High Contrast']; 
    }
};

export const generateSceneBreakdown = async (story, keywords = [], characters = [], apiKey, localUrl = '', localModel = '') => {
    const prompt = `You are an expert screenwriter. Break down the following story into 3-5 distinct scenes. 
Return EXACTLY a JSON array of objects. Each object should have:
- "sceneNumber": integer
- "location": string (e.g. "INT. COFFEE SHOP - DAY")
- "action": string (a short sentence describing what happens)
Do not return any other text or markdown.

Story Context:
"${story}"
${keywords.length ? `Visual Vibe Keywords: ${keywords.join(', ')}` : ''}
${characters.length ? `Established Characters: ${characters.map(c => c.name).join(', ')}` : ''}
`;

    const text = await callGeminiAPI(prompt, apiKey, "gemini-2.5-pro", localUrl, localModel);
    try {
        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleaned);
    } catch (e) {
        return [
            { sceneNumber: 1, location: "EXT. CITY STREET - NIGHT", action: "Establishing shot of the city." },
            { sceneNumber: 2, location: "INT. APARTMENT - NIGHT", action: "Character looks out the window." }
        ]; 
    }
};

export const generateStoryboardDescription = async (sceneContext, keywords = [], characters = [], apiKey, localUrl = '', localModel = '') => {
    const charsInfo = characters.map(c => `${c.name} (${c.role}): ${c.description}`).join(' | ');
    const prompt = `You are an expert storyboard artist. Based on this scene context:
"${sceneContext.location} - ${sceneContext.action}"

Additional Project Context:
${keywords.length ? `Visual Keywords: ${keywords.join(', ')}` : ''}
${characters.length ? `Characters: ${charsInfo}` : ''}

Create a very detailed image generation prompt for a storyboard frame. Focus on camera angle, lighting, character placement, and mood.
Keep it strictly under 50 words. Do NOT include phrases like "Here is the prompt:" or "Image prompt:". Just return the prompt text.`;

    const text = await callGeminiAPI(prompt, apiKey, "gemini-2.5-flash", localUrl, localModel);
    return text.trim();
};

export const generateCharacters = async (story, keywords = [], apiKey, localUrl = '', localModel = '') => {
    const prompt = `You are an expert character concept artist. Based on the following story, extract 2 to 4 main characters.
For each character, provide a descriptive visual prompt suitable for generating a T-Pose character reference sheet (front, side, and back/top views).
Return EXACTLY a JSON array of objects. Each object should have:
- "name": string (Character's name)
- "role": string (e.g. "Protagonist", "Villain")
- "description": string (Detailed physical description focusing on clothing, features, and vibe, no more than 60 words. Emphasize it's for a T-Pose character sheet.)
Do not return any other text or markdown.

Story Context:
"${story}"
${keywords.length ? `Visual Vibe Keywords: ${keywords.join(', ')}` : ''}`;

    const text = await callGeminiAPI(prompt, apiKey, "gemini-2.5-pro", localUrl, localModel);
    try {
        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleaned);
    } catch (e) {
        return [
            { name: "John Doe", role: "Protagonist", description: "A gritty cyberpunk detective in a trench coat. Character sheet style, T-pose, front, side, and back views. High detail." }
        ]; 
    }
};

export const extractStoryFromFile = async (base64Data, mimeType, apiKey, localUrl = '', localModel = '') => {
    // Note: Local OCR with images usually requires a multimodal local model (like LLaVA),
    // which operates on a different payload. We will just pass it to Gemini if Local URL is empty,
    // otherwise warn that local vision is limited in this basic implementation.
    if (localUrl) {
         return {
            language: "English",
            isEnglish: true,
            originalText: "Local Image Extraction Not Fully Supported yet.",
            translatedText: "Local Image Extraction Not Fully Supported yet."
        };
    }

    const parts = [
        {
            inlineData: {
                mimeType,
                data: base64Data
            }
        },
        {
            text: `Analyze the attached file/image. 
1. Detect the primary language of the text.
2. Extract and completely transcribe the core story/script.
3. If the language is NOT English, provide a complete English translation.
4. Return EXACTLY a JSON object with these keys: 
   "language": "detected language name",
   "isEnglish": boolean,
   "originalText": "the raw transcription",
   "translatedText": "the english translation (same as original if already English)"
Do not return any other text or markdown.`
        }
    ];

    const text = await callGeminiAPI(parts, apiKey, "gemini-2.5-pro", localUrl, localModel);
    try {
        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleaned);
    } catch (e) {
        return {
            language: "Unknown",
            isEnglish: true,
            originalText: text.trim(),
            translatedText: text.trim()
        };
    }
};
