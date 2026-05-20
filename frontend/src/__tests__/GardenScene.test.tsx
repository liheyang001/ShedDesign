import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { GardenScene } from '../components/GardenScene'
import type { GardenAnalysis, DesignRecommendation } from '../types/garden'

vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="canvas">{children}</div>
  ),
  useThree: vi.fn(() => ({
    camera: {},
    raycaster: { ray: { intersectPlane: vi.fn(() => true) } },
  })),
}))

vi.mock('@react-three/drei', () => ({
  OrbitControls: React.forwardRef((_props: unknown, _ref: unknown) => null),
}))

const baseAnalysis: GardenAnalysis = {
  estimatedSize: { width: 10, height: 8 },
  orientation: 'north',
  sunlight: {
    morning: 'full-sun',
    afternoon: 'partial-sun',
    evening: 'shade',
  },
  existingStructures: ['fence', 'tree'],
  availableSpaces: [{ x: 1, y: 1, width: 4, height: 3, score: 0.9 }],
  terrain: 'flat',
  drainage: 'good',
}

const baseRecommendation: DesignRecommendation = {
  primaryRecommendation: {
    position: { x: 2, y: 3 },
    orientation: 0,
    size: { width: 3, depth: 2, height: 2.5 },
    rationale: 'Best spot for sunlight.',
  },
  alternativeOptions: [
    {
      position: { x: 5, y: 1 },
      pros: ['Good drainage'],
      cons: ['Less sunlight'],
    },
  ],
  constructionTips: ['Level the ground first.'],
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GardenScene', () => {
  it('happy path: renders canvas with valid analysis and recommendation', () => {
    render(<GardenScene analysis={baseAnalysis} recommendation={baseRecommendation} />)
    expect(screen.getByTestId('canvas')).toBeDefined()
  })

  it('renders container div with garden-scene-container className', () => {
    const { container } = render(
      <GardenScene analysis={baseAnalysis} recommendation={baseRecommendation} />
    )
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).toContain('garden-scene-container')
  })

  it('edge case: does not crash when analysis.estimatedSize.width is 0', () => {
    const zeroWidthAnalysis: GardenAnalysis = {
      ...baseAnalysis,
      estimatedSize: { width: 0, height: 8 },
    }
    expect(() =>
      render(<GardenScene analysis={zeroWidthAnalysis} recommendation={baseRecommendation} />)
    ).not.toThrow()
    expect(screen.getByTestId('canvas')).toBeDefined()
  })

  it('edge case: does not crash when alternativeOptions is empty array', () => {
    const noAltsRecommendation: DesignRecommendation = {
      ...baseRecommendation,
      alternativeOptions: [],
    }
    expect(() =>
      render(<GardenScene analysis={baseAnalysis} recommendation={noAltsRecommendation} />)
    ).not.toThrow()
    expect(screen.getByTestId('canvas')).toBeDefined()
  })

  it('renders canvas when analysis has multiple availableSpaces', () => {
    const multiSpaceAnalysis: GardenAnalysis = {
      ...baseAnalysis,
      availableSpaces: [
        { x: 1, y: 1, width: 3, height: 2, score: 0.9 },
        { x: 5, y: 2, width: 2, height: 2, score: 0.7 },
        { x: 2, y: 5, width: 4, height: 1, score: 0.5 },
      ],
    }
    expect(() =>
      render(<GardenScene analysis={multiSpaceAnalysis} recommendation={baseRecommendation} />)
    ).not.toThrow()
    // Canvas should still be present regardless of how many spaces there are
    expect(screen.getByTestId('canvas')).toBeDefined()
  })

  it('edge case: does not crash when existingStructures is empty array', () => {
    const noStructuresAnalysis: GardenAnalysis = {
      ...baseAnalysis,
      existingStructures: [],
    }
    expect(() =>
      render(<GardenScene analysis={noStructuresAnalysis} recommendation={baseRecommendation} />)
    ).not.toThrow()
    expect(screen.getByTestId('canvas')).toBeDefined()
  })

  it('test 7: reset button is present in the DOM', () => {
    render(<GardenScene analysis={baseAnalysis} recommendation={baseRecommendation} />)
    const resetBtn = screen.getByText(/重置视角/)
    expect(resetBtn).toBeDefined()
  })

  it('test 8: clicking reset button does not crash (controlsRef may be null in test env)', () => {
    render(<GardenScene analysis={baseAnalysis} recommendation={baseRecommendation} />)
    const resetBtn = screen.getByText(/重置视角/)
    expect(() => fireEvent.click(resetBtn)).not.toThrow()
  })

  it('test 9: accepts onPositionChange callback prop and renders without crashing', () => {
    const onPositionChange = vi.fn()
    expect(() =>
      render(
        <GardenScene
          analysis={baseAnalysis}
          recommendation={baseRecommendation}
          onPositionChange={onPositionChange}
        />
      )
    ).not.toThrow()
    expect(screen.getByTestId('canvas')).toBeDefined()
  })

  it('test 10: renders normally when onPositionChange prop is omitted (optional prop)', () => {
    expect(() =>
      render(<GardenScene analysis={baseAnalysis} recommendation={baseRecommendation} />)
    ).not.toThrow()
    expect(screen.getByTestId('canvas')).toBeDefined()
  })

  it('test 11: rotation and scale sliders are present in the DOM (at least 2 sliders)', () => {
    render(<GardenScene analysis={baseAnalysis} recommendation={baseRecommendation} />)
    const sliders = screen.getAllByRole('slider')
    expect(sliders.length).toBeGreaterThanOrEqual(2)
  })

  it('test 12: changing rotation slider triggers onRotationChange callback', () => {
    const onRotationChange = vi.fn()
    render(
      <GardenScene
        analysis={baseAnalysis}
        recommendation={baseRecommendation}
        onRotationChange={onRotationChange}
      />
    )
    const sliders = screen.getAllByRole('slider')
    // First slider is the rotation slider (min=0, max=360)
    const rotationSlider = sliders.find(
      (s) => (s as HTMLInputElement).max === '360'
    )
    expect(rotationSlider).toBeDefined()
    fireEvent.change(rotationSlider!, { target: { value: '90' } })
    expect(onRotationChange).toHaveBeenCalledWith(90)
  })

  it('test 13: changing scale slider triggers onScaleChange callback', () => {
    const onScaleChange = vi.fn()
    render(
      <GardenScene
        analysis={baseAnalysis}
        recommendation={baseRecommendation}
        onScaleChange={onScaleChange}
      />
    )
    const sliders = screen.getAllByRole('slider')
    // Scale slider has max=2
    const scaleSlider = sliders.find(
      (s) => (s as HTMLInputElement).max === '2'
    )
    expect(scaleSlider).toBeDefined()
    fireEvent.change(scaleSlider!, { target: { value: '1.5' } })
    expect(onScaleChange).toHaveBeenCalledWith(1.5)
  })
})
