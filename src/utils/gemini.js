export const callGeminiAPI = async (promptOrParts, apiKey, modelName = "gemini-2.5-flash") => {
    if (!apiKey) throw new Error("API Key is missing");

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

export const generateStyleBreakdown = async (story, apiKey) => {
    const prompt = `You are an expert film director and production designer. Analyze the following story and extract its visual style and general vibe. 
Return EXACTLY a JSON array of 5 to 7 strings representing the style keywords. Do not return any other text or markdown.
Story: "${story}"`;

    const text = await callGeminiAPI(prompt, apiKey);
    try {
        // Clean up potential markdown code block formatting
        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleaned);
    } catch (e) {
        console.error("Style parsing failed", e);
        return ['Cinematic', 'Dramatic', 'Moody', 'High Contrast']; // fallback
    }
};

export const generateSceneBreakdown = async (story, keywords = [], characters = [], apiKey) => {
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

    // Falling back to gemini-2.5-pro instead of gemini-3.0-pro because 3.0 is not yet a valid API model string
    const text = await callGeminiAPI(prompt, apiKey, "gemini-2.5-pro");
    try {
        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleaned);
    } catch (e) {
        console.error("Scene parsing failed", e);
        return [
            { sceneNumber: 1, location: "EXT. CITY STREET - NIGHT", action: "Establishing shot of the city." },
            { sceneNumber: 2, location: "INT. APARTMENT - NIGHT", action: "Character looks out the window." }
        ]; // fallback
    }
};

export const generateStoryboardDescription = async (sceneContext, keywords = [], characters = [], apiKey) => {
    const charsInfo = characters.map(c => `${c.name} (${c.role}): ${c.description}`).join(' | ');
    const prompt = `You are an expert storyboard artist. Based on this scene context:
"${sceneContext.location} - ${sceneContext.action}"

Additional Project Context:
${keywords.length ? `Visual Keywords: ${keywords.join(', ')}` : ''}
${characters.length ? `Characters: ${charsInfo}` : ''}

Create a very detailed image generation prompt for a storyboard frame. Focus on camera angle, lighting, character placement, and mood.
Keep it strictly under 50 words. Do NOT include phrases like "Here is the prompt:" or "Image prompt:". Just return the prompt text.`;

    const text = await callGeminiAPI(prompt, apiKey);
    return text.trim();
};

export const generateCharacters = async (story, keywords = [], apiKey) => {
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

    const text = await callGeminiAPI(prompt, apiKey, "gemini-2.5-pro");
    try {
        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleaned);
    } catch (e) {
        console.error("Character parsing failed", e);
        return [
            { name: "John Doe", role: "Protagonist", description: "A gritty cyberpunk detective in a trench coat. Character sheet style, T-pose, front, side, and back views. High detail." }
        ]; // fallback
    }
};

export const extractStoryFromFile = async (base64Data, mimeType, apiKey) => {
    const parts = [
        {
            inlineData: {
                mimeType,
                data: base64Data
            }
        },
        {
            text: "Extract and completely transcribe the core narrative, script, or story from this attached file/image. Return ONLY the story text, do NOT include markdown formatting or conversational filler. If it's a script, maintain the dialogue and action lines."
        }
    ];
    // Use gemini-2.5-pro for better multimodal OCR and extraction
    const text = await callGeminiAPI(parts, apiKey, "gemini-2.5-pro");
    return text.trim();
};
