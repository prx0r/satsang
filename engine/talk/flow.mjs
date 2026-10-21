// Satsang /talk/ mock · wiring shared by the page and the node test: player port + bus + safety + adapter + the fake model.
import { createBus } from '../rt/bus.mjs'
import { createRealtimeClient } from '../rt/qwen-adapter.mjs'
import { buildInstructions } from '../rt/prompt.mjs'
import { createFakeRealtime, mockAudioFor } from './fake-model.mjs'

/**
 * @param {object} o { port, practice, grammar, schedule?, onEvent?, speakModel?(text) }
 * @returns {{ bus, client, fake, say(text), talkStart(), stats() }}
 */
export async function createTalkFlow({ port, practice, grammar, schedule, onEvent = () => { }, speakModel = () => { }, clock } = {}) {
  const bus = createBus({ port, grammar, practice, ...(clock ? { clock } : {}) })
  const fake = createFakeRealtime({ schedule })
  const audioOut = { chunks: 0, stopped: 0, enqueue() { this.chunks++ }, stop() { this.stopped++ } }
  const client = createRealtimeClient({
    socket: fake, bus, practice, grammar, timeline: port.timeline(), audioOut,
    instructions: buildInstructions({ practice, timeline: port.timeline() }),
    onEvent: e => { if (e.dir === 'model' && e.type === 'text.done') speakModel(e.text); onEvent(e) },
  })
  bus.on(e => onEvent({ dir: 'bus', ...e }))
  await client.connect()
  return {
    bus, client, fake, audioOut,
    /** the person presses talk: barge-in now (narration ducks, a hold is released, the practice pauses) */
    talkStart() { return client.bargeIn('user') },
    /** the person releases talk with this (local) transcript; mock audio carries the words for the fake model */
    say(text) { return client.userTurn({ transcript: text, audio: [mockAudioFor(text)] }) },
    stats() { return { ...client.stats, modelHeard: fake.state.heard.slice() } },
  }
}
