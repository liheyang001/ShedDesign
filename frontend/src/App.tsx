import { useState } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { UploadPage } from './pages/UploadPage'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'
import { QuestionnairePage } from './pages/QuestionnairePage'
import { ResultPage } from './pages/ResultPage'
import type { GardenAnalysis, UserPreferences } from './types/garden'
import './App.css'

type AppStep = 'login' | 'signup' | 'upload' | 'questionnaire' | 'result'

interface AppState {
  step: AppStep
  imageId: string | null
  analysis: GardenAnalysis | null
  questionnaireId: string | null
  preferences: UserPreferences | null
}

function AppInner() {
  const { user, isLoading, logout } = useAuth()
  const [state, setState] = useState<AppState>({ step: 'login', imageId: null, analysis: null, questionnaireId: null, preferences: null })

  if (isLoading) {
    return <div className="loading">加载中...</div>
  }

  // Derive effective step: guard app pages behind auth, redirect auth pages when logged in
  const effectiveStep: AppStep = (() => {
    const onAuthPage = state.step === 'login' || state.step === 'signup'
    if (user) return onAuthPage ? 'upload' : state.step
    return onAuthPage ? state.step : 'login'
  })()

  const isAppStep = effectiveStep !== 'login' && effectiveStep !== 'signup'

  function handleAnalysisComplete(imageId: string, analysis: GardenAnalysis) {
    setState((s) => ({ ...s, step: 'questionnaire', imageId, analysis }))
  }

  function handleQuestionnaireComplete(questionnaireId: string, preferences: UserPreferences) {
    setState((s) => ({ ...s, step: 'result', questionnaireId, preferences }))
  }

  function handleAuthSuccess() {
    setState((s) => ({ ...s, step: 'upload' }))
  }

  function handleLogout() {
    logout()
    setState({ step: 'login', imageId: null, analysis: null, questionnaireId: null, preferences: null })
  }

  return (
    <div className="app">
      <header>
        <div className="header-top">
          <div className="header-brand">
            <h1>ShedDesign</h1>
            <p>AI 智能花园棚屋设计助手</p>
          </div>
          {user && (
            <div className="user-info">
              <span className="user-email">{user.email}</span>
              <button onClick={handleLogout} className="logout-btn">退出</button>
            </div>
          )}
        </div>

        {isAppStep && (
          <div className="steps">
            <span className={effectiveStep === 'upload' ? 'active' : state.imageId ? 'done' : ''}>
              1 上传
            </span>
            <span className="divider">›</span>
            <span className={effectiveStep === 'questionnaire' ? 'active' : effectiveStep === 'result' ? 'done' : ''}>
              2 回答
            </span>
            <span className="divider">›</span>
            <span className={effectiveStep === 'result' ? 'active' : ''}>3 设计</span>
          </div>
        )}
      </header>

      <main>
        {effectiveStep === 'login' && (
          <LoginPage
            onSuccess={handleAuthSuccess}
            onGoSignup={() => setState((s) => ({ ...s, step: 'signup' }))}
          />
        )}
        {effectiveStep === 'signup' && (
          <SignupPage
            onSuccess={handleAuthSuccess}
            onGoLogin={() => setState((s) => ({ ...s, step: 'login' }))}
          />
        )}
        {effectiveStep === 'upload' && (
          <UploadPage onAnalysisComplete={handleAnalysisComplete} />
        )}
        {effectiveStep === 'questionnaire' && state.imageId && (
          <QuestionnairePage
            imageId={state.imageId}
            onComplete={handleQuestionnaireComplete}
          />
        )}
        {effectiveStep === 'result' && state.analysis && state.preferences && (
          <ResultPage analysis={state.analysis} preferences={state.preferences} />
        )}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}
