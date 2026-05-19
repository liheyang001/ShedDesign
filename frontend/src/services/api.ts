import axios from 'axios'
import type { GardenAnalysis } from '../types/garden'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 60000,
})

export async function uploadGardenImage(file: File): Promise<{
  imageId: string
  filename: string
  analysis: GardenAnalysis
}> {
  const formData = new FormData()
  formData.append('image', file)

  // No Content-Type header — browser sets it automatically with the correct multipart boundary
  const response = await api.post('/upload', formData)

  return response.data
}

export function getImageUrl(imageId: string): string {
  return `${API_URL}/api/image/${imageId}`
}
