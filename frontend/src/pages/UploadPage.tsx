import { useState } from 'react'
import { ImageUpload } from '../components/ImageUpload'
import type { GardenAnalysis } from '../types/garden'
import '../styles/UploadPage.css'

interface UploadPageProps {
  onAnalysisComplete: (imageId: string, analysis: GardenAnalysis) => void
}

export function UploadPage({ onAnalysisComplete }: UploadPageProps) {
  const [analysisData, setAnalysisData] = useState<GardenAnalysis | null>(null)
  const [uploadedImageId, setUploadedImageId] = useState<string | null>(null)

  function handleUploadSuccess(imageId: string, analysis: GardenAnalysis) {
    setUploadedImageId(imageId)
    setAnalysisData(analysis)
  }

  return (
    <div className="upload-page">
      <div className="upload-content">
        <h2>第一步：上传你的花园图纸或照片</h2>
        <p className="subtitle">
          上传一张清晰的花园俯视图或照片，AI 将自动分析花园布局
        </p>

        <ImageUpload onUploadSuccess={handleUploadSuccess} />

        {analysisData && (
          <div className="analysis-preview">
            <h3>✅ 分析完成</h3>
            <div className="analysis-grid">
              <div className="analysis-item">
                <label>花园尺寸</label>
                <p>{analysisData.estimatedSize.width} m × {analysisData.estimatedSize.height} m</p>
              </div>
              <div className="analysis-item">
                <label>地面朝向</label>
                <p>{analysisData.orientation}</p>
              </div>
              <div className="analysis-item">
                <label>地形</label>
                <p>{analysisData.terrain}</p>
              </div>
              <div className="analysis-item">
                <label>排水情况</label>
                <p>{analysisData.drainage}</p>
              </div>
            </div>

            <div className="sunlight-info">
              <h4>光照分布</h4>
              <div className="sunlight-grid">
                <div><strong>早上</strong><span>{analysisData.sunlight.morning}</span></div>
                <div><strong>下午</strong><span>{analysisData.sunlight.afternoon}</span></div>
                <div><strong>傍晚</strong><span>{analysisData.sunlight.evening}</span></div>
              </div>
            </div>

            <div className="structures-info">
              <h4>现有结构</h4>
              <p>{analysisData.existingStructures.join('、') || '未识别到明显结构'}</p>
            </div>

            <button
              className="next-btn"
              onClick={() => onAnalysisComplete(uploadedImageId!, analysisData)}
            >
              继续 →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
