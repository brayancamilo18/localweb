import { useEffect, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Btn, Icon } from '../../../components/primitives/primitives'
import { useDashboard } from '../context/DashboardContext'
import { generateSocialPost, type SocialNetwork } from '../../../api/ai'
import type { AiImproveTone } from '../../../api/ai'
import { useAiQuota, useInvalidateAiQuota } from '../../shared/useAiQuota'

const NETWORKS: { id: SocialNetwork; label: string; icon: string }[] = [
  { id: 'instagram', label: 'Instagram', icon: 'image' },
  { id: 'facebook', label: 'Facebook', icon: 'arrowUpRight' },
  { id: 'google_my_business', label: 'Google My Business', icon: 'pin' },
]

const TONES: { id: AiImproveTone; label: string; subtitle: string }[] = [
  { id: 'profesional', label: 'Profesional', subtitle: 'Serio, claro, sobrio' },
  { id: 'cercano', label: 'Cercano', subtitle: 'Cálido, en primera persona del plural' },
  { id: 'vendedor', label: 'Vendedor', subtitle: 'Dinámico, orientado a la acción' },
]

const STAGES = [
  'Analizando tu negocio',
  'Eligiendo el tono perfecto',
  'Redactando el post',
  'Añadiendo los toques finales',
]

export default function AsistenteIa() {
  const { business } = useDashboard()
  const isPro = business.is_pro || business.plan === 'pending'
  const aiQuotaQuery = useAiQuota()
  const invalidateAiQuota = useInvalidateAiQuota()

  const aiEnabled = aiQuotaQuery.data?.enabled === true
  const aiRemaining = aiQuotaQuery.data?.remaining.social_posts
  const exhausted = typeof aiRemaining === 'number' && aiRemaining <= 0

  const [network, setNetwork] = useState<SocialNetwork>('instagram')
  const [tone, setTone] = useState<AiImproveTone>('profesional')
  const [topic, setTopic] = useState('')
  const [result, setResult] = useState<string | null>(null)
  const [typed, setTyped] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stageIdx, setStageIdx] = useState(0)
  const [hoveredNetwork, setHoveredNetwork] = useState<SocialNetwork | null>(null)
  const [hoveredTone, setHoveredTone] = useState<AiImproveTone | null>(null)
  const [hoveredCopy, setHoveredCopy] = useState(false)
  const [hoveredRegen, setHoveredRegen] = useState(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const clearTimers = () => {
    timers.current.forEach((t) => clearTimeout(t))
    timers.current = []
  }

  useEffect(() => () => clearTimers(), [])

  const runTypewriter = (text: string) => {
    setTyped('')
    let i = 0
    const tick = () => {
      i += Math.max(1, Math.floor(Math.random() * 4))
      setTyped(text.slice(0, i))
      if (i < text.length) {
        timers.current.push(setTimeout(tick, 14))
      }
    }
    tick()
  }

  const startStages = () => {
    setStageIdx(0)
    STAGES.forEach((_, idx) => {
      if (idx === 0) return
      timers.current.push(
        setTimeout(() => setStageIdx(idx), idx * 600),
      )
    })
  }

  const mutation = useMutation({
    mutationFn: () =>
      generateSocialPost({ network, tone, topic: topic.trim() || undefined }),
    onMutate: () => {
      clearTimers()
      setResult(null)
      setTyped('')
      setError(null)
      setCopied(false)
      startStages()
    },
    onSuccess: (data) => {
      setStageIdx(STAGES.length - 1)
      setResult(data.text)
      runTypewriter(data.text)
      invalidateAiQuota()
    },
    onError: (err: unknown) => {
      clearTimers()
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 429) setError('Has alcanzado el límite diario de generaciones. Vuelve mañana.')
      else if (status === 503) setError('La generación con IA no está disponible ahora mismo.')
      else if (status === 403) setError('Esta función es solo para el plan Pro.')
      else if (status === 422) setError('No se ha podido procesar la solicitud. Revisa los datos.')
      else setError('No hemos podido generar el post. Inténtalo de nuevo.')
      invalidateAiQuota()
    },
  })
  const isGenerating = mutation.isPending
  const isGenDisabled = !aiEnabled || exhausted || isGenerating

  async function handleCopy() {
    if (!result) return
    try {
      await navigator.clipboard.writeText(result)
      setCopied(true)
      timers.current.push(setTimeout(() => setCopied(false), 1500))
    } catch {
      // silencioso
    }
  }

  const GREEN = '#0F6E56'
  const INK = '#0B1F1A'

  return (
    <div className="lw-dash-section-page" style={{ maxWidth: 680 }}>
      <style>{`
        @keyframes ai-shimmer { 100% { transform: translateX(100%); } }
        @keyframes ai-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30% { transform: translateY(-3px); opacity: 1; }
        }
        @keyframes ai-caret { 50% { opacity: 0; } }
        @keyframes ai-spin { to { transform: rotate(360deg); } }
        @keyframes ai-fadein { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '5px 12px', borderRadius: 99,
          background: 'rgba(15,110,86,0.08)', border: '1px solid rgba(15,110,86,0.15)',
          marginBottom: 14,
        }}>
          <Icon name="sparkle" size={12} color={GREEN} />
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: GREEN, textTransform: 'uppercase' }}>
            Inteligencia artificial
          </span>
        </div>
        <h1 style={{ margin: '0 0 6px', fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', color: INK }}>
          Asistente IA
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: `${INK}8C` }}>
          Genera posts para tus redes sociales adaptados a tu negocio.{' '}
          <span style={{ color: `${INK}B3`, fontWeight: 500 }}>Solo plan Pro.</span>
        </p>
      </div>

      {!isPro ? (
        <div style={{
          padding: 32, borderRadius: 16, border: '1px solid rgba(11,31,26,0.08)',
          background: '#fff', textAlign: 'center',
        }}>
          <Icon name="lock" size={32} color="rgba(11,31,26,0.25)" />
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: '16px 0 8px', color: INK }}>
            Función exclusiva Pro
          </h2>
          <p style={{ fontSize: 14, color: `${INK}8C`, marginBottom: 24, maxWidth: 360, margin: '0 auto 24px' }}>
            Genera posts para Instagram, Facebook y Google My Business en segundos con IA, adaptados al tono y sector de tu negocio.
          </p>
          <Link to="/dashboard/account?tab=plan" style={{ textDecoration: 'none' }}>
            <Btn type="button" kind="primary" iconRight="arrowRight">Ver plan Pro</Btn>
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Red social */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 10, color: INK }}>
              Red social
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {NETWORKS.map((n) => {
                const active = network === n.id
                const hov = hoveredNetwork === n.id && !active
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => setNetwork(n.id)}
                    onMouseEnter={() => setHoveredNetwork(n.id)}
                    onMouseLeave={() => setHoveredNetwork(null)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 7,
                      padding: '9px 16px', borderRadius: 12,
                      border: `1px solid ${active ? GREEN : hov ? 'rgba(15,110,86,0.4)' : 'rgba(11,31,26,0.1)'}`,
                      background: active ? GREEN : hov ? 'rgba(15,110,86,0.03)' : '#fff',
                      color: active ? '#fff' : INK,
                      fontSize: 13, fontWeight: 500,
                      cursor: 'pointer', font: 'inherit',
                      transition: 'all 0.18s',
                      boxShadow: active ? `0 4px 12px rgba(15,110,86,0.25)` : 'none',
                    }}
                  >
                    <Icon name={n.icon} size={14} color={active ? '#fff' : `${INK}66`} />
                    {n.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tema opcional */}
          <div>
            <label htmlFor="ai-topic" style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: INK }}>
              Tema o contexto{' '}
              <span style={{ fontWeight: 400, color: `${INK}66` }}>(opcional)</span>
            </label>
            <div style={{ position: 'relative' }}>
              <textarea
                id="ai-topic"
                rows={3}
                maxLength={200}
                placeholder="Ej: nueva temporada de verano, promoción especial, nuevo servicio de…"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '10px 12px', paddingBottom: 28,
                  borderRadius: 12, border: '1px solid rgba(11,31,26,0.1)',
                  background: '#fff', color: INK,
                  fontSize: 14, font: 'inherit', resize: 'vertical',
                  outline: 'none', lineHeight: 1.55,
                  transition: 'border-color 0.18s, box-shadow 0.18s',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = GREEN
                  e.currentTarget.style.boxShadow = `0 0 0 3px rgba(15,110,86,0.12)`
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(11,31,26,0.1)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
              <span style={{
                position: 'absolute', bottom: 8, right: 10,
                fontSize: 11, color: topic.length > 180 ? '#ef4444' : `${INK}66`,
                pointerEvents: 'none',
              }}>
                {topic.length}/200
              </span>
            </div>
          </div>

          {/* Tono */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 10, color: INK }}>
              Tono
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {TONES.map((t) => {
                const active = tone === t.id
                const hov = hoveredTone === t.id && !active
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTone(t.id)}
                    onMouseEnter={() => setHoveredTone(t.id)}
                    onMouseLeave={() => setHoveredTone(null)}
                    style={{
                      textAlign: 'left', padding: '12px 14px', borderRadius: 12,
                      border: `1px solid ${active ? GREEN : hov ? 'rgba(15,110,86,0.4)' : 'rgba(11,31,26,0.1)'}`,
                      background: active ? GREEN : hov ? 'rgba(15,110,86,0.03)' : '#fff',
                      cursor: 'pointer', font: 'inherit', transition: 'all 0.18s',
                      boxShadow: active ? `0 4px 12px rgba(15,110,86,0.2)` : 'none',
                    }}
                  >
                    <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: active ? '#fff' : INK }}>
                      {t.label}
                    </span>
                    <span style={{ display: 'block', fontSize: 11, marginTop: 2, color: active ? 'rgba(255,255,255,0.8)' : `${INK}8C` }}>
                      {t.subtitle}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Botón generar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <span title={!aiEnabled ? 'La generación con IA no está disponible.' : exhausted ? 'Has alcanzado el límite diario.' : undefined} style={{ display: 'inline-flex' }}>
              <button
                type="button"
                disabled={isGenDisabled}
                onClick={() => mutation.mutate()}
                style={{
                  position: 'relative', overflow: 'hidden',
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '11px 22px', borderRadius: 12,
                  background: isGenDisabled ? `${GREEN}99` : GREEN,
                  color: '#fff', border: 'none',
                  fontSize: 14, fontWeight: 600, font: 'inherit',
                  cursor: isGenDisabled ? 'not-allowed' : 'pointer',
                  boxShadow: isGenDisabled ? 'none' : `0 4px 16px rgba(15,110,86,0.3)`,
                  transition: 'all 0.18s',
                }}
              >
                {isGenerating && (
                  <span aria-hidden style={{
                    position: 'absolute', inset: 0,
                    transform: 'translateX(-100%)',
                    animation: 'ai-shimmer 1.6s infinite',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.28), transparent)',
                    pointerEvents: 'none',
                  }} />
                )}
                <span style={isGenerating ? { display: 'inline-flex', animation: 'ai-spin 1s linear infinite' } : { display: 'inline-flex' }}>
                  <Icon name="sparkle" size={16} color="#fff" />
                </span>
                <span style={{ position: 'relative' }}>
                  {isGenerating ? 'Generando…' : 'Generar post'}
                </span>
              </button>
            </span>

            {aiEnabled && (
              <span style={{ fontSize: 13, color: exhausted ? '#ef4444' : `${INK}8C` }}>
                {exhausted
                  ? 'Has alcanzado el límite diario. Vuelve mañana.'
                  : typeof aiRemaining === 'number'
                    ? `Te quedan ${aiRemaining} de 5 generaciones hoy`
                    : null}
              </span>
            )}
          </div>

          {error ? (
            <div role="alert" style={{ fontSize: 13, color: '#ef4444', marginTop: -8 }}>
              {error}
            </div>
          ) : null}

          {/* Tarjeta resultado */}
          {(isGenerating || result) ? (
            <div style={{
              borderRadius: 16, border: '1px solid rgba(11,31,26,0.1)',
              background: '#fff', overflow: 'hidden',
              boxShadow: '0 2px 12px rgba(11,31,26,0.06)',
              animation: 'ai-fadein 0.3s both',
            }}>
              {/* Top bar */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 20px',
                borderBottom: '1px solid rgba(11,31,26,0.06)',
                background: '#FAFAF7',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: `${INK}80`, textTransform: 'uppercase' }}>
                    Resultado
                  </span>
                  {isGenerating && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '3px 8px', borderRadius: 99,
                      background: 'rgba(15,110,86,0.08)', border: '1px solid rgba(15,110,86,0.15)',
                    }}>
                      <span style={{ position: 'relative', display: 'inline-flex', width: 6, height: 6 }}>
                        <span style={{
                          position: 'absolute', inset: 0, borderRadius: '50%',
                          background: GREEN, opacity: 0.7,
                          animation: 'ai-ping 1s cubic-bezier(0,0,0.2,1) infinite',
                        }} />
                        <span style={{ position: 'relative', display: 'inline-flex', width: 6, height: 6, borderRadius: '50%', background: GREEN }} />
                      </span>
                      <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: GREEN, textTransform: 'uppercase' }}>
                        En vivo
                      </span>
                    </span>
                  )}
                </div>

                {!isGenerating && result && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => void handleCopy()}
                      onMouseEnter={() => setHoveredCopy(true)}
                      onMouseLeave={() => setHoveredCopy(false)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '6px 10px', borderRadius: 8, border: 'none',
                        background: hoveredCopy ? 'rgba(11,31,26,0.05)' : 'transparent',
                        color: hoveredCopy ? INK : `${INK}B3`,
                        fontSize: 12, fontWeight: 500, cursor: 'pointer', font: 'inherit',
                        transition: 'all 0.15s',
                      }}
                    >
                      <Icon name={copied ? 'check' : 'copy'} size={13} color={copied ? GREEN : 'currentColor'} />
                      {copied ? 'Copiado' : 'Copiar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => mutation.mutate()}
                      disabled={isGenDisabled}
                      onMouseEnter={() => setHoveredRegen(true)}
                      onMouseLeave={() => setHoveredRegen(false)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '6px 10px', borderRadius: 8,
                        border: `1px solid ${hoveredRegen ? 'rgba(15,110,86,0.4)' : 'rgba(11,31,26,0.1)'}`,
                        background: hoveredRegen ? 'rgba(15,110,86,0.04)' : '#fff',
                        color: INK, fontSize: 12, fontWeight: 600,
                        cursor: isGenDisabled ? 'not-allowed' : 'pointer',
                        font: 'inherit', transition: 'all 0.15s',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                        opacity: isGenDisabled ? 0.5 : 1,
                      }}
                    >
                      <Icon name="sparkle" size={13} color={GREEN} />
                      Regenerar
                    </button>
                  </div>
                )}
              </div>

              {/* Body */}
              <div style={{ padding: '20px 24px', minHeight: 160 }}>
                {isGenerating ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {/* Stages */}
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {STAGES.map((s, i) => {
                        const done = i < stageIdx
                        const active = i === stageIdx
                        return (
                          <li key={s} style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            fontSize: 13, transition: 'all 0.3s',
                            color: active ? INK : done ? `${INK}8C` : `${INK}40`,
                          }}>
                            <span style={{
                              position: 'relative', display: 'inline-flex',
                              alignItems: 'center', justifyContent: 'center',
                              width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                              border: `2px solid ${done ? GREEN : active ? GREEN : 'rgba(11,31,26,0.15)'}`,
                              background: done ? GREEN : '#fff',
                            }}>
                              {done && <Icon name="check" size={10} color="#fff" />}
                              {active && (
                                <span style={{
                                  position: 'absolute', inset: -2, borderRadius: '50%',
                                  border: `2px solid ${GREEN}`,
                                  borderTopColor: 'transparent',
                                  animation: 'ai-spin 0.7s linear infinite',
                                }} />
                              )}
                            </span>
                            <span style={{ fontWeight: active ? 500 : 400 }}>{s}</span>
                            {active && (
                              <span style={{ display: 'inline-flex', gap: 3, marginLeft: 2 }}>
                                {[0, 150, 300].map((delay) => (
                                  <span key={delay} style={{
                                    width: 4, height: 4, borderRadius: '50%', background: GREEN,
                                    animation: `ai-bounce 1s ${delay}ms infinite`,
                                  }} />
                                ))}
                              </span>
                            )}
                          </li>
                        )
                      })}
                    </ul>

                    {/* Skeleton lines */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {[92, 86, 70, 50].map((w, i) => (
                        <div key={i} style={{
                          height: 12, borderRadius: 99,
                          background: 'rgba(11,31,26,0.06)',
                          width: `${w}%`, overflow: 'hidden', position: 'relative',
                        }}>
                          <div style={{
                            position: 'absolute', inset: 0,
                            transform: 'translateX(-100%)',
                            animation: `ai-shimmer 1.6s ${i * 120}ms infinite`,
                            background: 'linear-gradient(90deg, transparent, rgba(15,110,86,0.18), transparent)',
                          }} />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: 15, lineHeight: 1.65, color: INK, whiteSpace: 'pre-wrap' }}>
                    {typed}
                    {typed.length < (result?.length ?? 0) && (
                      <span style={{
                        display: 'inline-block', width: 2, height: '1.05em',
                        verticalAlign: '-2px', background: GREEN, marginLeft: 2,
                        animation: 'ai-caret 1s steps(2) infinite',
                      }} />
                    )}
                  </p>
                )}
              </div>
            </div>
          ) : null}

        </div>
      )}

      <style>{`@keyframes ai-ping { 75%, 100% { transform: scale(2); opacity: 0; } }`}</style>
    </div>
  )
}
