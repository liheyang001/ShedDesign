import { useState, useEffect, useCallback } from 'react'
import type { GardenAnalysis, UserPreferences, DesignRecommendation } from '../types/garden'
import { generateRecommendation } from '../services/api'
import { GardenScene } from '../components/GardenScene'
import '../styles/Result.css'

interface Props {
  analysis: GardenAnalysis
  preferences: UserPreferences
}

type State =
  | { status: 'loading' }
  | { status: 'success'; data: DesignRecommendation }
  | { status: 'error'; message: string }

export function ResultPage({ analysis, preferences }: Props) {
  const [state, setState] = useState<State>({ status: 'loading' })

  const fetchRecommendation = useCallback(async () => {
    setState({ status: 'loading' })
    try {
      const data = await generateRecommendation(analysis, preferences)
      setState({ status: 'success', data })
    } catch {
      setState({ status: 'error', message: '生成推荐方案失败，请稍后重试' })
    }
  }, [analysis, preferences])

  useEffect(() => {
    void fetchRecommendation()
  }, [fetchRecommendation])

  return (
    <div className="result-page">
      <div className="result-card">
        {state.status === 'loading' && (
          <div className="result-loading" aria-label="加载中">
            <div className="result-spinner" />
            <p>AI 正在生成您的专属设计方案…</p>
          </div>
        )}

        {state.status === 'error' && (
          <div className="result-error">
            <p role="alert">{state.message}</p>
            <button className="result-retry-btn" onClick={fetchRecommendation}>
              重试
            </button>
          </div>
        )}

        {state.status === 'success' && <RecommendationView data={state.data} analysis={analysis} />}
      </div>
    </div>
  )
}

function RecommendationView({ data, analysis }: { data: DesignRecommendation; analysis: GardenAnalysis }) {
  const { primaryRecommendation, alternativeOptions, constructionTips } = data
  const { position, orientation, size, rationale } = primaryRecommendation

  return (
    <>
      <GardenScene analysis={analysis} recommendation={data} />

      {/* Primary recommendation */}
      <div className="result-section">
        <p className="result-section-title">推荐方案</p>
        <div className="result-primary-header">
          <h2>最优棚屋放置方案</h2>
          <p>根据您的花园分析与偏好，AI 推荐以下放置位置</p>
        </div>

        <div className="result-metrics">
          <div className="result-metric">
            <span className="result-metric-label">位置</span>
            <span className="result-metric-value">
              ({position.x}, {position.y})
            </span>
          </div>
          <div className="result-metric">
            <span className="result-metric-label">朝向角度</span>
            <span className="result-metric-value">{orientation}°</span>
          </div>
          <div className="result-metric">
            <span className="result-metric-label">宽度</span>
            <span className="result-metric-value">{size.width} m</span>
          </div>
          <div className="result-metric">
            <span className="result-metric-label">深度</span>
            <span className="result-metric-value">{size.depth} m</span>
          </div>
          <div className="result-metric">
            <span className="result-metric-label">高度</span>
            <span className="result-metric-value">{size.height} m</span>
          </div>
        </div>

        <div className="result-rationale">{rationale}</div>
      </div>

      {/* Alternative options */}
      {alternativeOptions.length > 0 && (
        <div className="result-section">
          <p className="result-section-title">备选方案</p>
          <div className="result-alternatives">
            {alternativeOptions.map((option, idx) => (
              <div key={idx} className="result-alt-card">
                <p className="result-alt-title">
                  备选 {idx + 1}
                  <span className="result-alt-position">
                    位置 ({option.position.x}, {option.position.y})
                  </span>
                </p>
                <div className="result-pros-cons">
                  <div className="result-pros">
                    <span className="result-pros-label">优点</span>
                    <ul>
                      {option.pros.map((pro, i) => (
                        <li key={i}>{pro}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="result-cons">
                    <span className="result-cons-label">缺点</span>
                    <ul>
                      {option.cons.map((con, i) => (
                        <li key={i}>{con}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Construction tips */}
      {constructionTips.length > 0 && (
        <div className="result-section">
          <p className="result-section-title">施工建议</p>
          <ul className="result-tips-list">
            {constructionTips.map((tip, idx) => (
              <li key={idx}>
                <span className="result-tip-index">{idx + 1}</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  )
}
