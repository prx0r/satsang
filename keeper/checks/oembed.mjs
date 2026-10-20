// YouTube embeddability for every clip's video via oEmbed (no key): 200 = fine, 401 = embedding disabled or private,
// 404/400 = removed. Rolling ~1,500 videos per run; dead after cfg.deadAfter consecutive failures -> state/dead.json.
export default {
  id: 'oembed', cadence: 'daily',
  doc: 'A clip\'s YouTube video no longer embeds (removed, private, or embedding disabled). Once dead, the site hides it automatically via dead.json. Proposal: drop or replace the clip in the source candidates (sources/<group>/clips.json or app/clips.json) with the official re-upload if one exists; official channels only.',
  async run(ctx) {
    const { cfg, http, data } = ctx
    const clips = await data.dump('clip')
    const vids = new Map()
    for (const c of clips) { const v = c.media?.videoId; if (!v) continue; if (!vids.has(v)) vids.set(v, []); vids.get(v).push(c.id) }
    const batch = ctx.rolling('oembed', [...vids.keys()].sort(), ctx.limit(cfg.limits.oembed), (o) => o.check === 'oembed' && o.status === 'open' ? o.target : null)
    const findings = [], passed = []; let unknown = 0, throttled = false
    await http.pool(batch, 6, async (v) => {
      if (throttled || ctx.timeUp()) return
      const r = await http.req(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent('https://www.youtube.com/watch?v=' + v)}`, { body: 'none', timeout: 15000 })
      if (r.ok) passed.push(v)
      else if (r.status === 429) { throttled = true; unknown++ }
      else if ([401, 403, 404, 400].includes(r.status)) findings.push({ target: v, message: r.status === 401 || r.status === 403 ? 'YouTube video is private or not embeddable' : 'YouTube video removed or unavailable', evidence: { status: r.status, clips: vids.get(v).slice(0, 20) } })
      else unknown++
    })
    return { findings, passed, checked: batch.length, unknown, throttled, total: vids.size }
  },
}
