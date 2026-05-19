import { useState, useRef } from 'react'
import { uploadGardenImage } from '../services/api'
import type { GardenAnalysis } from '../types/garden'
import '../styles/ImageUpload.css'

interface ImageUploadProps {
  onUploadSuccess: (imageId: string, analysis: GardenAnalysis) => void
}

export function ImageUpload({ onUploadSuccess }: ImageUploadProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const fileRef = useRef<File | null>(null)

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    fileRef.current = file
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)
    setError(null)
  }

  async function handleUpload(event: React.FormEvent) {
    event.preventDefault()
    if (!fileRef.current) {
      setError('请选择一张图片')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await uploadGardenImage(fileRef.current)
      onUploadSuccess(result.imageId, result.analysis)
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } }
      setError(axiosError.response?.data?.error || '上传失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  function handleReselect() {
    setPreview(null)
    fileRef.current = null
  }

  return (
    <div className="upload-container">
      <form onSubmit={handleUpload}>
        <div className="upload-area">
          {preview ? (
            <div className="preview-section">
              <img src={preview} alt="预览" className="preview-image" />
              <div>
                <button type="submit" disabled={isLoading} className="submit-btn">
                  {isLoading ? '分析中...' : '上传并分析'}
                </button>
                <button type="button" className="reselect-btn" onClick={handleReselect}>
                  重新选择
                </button>
              </div>
            </div>
          ) : (
            <label htmlFor="imageInput" className="upload-label">
              <div className="upload-icon">📸</div>
              <p>点击或拖拽上传花园图纸或照片</p>
              <small>支持 JPG、PNG 格式，最大 5MB</small>
              <input
                id="imageInput"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden-input"
              />
            </label>
          )}
        </div>
        {error && <div className="error-message">{error}</div>}
      </form>
    </div>
  )
}
