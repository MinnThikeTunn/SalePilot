import type { SalesOpportunity } from "../../types";

interface GeminiOpportunityExplanation {
  opportunity_id: string;
  why_it_matters: string;
  action_rationale: string;
  expected_outcome?: string;
  limitations?: string;
}

/**
 * Generates verified English explanations using Gemini or safe template fallback.
 * Adheres strictly to Section FR-06 and FR-10 of docs/AI_Strategy_Feature.md.
 */
export async function enrichOpportunitiesWithAi(
  opportunities: SalesOpportunity[],
  geminiApiKey?: string
): Promise<SalesOpportunity[]> {
  if (opportunities.length === 0) return [];

  // If no Gemini API key is provided, use guaranteed deterministic template explanations
  if (!geminiApiKey) {
    return opportunities;
  }

  try {
    const payload = opportunities.map((opp) => ({
      opportunity_id: opp.id,
      type: opp.opportunity_type,
      title: opp.title,
      problem: opp.problem_description,
      priority_score: opp.priority_score,
      evidence_metrics: opp.evidence_snapshot.metrics,
      recommended_action: opp.recommended_action.title,
    }));

    const systemPrompt = `You are SalePilot AI Strategy Analyst.
Explain verified small-business opportunities in clear, concise, actionable English for a non-technical shop owner.
Rules:
1. Use ONLY the verified numbers provided in the payload. NEVER invent sales figures, percentages, or metrics.
2. Distinguish observed facts from estimates.
3. Keep each explanation between 2 and 4 sentences.
4. Output strictly valid JSON array matching the schema:
[
  {
    "opportunity_id": "id string",
    "why_it_matters": "clear business explanation of why this issue matters to cash flow or customers",
    "action_rationale": "why this specific action is the best next step",
    "expected_outcome": "expected business result based solely on the verified baseline",
    "limitations": "relevant data limitations or caveats"
  }
]`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Explain these opportunities:\n${JSON.stringify(payload)}` }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!response.ok) {
      console.warn("Gemini explanation request failed, using template fallback.");
      return opportunities;
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return opportunities;

    const parsed: GeminiOpportunityExplanation[] = JSON.parse(rawText);
    if (!Array.isArray(parsed)) return opportunities;

    const explanationMap = new Map<string, GeminiOpportunityExplanation>();
    parsed.forEach((item) => {
      if (item && item.opportunity_id) {
        explanationMap.set(item.opportunity_id, item);
      }
    });

    return opportunities.map((opp) => {
      const aiExp = explanationMap.get(opp.id);
      if (aiExp && aiExp.why_it_matters && aiExp.action_rationale) {
        return {
          ...opp,
          ai_explanation: {
            why_it_matters: aiExp.why_it_matters.trim(),
            action_rationale: aiExp.action_rationale.trim(),
            expected_outcome: aiExp.expected_outcome?.trim() || opp.ai_explanation.expected_outcome,
            limitations: aiExp.limitations?.trim() || opp.ai_explanation.limitations,
            generated_by: "gemini",
          },
        };
      }
      return opp;
    });
  } catch (error) {
    console.warn("Error running Gemini explanation service, safely defaulting to template:", error);
    return opportunities;
  }
}
