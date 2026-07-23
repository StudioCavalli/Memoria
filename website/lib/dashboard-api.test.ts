import { beforeEach, describe, expect, it, vi } from 'vitest'
import { authService, seniorsService } from './dashboard-api'

function jsonRes(data: unknown, { ok = true, status = 200 } = {}) {
  return {
    ok,
    status,
    statusText: ok ? 'OK' : 'ERR',
    text: async () => JSON.stringify(data),
    json: async () => data,
    blob: async () => new Blob(),
  } as unknown as Response
}

beforeEach(() => {
  localStorage.clear()
  vi.unstubAllGlobals()
})

describe('dashboard-api client', () => {
  it('attaches the Bearer token when one is stored', async () => {
    localStorage.setItem('memoria_token', 'tok123')
    const fetchMock = vi.fn().mockResolvedValue(jsonRes([{ id: 1 }]))
    vi.stubGlobal('fetch', fetchMock)

    await seniorsService.list()

    const opts = fetchMock.mock.calls[0][1]
    expect(opts.headers.Authorization).toBe('Bearer tok123')
  })

  it('refreshes the token on 401 and retries the original request', async () => {
    localStorage.setItem('memoria_token', 'expired')
    localStorage.setItem('memoria_refresh', 'refresh123')
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonRes({}, { ok: false, status: 401 })) // 1) original → 401
      .mockResolvedValueOnce(jsonRes({ access_token: 'new', refresh_token: 'r2' })) // 2) refresh
      .mockResolvedValueOnce(jsonRes([{ id: 1 }])) // 3) retry → ok
    vi.stubGlobal('fetch', fetchMock)

    const { data } = await seniorsService.list()

    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(localStorage.getItem('memoria_token')).toBe('new')
    expect(fetchMock.mock.calls[2][1].headers.Authorization).toBe('Bearer new')
    expect(data).toEqual([{ id: 1 }])
  })

  it('throws on a non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonRes({}, { ok: false, status: 500 })))
    await expect(seniorsService.list()).rejects.toThrow('API Error 500')
  })

  it('login posts the credentials and returns the token payload', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonRes({ access_token: 'a', refresh_token: 'b', token_type: 'bearer' }))
    vi.stubGlobal('fetch', fetchMock)

    const { data } = await authService.login('x@y.fr', 'pw')

    const [url, opts] = fetchMock.mock.calls[0]
    expect(String(url)).toContain('/auth/login')
    expect(JSON.parse(opts.body)).toEqual({ email: 'x@y.fr', password: 'pw' })
    expect((data as { access_token: string }).access_token).toBe('a')
  })
})
