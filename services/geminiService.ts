
import { GoogleGenAI, Type } from "@google/genai";

/**
 * Generates a breakdown of tasks or insights for a specific quest.
 * Uses Google Search for the "Notice Your Life" quest to find helpful products and advice.
 */
export const generateSmartTaskBreakdown = async (taskTitle: string, userInputTasks?: string[], selectedSkill?: string) => {
  // Create a new instance right before making an API call to ensure it always uses the most up-to-date API key.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const isInitialQuest = taskTitle === "Find Your Starting Point";
  const isMapCurvatureQuest = taskTitle === "Map the Psyche Curvature";
  const isUpgradeQuest = taskTitle === "Never Miss Twice";
  const isNoticeLife = taskTitle === "Notice Your Life";
  const isSkillQuest = taskTitle === "Find Your Skill";

  // Specialized logic for Notice Your Life with Google Search
  if (isNoticeLife && userInputTasks && userInputTasks.length > 0) {
    const tasksStr = userInputTasks.filter(t => t.trim() !== '').join(', ');
    const prompt = `I have the following user tasks: ${tasksStr}. 
    Use Google Search to locate:
    1. A direct Google Product page or specialized retail product page for EACH task.
    2. A relevant YouTube guide or educational video providing advice for EACH task.
    
    CRITICAL: Provide the response as a simple list. One line per task.
    Format each line exactly like this: [Task]: [Specific Product Name] - [Benefit].
    
    After the list, add exactly:
    PRO-TIP: [One general efficiency tip]
    WARNING: [One entropy warning]
    
    DO NOT use Markdown symbols (no #, *, or -).
    DO NOT include URLs in the text itself.
    The grounding results MUST contain the product links and the YouTube video links for these recommendations.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    return {
      isSearchResponse: true,
      text: response.text,
      groundingLinks: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
        title: chunk.web?.title || 'Resource',
        uri: chunk.web?.uri
      })).filter((link: any) => link.uri) || []
    };
  }

  // Standard logic for other quests
  let stepsRequirement = '5 simple steps to help them reach this goal.';
  let contextInstruction = '';
  let specificProTip = '';

  if (isInitialQuest) {
    stepsRequirement = `Exactly 2 foundational steps. 
    The first step MUST BE: "Feel the weight of your current task without trying to finish it quickly.". 
    The second step MUST BE: "Check the task honestly see where you are right now, rather than where you wish you were."`;
    contextInstruction = 'This is the very first step of their journey. Focus on pure observation and honesty without judgment.';
    specificProTip = 'The "proTip" MUST BE EXACTLY: "Apply more awareness than action right now, trying to push old habits without seeing clearly only creates frustration instead of forward movement."';
  } else if (isMapCurvatureQuest) {
    stepsRequirement = `Exactly 5 steps based on Behaviordynamics. 
    Step 1: Identify the symptom-mass (S) that exerts the strongest gravitational pull on your thoughts.
    Step 2: Observe your behavior (F→B) as a force orbiting this wound rather than moving in a straight line.
    Step 3: Point out the 'Lack of Light' (Resistance)—the areas where you struggle to look or communicate.
    Step 4: Notice 'Time Dilation'—when the past feels as real and immediate as the now.
    Step 5: Use the 'Observer Effect'—measure these forces without judgment to collapse the wave of chaotic habit.`;
    contextInstruction = 'Explain that behaviors are not irrational; they are the natural result of moving through a curved psyche spacetime. Focus on mapping the "gravity" of trauma and habits.';
  } else if (isUpgradeQuest) {
    stepsRequirement = '5 advanced steps focusing on the "Never Miss Twice" rule, building resilience against failure, and maintaining momentum after the initial discovery phase.';
    contextInstruction = 'The user has already found their starting point. Now they are in the "Mastery" phase where the goal is consistency and recovery from slips.';
  } else if (isSkillQuest) {
    const skillName = selectedSkill || 'a creative skill';
    stepsRequirement = `Exactly 5 steps to master '${skillName}' as a 'Sublimation Outlet'. 
    Step 1: Identify your Libidinal Orientation—how does '${skillName}' fit your current internal state (Introvert/External)?
    Step 2: Pinpoint 'Heat' (S)—the specific tension you are channeling into '${skillName}'.
    Step 3: Define the 'Circuit'—how exactly does '${skillName}' act as a safety valve for your psyche?
    Step 4: Execute 'Phase Transition'—practical application of '${skillName}' to convert energy into value.
    Step 5: Measure Equilibrium—verify the entropy reduction after practicing '${skillName}'.`;
    contextInstruction = `Focus on the specific skill chosen by the user: "${skillName}". Explain how this particular choice acts as a synaptic path to harness internal forces.`;
    specificProTip = `The "proTip" should explain how "${skillName}" helps manage "Time of Thought (t)" and prevent memory explosion (M = St^2).`;
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `You are a supportive Life Guide using a framework called "Behaviordynamics" (Life Physics). 
    Explain this goal to a normal person: "${taskTitle}". 
    ${contextInstruction}
    ${specificProTip}

    Use these core Behaviordynamic concepts:
    - Mass (S) = Symptoms/Trauma that warp the mind's geometry.
    - Behavior (B) = Force vectors influenced by curvature.
    - Light (L) = Insight and aware communication. Lack of light creates resistance (R).
    - Heat = Intense emotional entropy/arousal.
    - Gravity = The pull of old wounds that makes change feel impossible.
    - Sublimation = Conversion of libidinal tension into creative work.
    
    Return a JSON object with:
    1. "steps": ${stepsRequirement}
    2. "proTip": A helpful tip about achieving escape velocity or reducing entropy.
    3. "securityWarning": A warning about the "Entropy Trap"—where chaos increases if one pushes without light.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          steps: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          proTip: { type: Type.STRING, description: "Physics-based balance advice" },
          securityWarning: { type: Type.STRING, description: "Entropy/Darkness trap warning" }
        },
        required: ["steps", "proTip", "securityWarning"]
      }
    }
  });

  return JSON.parse(response.text?.trim() || '{}');
};

/**
 * Generates architectural advice based on the current phase of the user's journey.
 */
export const getArchitectureAdvice = async (phase: string) => {
  // Create a new instance right before making an API call to ensure it always uses the most up-to-date API key.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `You are a world-class life architect using the "Behaviordynamics" framework. 
    Provide strategic guidance for someone in the "${phase}" phase. Return a structured Markdown response.`,
  });

  return response.text || "Could not generate strategic advice at this time.";
};
