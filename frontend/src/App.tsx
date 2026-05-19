import { useState } from 'react'
import { UploadPage } from './pages/UploadPage'
import type { GardenAnalysis } from './types/garden'
import './App.css'

type AppStep = 'upload' | 'questionnaire' | 'result'

interface AppState {
  step: AppStep
  imageId: string | null
  analysis: GardenAnalysis | null
}

export default function App() {
  const [state, setState] = useState<AppState>({
    step: 'upload',
    imageId: null,
    analysis: null,
  })

  function handleAnalysisComplete(imageId: string, analysis: GardenAnalysis) {
    setState({ step: 'questionnaire', imageId, analysis })
  }

  return (
    <div className="app">
      <header>
        <h1>ShedDesign</h1>
        <p>AI 智能花园棚屋设计助手</p>
        <div className="steps">
          <span className={state.step === 'upload' ? 'active' : state.imageId ? 'done' : ''}>
            1 上传
          </span>
          <span className="divider">›</span>
          <span className={state.step === 'questionnaire' ? 'active' : state.step === 'result' ? 'done' : ''}>
            2 回答
          </span>
          <span className="divider">›</span>
          <span className={state.step === 'result' ? 'active' : ''}>
            3 设计
          </span>
        </div>
      </header>

      <main>
        {state.step === 'upload' && (
          <UploadPage onAnalysisComplete={handleAnalysisComplete} />
        )}
        {state.step === 'questionnaire' && (
          <div className="coming-soon">
            <h2>问卷即将上线</h2>
            <p>花园分析完成！问卷功能正在开发中...</p>
          </div>
        )}
      </main>
    </div>
  )
}
