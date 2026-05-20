import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { ResultPage } from '../pages/ResultPage'
import type { GardenAnalysis, UserPreferences, DesignRecommendation } from '../types/garden'

vi.mock('../services/api', () => ({
  generateRecommendation: vi.fn(),
}))

import { generateRecommendation } from '../services/api'

const mockGenerateRecommendation = vi.mocked(generateRecommendation)

// ─── Fixtures ────────────────────────────────────────────────────────────────

const mockAnalysis: GardenAnalysis = {
  estimatedSize: { width: 10, height: 15 },
  orientation: 'S',
  sunlight: { morning: 'full-sun', afternoon: 'partial-sun', evening: 'shade' },
  existingStructures: ['fence'],
  availableSpaces: [{ x: 2, y: 3, width: 4, height: 5, score: 0.9 }],
  terrain: 'flat',
  drainage: 'good',
}

const mockPreferences: UserPreferences = {
  shedPurpose: 'storage',
  preferredSize: 'medium',
  stylePreference: 'modern',
  rainProtection: 'moderate',
  sunlightPreference: 'partial',
}

const mockRecommendation: DesignRecommendation = {
  primaryRecommendation: {
    position: { x: 2, y: 3 },
    orientation: 45,
    size: { width: 3, depth: 4, height: 2.5 },
    rationale: '此位置光照充足且排水良好，非常适合储物棚屋。',
  },
  alternativeOptions: [
    {
      position: { x: 5, y: 7 },
      pros: ['靠近入口', '地面平整'],
      cons: ['遮阴较多'],
    },
  ],
  constructionTips: ['确保地基水平', '使用防腐木材', '安装排水沟'],
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ResultPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading state while API call is pending', async () => {
    // Never resolves during this test — keeps component in loading state
    mockGenerateRecommendation.mockReturnValue(new Promise(() => {}))

    render(<ResultPage analysis={mockAnalysis} preferences={mockPreferences} />)

    expect(screen.getByLabelText('加载中')).toBeInTheDocument()
    expect(screen.getByText(/AI 正在生成您的专属设计方案/)).toBeInTheDocument()
  })

  it('happy path: renders all recommendation fields on success', async () => {
    mockGenerateRecommendation.mockResolvedValue(mockRecommendation)

    render(<ResultPage analysis={mockAnalysis} preferences={mockPreferences} />)

    // Rationale appears
    await waitFor(() =>
      expect(screen.getByText('此位置光照充足且排水良好，非常适合储物棚屋。')).toBeInTheDocument(),
    )

    // First construction tip appears
    expect(screen.getByText('确保地基水平')).toBeInTheDocument()

    // Metrics are rendered
    expect(screen.getByText('(2, 3)')).toBeInTheDocument()   // position
    expect(screen.getByText('45°')).toBeInTheDocument()       // orientation
    expect(screen.getByText('3 m')).toBeInTheDocument()       // width
    expect(screen.getByText('4 m')).toBeInTheDocument()       // depth
    expect(screen.getByText('2.5 m')).toBeInTheDocument()     // height

    // Alternative option pros/cons
    expect(screen.getByText('靠近入口')).toBeInTheDocument()
    expect(screen.getByText('遮阴较多')).toBeInTheDocument()
  })

  it('error case 1: shows error message when API throws', async () => {
    mockGenerateRecommendation.mockRejectedValue(new Error('Network error'))

    render(<ResultPage analysis={mockAnalysis} preferences={mockPreferences} />)

    await waitFor(() =>
      expect(screen.getByRole('alert')).toBeInTheDocument(),
    )

    expect(screen.getByRole('alert')).toHaveTextContent('生成推荐方案失败，请稍后重试')
    expect(screen.queryByText(/AI 正在生成/)).not.toBeInTheDocument()
  })

  it('error case 2: retry button calls generateRecommendation again', async () => {
    // First call fails, second call succeeds
    mockGenerateRecommendation
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(mockRecommendation)

    render(<ResultPage analysis={mockAnalysis} preferences={mockPreferences} />)

    // Wait for error to appear
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())

    expect(mockGenerateRecommendation).toHaveBeenCalledTimes(1)

    // Click retry
    fireEvent.click(screen.getByRole('button', { name: '重试' }))

    // generateRecommendation called a second time
    await waitFor(() => expect(mockGenerateRecommendation).toHaveBeenCalledTimes(2))

    // Success view appears after retry
    await waitFor(() =>
      expect(screen.getByText('此位置光照充足且排水良好，非常适合储物棚屋。')).toBeInTheDocument(),
    )
  })
})
