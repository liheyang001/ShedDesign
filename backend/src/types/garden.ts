export interface GardenAnalysis {
  estimatedSize: {
    width: number
    height: number
  }
  orientation: string
  sunlight: {
    morning: 'full-sun' | 'partial-sun' | 'partial-shade' | 'shade'
    afternoon: 'full-sun' | 'partial-sun' | 'partial-shade' | 'shade'
    evening: 'full-sun' | 'partial-sun' | 'partial-shade' | 'shade'
  }
  existingStructures: string[]
  availableSpaces: Array<{
    x: number
    y: number
    width: number
    height: number
    score: number
  }>
  terrain: 'flat' | 'sloped' | 'irregular'
  drainage: 'good' | 'moderate' | 'poor'
}

export interface UploadResponse {
  imageId: string
  analysis: GardenAnalysis
}

export interface UserPreferences {
  shedPurpose: 'storage' | 'workshop' | 'leisure' | 'other'
  preferredSize: 'small' | 'medium' | 'large'
  stylePreference: 'modern' | 'traditional' | 'industrial' | 'cottage'
  rainProtection: 'basic' | 'moderate' | 'professional'
  sunlightPreference: 'full-sun' | 'partial' | 'shade'
  budget?: number
  specialRequirements?: string
}

export interface DesignRecommendation {
  primaryRecommendation: {
    position: { x: number; y: number }
    orientation: number
    size: { width: number; depth: number; height: number }
    rationale: string
  }
  alternativeOptions: Array<{
    position: { x: number; y: number }
    pros: string[]
    cons: string[]
  }>
  constructionTips: string[]
}
