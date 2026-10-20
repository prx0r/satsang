// Writes the hostnames from ../../domain.mjs into the files that cannot import it: site/config.json (read by the
// browser at runtime) and prints BASE for shell use. Run by deploy.sh before every build.
import fs from 'node:fs'
import { BASE, API_BASE } from '../../domain.mjs'
const f = new URL('../site/config.json', import.meta.url)
const c = JSON.parse(fs.readFileSync(f, 'utf8'))
c.apiBase = API_BASE; c.shareBase = BASE + '/'
fs.writeFileSync(f, JSON.stringify(c, null, 2) + '\n')
console.log(BASE)
