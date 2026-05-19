import { GoogleGenerativeAI } from '@google/generative-ai'
import fs from 'fs'
import config from '../config/env.js'
import type { GardenAnalysis } from '../types/garden.js'

const ANALYSIS_PROMPT = `请分析这张花园图片，并以 JSON 格式提供以下信息：
1. 估计的花园尺寸（宽 x 高，单位米）
2. 地面朝向（N/S/E/W/NE/SE/SW/NW）
3. 全天光照条件（早上、下午、傍晚分别为：full-sun/partial-sun/partial-shade/shade）
4. 现有结构（房屋、树木、栅栏等）
5. 可用空间（至少3个潜在位置，带x/y坐标和0-1的评分）
6. 地形（flat/sloped/irregular）
7. 排水状况（good/moderate/poor）

只返回有效的 JSON，不要添加其他文字说明。格式如下：
{
  "estimatedSize": {"width": 15, "height": 20},
  "orientation": "NE",
  "sunlight": {"morning": "full-sun", "afternoon": "partial-shade", "evening": "shade"},
  "existingStructures": ["house", "large-tree", "fence"],
  "availableSpaces": [
    {"x": 3, "y": 5, "width": 4, "height": 4, "score": 0.85},
    {"x": 8, "y": 2, "width": 3, "height": 3, "score": 0.7},
    {"x": 1, "y": 10, "width": 5, "height": 5, "score": 0.6}
  ],
  "terrain": "flat",
  "drainage": "good"
}`

function fallbackAnalysis(): GardenAnalysis {
  return {
    estimatedSize: { width: 15, height: 20 },
    orientation: 'N',
    sunlight: { morning: 'full-sun', afternoon: 'partial-sun', evening: 'partial-shade' },
    existingStructures: ['house', 'fence'],
    availableSpaces: [
      { x: 3, y: 5, width: 4, height: 4, score: 0.8 },
      { x: 8, y: 8, width: 3, height: 3, score: 0.65 },
      { x: 1, y: 12, width: 5, height: 4, score: 0.55 },
    ],
    terrain: 'flat',
    drainage: 'good',
  }
}

export async function analyzeGardenImage(imagePath: string): Promise<GardenAnalysis> {
  if (!config.geminiApiKey) {
    console.warn('GEMINI_API_KEY 未设置，返回模拟分析数据')
    return fallbackAnalysis()
  }

  const genAI = new GoogleGenerativeAI(config.geminiApiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const imageData = fs.readFileSync(imagePath)
  const base64Data = imageData.toString('base64')

  const ext = imagePath.split('.').pop()?.toLowerCase() ?? 'jpeg'
  const mimeTypeMap: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
  }
  const mimeType = mimeTypeMap[ext] ?? 'image/jpeg'

  const response = await model.generateContent([
    { inlineData: { data: base64Data, mimeType } },
    ANALYSIS_PROMPT,
  ])

  const responseText = response.response.text()
  const jsonMatch = responseText.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('无法从 Gemini 响应中提取 JSON')
  }

  return JSON.parse(jsonMatch[0]) as GardenAnalysis
}
