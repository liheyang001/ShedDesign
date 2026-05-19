export interface GardenAnalysis {
  estimatedSize: {
    width: number
    height: number
  }
  orientation: string
  sunlight: {
    morning: string
    afternoon: string
    evening: string
  }
  existingStructures: string[]
  availableSpaces: Array<{
    x: number
    y: number
    width: number
    height: number
    score: number
  }>
  terrain: string
  drainage: string
}

export interface UploadState {
  imageId: string | null
  analysis: GardenAnalysis | null
  isLoading: boolean
  error: string | null
}
