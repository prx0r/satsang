// Where the light of attention rests on the energy body (breath/body.js) for every grammar target a compiled timeline can name.
// Pure data + one function, shared by the hands-off player (sit/sit.js) and its tests. Coordinates are body.js space
// (seat at y 0.35, head centre y 2.08, the figure faces +z, so the figure's right side is -x). kind: 1 = a warm point that
// radiates on the out-breath, 2 = nostril stream, 3 = soft rising/falling light (belly), 4 = central channel brighter,
// 5 = ida/pingala/sushumna, 6 = whole body evenly lit, 7 = space (light widened around the body).
const P = (at, r, label) => ({ kind: 1, at, r, label, gain: 2.1 })   // gain: brighter than the app's single-locus default
export const BODY_LOCI = {
  // head
  nose_tip: { kind: 2, at: [0, 1.99, 0.235], r: 0.03, gain: 1.8, label: 'the tip of the nose' },
  nostril_L: { kind: 2, at: [0.03, 1.99, 0.23], r: 0.03, label: 'the left nostril' },
  nostril_R: { kind: 2, at: [-0.03, 1.99, 0.23], r: 0.03, label: 'the right nostril' },
  palate: P([0, 1.97, 0.12], 0.05, 'the palate'),
  middle_of_forehead: P([0, 2.15, 0.21], 0.05, 'the forehead'), lalata: P([0, 2.15, 0.21], 0.05, 'the forehead'), ajna: P([0, 2.1, 0.18], 0.05, 'between the brows'),
  middle_of_head: P([0, 2.1, 0], 0.07, 'the middle of the head'), kapala: P([0, 2.12, 0], 0.08, 'the skull'),
  top_of_head: P([0, 2.32, 0.02], 0.06, 'the top of the head'), brahmarandhra: P([0, 2.33, 0], 0.06, 'the crown'), sahasrara: P([0, 2.36, 0], 0.08, 'the crown'),
  base_of_skull: P([0, 2.0, -0.17], 0.06, 'the base of the skull'), dvadasanta: P([0, 2.62, 0], 0.07, 'above the crown'),
  head: P([0, 2.08, 0], 0.2, 'the head'),
  // throat, chest, belly, base
  throat_base: P([0, 1.72, 0.1], 0.06, 'the base of the throat'), vishuddha: P([0, 1.74, 0.1], 0.06, 'the throat'),
  middle_chest: { kind: 1, at: [0, 1.40, 0.16], r: 0.11, gain: 2.3, label: 'the heart' }, anahata: { kind: 1, at: [0, 1.40, 0.16], r: 0.11, gain: 2.3, label: 'the heart' },
  heart_cave: { kind: 1, at: [0, 1.38, 0.1], r: 0.12, gain: 2.3, label: 'the heart' }, chest: { kind: 1, at: [0, 1.42, 0.14], r: 0.17, gain: 2, label: 'the chest' },
  breastbone: P([0, 1.25, 0.17], 0.08, 'the breastbone'),
  above_navel: { kind: 3, at: [0, 0.8, 0.15], r: 0.1, label: 'just above the navel' }, manipura: { kind: 3, at: [0, 0.8, 0.15], r: 0.1, label: 'the navel' },
  belly: { kind: 3, at: [0, 0.66, 0.14], r: 0.12, label: 'the belly' }, torso: { kind: 3, at: [0, 0.95, 0.15], r: 0.22, label: 'the breathing body' },
  kanda: P([0, 0.42, 0.05], 0.08, 'the base of the spine'), svadhisthana: P([0, 0.5, 0.1], 0.08, 'the lower belly'), muladhara: P([0, 0.36, 0], 0.08, 'the base of the spine'),
  // limbs (the figure's right is -x)
  foot_R: P([-0.45, 0.24, 0.32], 0.08, 'the right foot'), foot_L: P([0.45, 0.24, 0.32], 0.08, 'the left foot'),
  fingertips_R: P([-0.8, 0.6, 0.18], 0.07, 'the fingertips'), fingertips_L: P([0.8, 0.6, 0.18], 0.07, 'the fingertips'),
  knee_R: P([-0.92, 0.33, 0.12], 0.07, 'the right knee'), knee_L: P([0.92, 0.33, 0.12], 0.07, 'the left knee'),
  shoulder_R: P([-0.42, 1.67, 0], 0.07, 'the right shoulder'), shoulder_L: P([0.42, 1.67, 0], 0.07, 'the left shoulder'),
  // layers
  sushumna: { kind: 4, label: 'the central channel' }, spine: { kind: 4, label: 'the spine' }, front_line: { kind: 4, label: 'the front of the body' },
  chest_down: { kind: 4, label: 'down the chest' }, heart_to_kapala: { kind: 4, label: 'the central channel' }, navel_to_nose: { kind: 4, label: 'the central channel' },
  nose_to_kapala: { kind: 4, label: 'the central channel' }, kapala_to_brahmarandhra: { kind: 4, label: 'the central channel' },
  ida: { kind: 5, label: 'the side channels' }, pingala: { kind: 5, label: 'the side channels' },
  arm_L: { kind: 6, label: 'the arms' }, arm_R: { kind: 6, label: 'the arms' }, leg_L: { kind: 6, label: 'the legs' }, leg_R: { kind: 6, label: 'the legs' },
  whole_body: { kind: 6, label: 'the whole body' },
  space: { kind: 7, label: 'the space around' },
}
/** grammar target (+ attention size) → a body.js locus object; whole body with a wide/whole-and-wide size reads as space */
export function bodyLocus(target, size) {
  if (!target) return { kind: 0, label: '' }
  if (target === 'whole_body' && size === 'wide') return BODY_LOCI.space
  return BODY_LOCI[target] || null
}
