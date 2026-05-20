import { useState } from 'react'
import { useForm } from 'react-hook-form'
import type { UserPreferences } from '../types/garden'
import { submitQuestionnaire } from '../services/api'
import '../styles/Questionnaire.css'

interface Props {
  imageId: string
  onComplete: (questionnaireId: string, preferences: UserPreferences) => void
}

const STEPS = [
  { title: '用途与尺寸', subtitle: '告诉我们您的棚屋用途和理想大小' },
  { title: '风格与环境', subtitle: '选择外观风格和环境条件' },
  { title: '预算与备注', subtitle: '可选：填写预算范围和特殊需求' },
]

const STEP_FIELDS: Array<Array<keyof UserPreferences>> = [
  ['shedPurpose', 'preferredSize'],
  ['stylePreference', 'rainProtection', 'sunlightPreference'],
  [],
]

type ChoiceOption = {
  value: string
  icon: string
  name: string
  desc?: string
}

const PURPOSE_OPTIONS: ChoiceOption[] = [
  { value: 'storage', icon: '📦', name: '储物', desc: '工具、设备收纳' },
  { value: 'workshop', icon: '🔧', name: '工作室', desc: 'DIY、维修作业' },
  { value: 'leisure', icon: '☕', name: '休闲室', desc: '读书、放松空间' },
  { value: 'other', icon: '✨', name: '其他', desc: '自定义用途' },
]

const SIZE_OPTIONS: ChoiceOption[] = [
  { value: 'small', icon: '🏠', name: '小型', desc: '< 6 m²' },
  { value: 'medium', icon: '🏡', name: '中型', desc: '6–12 m²' },
  { value: 'large', icon: '🏘️', name: '大型', desc: '> 12 m²' },
]

const STYLE_OPTIONS: ChoiceOption[] = [
  { value: 'modern', icon: '◼', name: '现代简约', desc: '清晰线条、极简美学' },
  { value: 'traditional', icon: '🌿', name: '传统经典', desc: '木质纹理、经典造型' },
  { value: 'industrial', icon: '⚙️', name: '工业风格', desc: '金属、原始质感' },
  { value: 'cottage', icon: '🌸', name: '田园风格', desc: '温馨、自然气息' },
]

const RAIN_OPTIONS: ChoiceOption[] = [
  { value: 'basic', icon: '🌂', name: '基础', desc: '普通防雨' },
  { value: 'moderate', icon: '⛱️', name: '中等', desc: '加强排水' },
  { value: 'professional', icon: '🛡️', name: '专业', desc: '全天候防护' },
]

const SUNLIGHT_OPTIONS: ChoiceOption[] = [
  { value: 'full-sun', icon: '☀️', name: '全日照', desc: '最大采光' },
  { value: 'partial', icon: '🌤️', name: '半遮阴', desc: '部分遮挡' },
  { value: 'shade', icon: '🌑', name: '全遮阴', desc: '避免直射' },
]

function ChoiceGroup({
  options,
  value,
  name,
  onChange,
  cols3,
}: {
  options: ChoiceOption[]
  value: string
  name: string
  onChange: (v: string) => void
  cols3?: boolean
}) {
  return (
    <div className={`choice-grid${cols3 ? ' cols-3' : ''}`}>
      {options.map((opt) => (
        <label key={opt.value} className={`choice-card${value === opt.value ? ' selected' : ''}`}>
          <input
            type="radio"
            name={name}
            value={opt.value}
            className="choice-card-input"
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
          />
          <span className="choice-icon">{opt.icon}</span>
          <span className="choice-name">{opt.name}</span>
          {opt.desc && <span className="choice-desc">{opt.desc}</span>}
        </label>
      ))}
    </div>
  )
}

export function QuestionnairePage({ imageId, onComplete }: Props) {
  const [step, setStep] = useState(0)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const { register, watch, setValue, handleSubmit, trigger } = useForm<UserPreferences>({
    defaultValues: {
      shedPurpose: 'storage',
      preferredSize: 'medium',
      stylePreference: 'modern',
      rainProtection: 'moderate',
      sunlightPreference: 'partial',
    },
  })

  const values = watch()

  async function goNext() {
    const valid = await trigger(STEP_FIELDS[step] as (keyof UserPreferences)[])
    if (valid) setStep((s) => s + 1)
  }

  async function onSubmit(data: UserPreferences) {
    try {
      setSubmitError(null)
      if (data.budget !== undefined && String(data.budget) === '') {
        delete data.budget
      }
      const result = await submitQuestionnaire(imageId, data)
      onComplete(result.questionnaireId, result.preferences)
    } catch {
      setSubmitError('提交失败，请稍后重试')
    }
  }

  return (
    <div className="questionnaire-page">
      <div className="questionnaire-card">
        {/* Progress */}
        <div className="q-progress">
          {STEPS.map((s, i) => (
            <>
              <div key={s.title} className={`q-progress-step${i === step ? ' active' : i < step ? ' done' : ''}`}>
                <div className="q-progress-dot">{i < step ? '✓' : i + 1}</div>
                <span className="q-progress-label">{s.title}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div key={`line-${i}`} className={`q-progress-line${i < step ? ' done' : ''}`} />
              )}
            </>
          ))}
        </div>

        <div className="q-step-header">
          <h2>{STEPS[step].title}</h2>
          <p>{STEPS[step].subtitle}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Step 1 */}
          {step === 0 && (
            <>
              <div className="q-section">
                <span className="q-section-label">棚屋主要用途</span>
                <ChoiceGroup
                  options={PURPOSE_OPTIONS}
                  value={values.shedPurpose}
                  name="shedPurpose"
                  onChange={(v) => setValue('shedPurpose', v as UserPreferences['shedPurpose'])}
                />
              </div>
              <div className="q-section">
                <span className="q-section-label">理想尺寸</span>
                <ChoiceGroup
                  options={SIZE_OPTIONS}
                  value={values.preferredSize}
                  name="preferredSize"
                  onChange={(v) => setValue('preferredSize', v as UserPreferences['preferredSize'])}
                  cols3
                />
              </div>
            </>
          )}

          {/* Step 2 */}
          {step === 1 && (
            <>
              <div className="q-section">
                <span className="q-section-label">外观风格</span>
                <ChoiceGroup
                  options={STYLE_OPTIONS}
                  value={values.stylePreference}
                  name="stylePreference"
                  onChange={(v) => setValue('stylePreference', v as UserPreferences['stylePreference'])}
                />
              </div>
              <div className="q-section">
                <span className="q-section-label">防雨等级</span>
                <ChoiceGroup
                  options={RAIN_OPTIONS}
                  value={values.rainProtection}
                  name="rainProtection"
                  onChange={(v) => setValue('rainProtection', v as UserPreferences['rainProtection'])}
                  cols3
                />
              </div>
              <div className="q-section">
                <span className="q-section-label">采光偏好</span>
                <ChoiceGroup
                  options={SUNLIGHT_OPTIONS}
                  value={values.sunlightPreference}
                  name="sunlightPreference"
                  onChange={(v) => setValue('sunlightPreference', v as UserPreferences['sunlightPreference'])}
                  cols3
                />
              </div>
            </>
          )}

          {/* Step 3 */}
          {step === 2 && (
            <>
              <div className="q-section">
                <span className="q-section-label">预算（元）</span>
                <input
                  type="number"
                  min={0}
                  placeholder="例如：15000"
                  className="q-input"
                  {...register('budget', { valueAsNumber: true })}
                />
                <p className="q-hint">选填，帮助 AI 给出更匹配的方案</p>
              </div>
              <div className="q-section">
                <span className="q-section-label">特殊需求</span>
                <textarea
                  placeholder="例如：需要电气连接、无障碍设计、特定颜色..."
                  className="q-input q-textarea"
                  {...register('specialRequirements')}
                />
                <p className="q-hint">选填，最多 1000 字</p>
              </div>
              {submitError && <p className="q-error">{submitError}</p>}
            </>
          )}

          {/* Navigation */}
          <div className="q-nav">
            {step > 0 && (
              <button type="button" className="q-btn-back" onClick={() => setStep((s) => s - 1)}>
                ← 上一步
              </button>
            )}
            {step < STEPS.length - 1 && (
              <button type="button" className="q-btn-next" onClick={goNext}>
                下一步 →
              </button>
            )}
            {step === STEPS.length - 1 && (
              <button type="submit" className="q-btn-submit">
                生成设计方案 ✨
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
