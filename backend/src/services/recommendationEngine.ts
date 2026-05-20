import Anthropic from '@anthropic-ai/sdk'
import config from '../config/env.js'
import type { GardenAnalysis, UserPreferences, DesignRecommendation } from '../types/garden.js'

const client = new Anthropic({ apiKey: config.anthropicApiKey ?? 'no-key' })

function buildPrompt(analysis: GardenAnalysis, prefs: UserPreferences): string {
  const sizeMap = { small: '2×2m', medium: '3×4m', large: '4×6m' }
  const spaces = analysis.availableSpaces
    .slice()
    .sort((a, b) => b.score - a.score)
    .map((s, i) => `  Space ${i + 1}: x=${s.x}m, y=${s.y}m, ${s.width}×${s.height}m (score ${s.score.toFixed(2)})`)
    .join('\n')

  return `You are an expert garden shed placement advisor. Based on the analysis below, recommend the best shed placement.

GARDEN ANALYSIS:
- Size: ${analysis.estimatedSize.width}m wide × ${analysis.estimatedSize.height}m deep
- Orientation: faces ${analysis.orientation}
- Sunlight — morning: ${analysis.sunlight.morning}, afternoon: ${analysis.sunlight.afternoon}, evening: ${analysis.sunlight.evening}
- Terrain: ${analysis.terrain}, Drainage: ${analysis.drainage}
- Existing structures: ${analysis.existingStructures.join(', ') || 'none'}
- Available spaces (sorted by suitability score):
${spaces}

USER PREFERENCES:
- Purpose: ${prefs.shedPurpose}
- Desired size: ${prefs.preferredSize} (~${sizeMap[prefs.preferredSize]})
- Style: ${prefs.stylePreference}
- Rain protection level: ${prefs.rainProtection}
- Sunlight preference: ${prefs.sunlightPreference}${prefs.budget ? `\n- Budget: $${prefs.budget}` : ''}${prefs.specialRequirements ? `\n- Special requirements: ${prefs.specialRequirements}` : ''}

Return ONLY a valid JSON object — no markdown, no code fences, no explanation.

Required format:
{
  "primaryRecommendation": {
    "position": { "x": <number, meters from left>, "y": <number, meters from top> },
    "orientation": <number, degrees 0-359, 0=north-facing>,
    "size": { "width": <number, meters>, "depth": <number, meters>, "height": <number, meters> },
    "rationale": "<2-3 sentence explanation of why this placement is best>"
  },
  "alternativeOptions": [
    {
      "position": { "x": <number>, "y": <number> },
      "pros": ["<string>", "<string>"],
      "cons": ["<string>", "<string>"]
    }
  ],
  "constructionTips": ["<string>", "<string>", "<string>"]
}

Rules:
- primaryRecommendation.position must be within one of the listed available spaces
- alternativeOptions must have exactly 2 entries using the other top available spaces
- constructionTips must have 3-5 practical tips specific to this garden's terrain, drainage, and the user's purpose
- All measurements must be numbers (not strings)`
}

function isValidRecommendation(data: unknown): data is DesignRecommendation {
  if (!data || typeof data !== 'object') return false
  const d = data as Record<string, unknown>

  const pr = d.primaryRecommendation as Record<string, unknown> | undefined
  if (!pr) return false
  if (!pr.position || typeof (pr.position as Record<string, unknown>).x !== 'number') return false
  if (typeof pr.orientation !== 'number') return false
  if (!pr.size || typeof (pr.size as Record<string, unknown>).width !== 'number') return false
  if (typeof pr.rationale !== 'string') return false

  if (!Array.isArray(d.alternativeOptions) || d.alternativeOptions.length === 0) return false
  if (!Array.isArray(d.constructionTips) || d.constructionTips.length === 0) return false

  return true
}

function fallbackRecommendation(analysis: GardenAnalysis, prefs: UserPreferences): DesignRecommendation {
  const sizeValues = { small: { width: 2, depth: 2, height: 2.4 }, medium: { width: 3, depth: 4, height: 2.6 }, large: { width: 4, depth: 6, height: 3 } }
  const best = analysis.availableSpaces.slice().sort((a, b) => b.score - a.score)
  const primary = best[0] ?? { x: 2, y: 2 }
  const alt1 = best[1] ?? { x: 5, y: 5 }
  const alt2 = best[2] ?? { x: 8, y: 8 }

  return {
    primaryRecommendation: {
      position: { x: primary.x, y: primary.y },
      orientation: 0,
      size: sizeValues[prefs.preferredSize],
      rationale: `This location has the highest suitability score in your garden. It accounts for your ${prefs.shedPurpose} requirements and the garden's ${analysis.terrain} terrain with ${analysis.drainage} drainage.`,
    },
    alternativeOptions: [
      {
        position: { x: alt1.x, y: alt1.y },
        pros: ['Good access from main path', 'Adequate sunlight'],
        cons: ['Slightly less optimal drainage', 'Further from utilities'],
      },
      {
        position: { x: alt2.x, y: alt2.y },
        pros: ['More private location', 'Preserves garden view'],
        cons: ['Limited natural light', 'Harder construction access'],
      },
    ],
    constructionTips: [
      `Prepare a level concrete or paving slab base to suit the ${analysis.terrain} terrain.`,
      analysis.drainage === 'poor' ? 'Install French drains around the perimeter to address poor drainage.' : 'Ensure a small gravel border around the base for water runoff.',
      `Orient windows to capture ${prefs.sunlightPreference} exposure as preferred.`,
      prefs.rainProtection === 'professional' ? 'Use galvanised flashing on all roof joints for professional rain protection.' : 'Ensure a minimum 15° roof pitch for effective rain runoff.',
    ],
  }
}

export async function generateRecommendation(
  analysis: GardenAnalysis,
  preferences: UserPreferences,
): Promise<DesignRecommendation> {
  if (!config.anthropicApiKey) {
    console.warn('ANTHROPIC_API_KEY not set — returning mock recommendation')
    return fallbackRecommendation(analysis, preferences)
  }

  let responseText: string
  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 1024,
      messages: [{ role: 'user', content: buildPrompt(analysis, preferences) }],
    })

    const block = message.content[0]
    if (block.type !== 'text') {
      console.error('Unexpected Claude response block type:', block.type)
      return fallbackRecommendation(analysis, preferences)
    }
    responseText = block.text.trim()
  } catch (err) {
    console.error('Claude API call failed:', err)
    return fallbackRecommendation(analysis, preferences)
  }

  const stripped = responseText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  const jsonMatch = stripped.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    console.error('Claude response did not contain JSON:', responseText.slice(0, 200))
    return fallbackRecommendation(analysis, preferences)
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonMatch[0])
  } catch {
    console.error('Failed to parse Claude JSON response')
    return fallbackRecommendation(analysis, preferences)
  }

  if (!isValidRecommendation(parsed)) {
    console.error('Claude response failed schema validation:', JSON.stringify(parsed).slice(0, 200))
    return fallbackRecommendation(analysis, preferences)
  }

  return parsed
}
