import { GoogleGenAI, GenerateContentResponse, Part, Type } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export async function analyzeStoryboard(
    imageBase64: string | null,
    mimeType: string | null,
    pastedText: string
): Promise<string[]> {
    const systemPrompt = `You are an expert prompt engineer for the text-to-video AI model Google VEO. Your task is to analyze the provided storyboard and generate a series of prompts, one for each distinct scene.

The user will provide storyboard information, which may include scene numbers, composition details, dialogue, and actions, either as text or within an image.

**Instructions:**
1.  **Identify Scenes:** Carefully parse the input to identify distinct scenes. Scenes may be explicitly numbered (e.g., "씬 1", "Scene 2") or implied by changes in location, characters, or action.
2.  **Generate One Prompt Per Scene:** For each scene you identify, create a single, cohesive, and highly descriptive VEO prompt in English.
3.  **Describe Content:** Each prompt should detail the visuals (characters, setting, objects), camera composition (shot type, angle), character actions, and overall mood or tone.
4.  **Cinematic Language:** Use professional, cinematic language suitable for a high-quality video generation model.
5.  **Output Format:** Your final output **must** be a valid JSON array of strings. Each string in the array corresponds to the prompt for one scene, in chronological order. Do not include any other text, explanations, or markdown formatting.

Example Output:
["A medium shot of a middle-aged Asian man in a doctor's white coat, sitting at a modern desk in a consultation room, explaining with subtle hand gestures, looking directly at the camera with a reassuring expression. The lighting is bright and clean, creating a professional and trustworthy atmosphere.", "A close-up shot on a computer screen displaying a dental implant diagram, with the doctor's hand pointing to a specific detail."]`;

    const parts: Part[] = [];

    if (imageBase64 && mimeType) {
        parts.push({
            inlineData: {
                mimeType: mimeType,
                data: imageBase64,
            },
        });
    }

    if (pastedText) {
        parts.push({ text: `Here is the pasted text from the storyboard:\n\n${pastedText}` });
    } else if (imageBase64) {
        parts.push({ text: "Analyze the storyboard in this image and create a prompt for each scene based on it." });
    }


    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
             model: 'gemini-2.5-flash',
             contents: { parts: parts },
             config: {
                systemInstruction: systemPrompt,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.STRING,
                        description: 'A detailed VEO prompt for a single scene from the storyboard.'
                    }
                }
             }
        });
        
        const jsonStr = response.text.trim();
        try {
            const prompts = JSON.parse(jsonStr);
            if (Array.isArray(prompts) && prompts.every(p => typeof p === 'string')) {
                return prompts;
            } else {
                 console.warn("Gemini did not return a valid JSON array of strings. Returning the raw text split by newlines.");
                 return jsonStr.split('\n').filter(line => line.trim() !== '');
            }
        } catch (parseError) {
            console.error("Failed to parse Gemini JSON response:", parseError);
            console.log("Raw response:", jsonStr);
            return [jsonStr]; // Fallback to a single prompt
        }

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to generate prompt from Gemini API.");
    }
}