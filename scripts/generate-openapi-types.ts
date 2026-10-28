import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import openapiTS, { astToString } from 'openapi-typescript'
import { openapiDocument } from '../apps/api/src/docs/openapi.js'

const outputPath = resolve('apps/web/src/types/generated/api.ts')

async function main(): Promise<void> {
  const nodes = await openapiTS(openapiDocument)
  const source = `${astToString(nodes).trimEnd()}\n`

  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, source, 'utf8')
}

void main()
