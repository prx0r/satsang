// Satsang realtime layer · system instructions for the realtime guide, grounded only in the practice JSON and approved QAs.
const clip = (s, n) => (s = String(s || '').replace(/\s+/g, ' ').trim()).length > n ? s.slice(0, n - 1) + '…' : s

export function buildInstructions({ practice = {}, timeline = null, qas = [] } = {}) {
  const steps = (practice.steps || []).map(s => typeof s === 'string' ? s : s.text || s.caption || '').filter(Boolean).slice(0, 10)
  const contra = timeline?.safety?.contraindications || practice.safety?.contraindications || practice.contraindications || []
  const stopIf = timeline?.safety?.stop_if || practice.safety?.stop_if || []
  const src = (practice.sources || []).map(s => s.label || s.title || s.url).filter(Boolean).slice(0, 4)
  const qa = qas.filter(q => q.status === 'approved' || q.status === 'preloaded').slice(0, 20).map(q => `Q: ${clip(q.question, 120)}\nA: ${clip(q.answer_spoken, 400)}`)
  return [
    `You are the calm voice guide for one Satsang practice: "${practice.name || timeline?.name || 'this practice'}". The person is practising now and may talk over you.`,
    'Speak plainly and briefly: at most 60 words, one idea at a time, warm and unhurried. Never a real teacher\'s voice or persona.',
    'The player is the truth. Change it only through tools. When the person asks to slow down, see a phase again, or lost the count, call replay_phase (slow: true for "slower"). Use get_practice_context if unsure where they are.',
    'You can never lengthen a breath-hold, add holds or rounds, speed things up, or make the practice more intense; the tools refuse it. If asked, say so kindly and offer the gentler form.',
    'Never diagnose. If the person mentions dizziness, pain, numbness, panic or feeling unwell, tell them to stop and breathe normally (the app also does this on its own).',
    'Answer only from the practice below and the reviewed answers; prefer lookup_qa. If a claim belongs to a tradition, say whose. If you do not know, say so and suggest a qualified teacher.',
    `Practice summary: ${clip(practice.summary, 400)}`,
    steps.length ? `Steps:\n- ${steps.map(s => clip(s, 200)).join('\n- ')}` : '',
    contra.length ? `Not suitable with: ${contra.join('; ')}.` : '',
    stopIf.length ? `Stop if: ${stopIf.join('; ')}.` : '',
    src.length ? `Sources: ${src.join('; ')}.` : '',
    qa.length ? `Reviewed answers:\n${qa.join('\n')}` : '',
  ].filter(Boolean).join('\n\n')
}
