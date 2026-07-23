import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { I18nProvider, useI18n } from './index'

function Probe() {
  const { t, locale, setLocale } = useI18n()
  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <span data-testid="known">{t('hero.tag')}</span>
      <span data-testid="missing">{t('__does_not_exist__')}</span>
      <button onClick={() => setLocale('en')}>switch-en</button>
    </div>
  )
}

beforeEach(() => localStorage.clear())

describe('I18nProvider', () => {
  it('defaults to French and translates a known key', () => {
    render(<I18nProvider><Probe /></I18nProvider>)
    expect(screen.getByTestId('locale')).toHaveTextContent('fr')
    // a real translation is returned, not the raw key
    expect(screen.getByTestId('known').textContent).not.toBe('hero.tag')
    expect(screen.getByTestId('known').textContent).toBeTruthy()
  })

  it('falls back to the key when a translation is missing', () => {
    render(<I18nProvider><Probe /></I18nProvider>)
    expect(screen.getByTestId('missing')).toHaveTextContent('__does_not_exist__')
  })

  it('switches locale and persists it to localStorage', () => {
    render(<I18nProvider><Probe /></I18nProvider>)
    fireEvent.click(screen.getByText('switch-en'))
    expect(screen.getByTestId('locale')).toHaveTextContent('en')
    expect(localStorage.getItem('memoria_locale')).toBe('en')
  })
})
