import { Project, SyntaxKind, Node, type Type } from 'ts-morph'
import * as fs from 'node:fs'
import { z } from 'zod'
import * as schemasModule from '../src/lib/schemas.ts'

// ─── Types ────────────────────────────────────────────────────────────────────

type JsonSchema = Record<string, unknown>

interface OpenAPISpec {
  openapi: string
  info: { title: string; version: string; description?: string }
  servers: { url: string }[]
  components: {
    schemas: Record<string, JsonSchema>
    securitySchemes: Record<string, unknown>
  }
  paths: Record<string, Record<string, unknown>>
}

interface JSDocInfo {
  summary?: string // first line of leading JSDoc text
  description?: string // remaining lines
  deprecated?: boolean
}

// ─── JSON Schema helpers ──────────────────────────────────────────────────────

// TypeScript represents `boolean` internally as `true | false`.
// These are anonymous object type names emitted by the TS compiler that
// should be inlined in-place rather than hoisted to #/components/schemas.
const ANON_TYPE_NAMES = new Set(['__object', '__type', 'Object', '__'])
function isAnonName(name: string) {
  return ANON_TYPE_NAMES.has(name) || name.startsWith('__')
}

// Wrap a schema as nullable.
// OAS 3.0 technically forbids sibling keywords on `$ref`, but every major
// renderer (Swagger UI, Redoc, vitepress-openapi) supports `nullable: true`
// alongside `$ref` in practice. The `allOf` wrapper is spec-purist but breaks
// schema renderers that don't dereference single-entry allOf lists.
function makeNullable(schema: JsonSchema): JsonSchema {
  return { ...schema, nullable: true }
}

// ─── typeToJsonSchema ─────────────────────────────────────────────────────────

function typeToJsonSchema(
  type: Type,
  seen: Set<string> = new Set(),
  namedTypes: Map<string, () => JsonSchema> = new Map()
): JsonSchema {
  // --- union (T | null | undefined | ...) -----------------------------------
  if (type.isUnion()) {
    const all = type.getUnionTypes()
    const nullable = all.some(t => t.isNull() || t.isUndefined())
    let rest = all.filter(t => !t.isNull() && !t.isUndefined())

    // Collapse `true | false` → single boolean
    const hasTrue = rest.some(
      t => t.isBooleanLiteral() && t.getText() === 'true'
    )
    const hasFalse = rest.some(
      t => t.isBooleanLiteral() && t.getText() === 'false'
    )
    if (hasTrue && hasFalse) {
      rest = [
        ...rest.filter(t => !t.isBooleanLiteral()),
        rest.find(t => t.isBoolean()) ?? rest.find(t => t.isBooleanLiteral())!
      ]
    }

    if (rest.length === 0) return { nullable: true }

    // All string literals → string enum
    if (rest.every(t => t.isStringLiteral())) {
      const schema: JsonSchema = {
        type: 'string',
        enum: rest.map(t => t.getLiteralValue() as string)
      }
      return nullable ? makeNullable(schema) : schema
    }

    // All number literals → number enum
    if (rest.every(t => t.isNumberLiteral())) {
      const schema: JsonSchema = {
        type: 'number',
        enum: rest.map(t => t.getLiteralValue() as number)
      }
      return nullable ? makeNullable(schema) : schema
    }

    if (rest.length === 1) {
      const inner = typeToJsonSchema(rest[0], seen, namedTypes)
      return nullable ? makeNullable(inner) : inner
    }

    return {
      oneOf: rest.map(t => typeToJsonSchema(t, seen, namedTypes)),
      ...(nullable ? { nullable: true } : {})
    }
  }

  // --- primitives -----------------------------------------------------------
  if (type.isString()) return { type: 'string' }
  if (type.isStringLiteral())
    return { type: 'string', enum: [type.getLiteralValue() as string] }
  if (type.isNumber()) return { type: 'number' }
  if (type.isNumberLiteral())
    return { type: 'number', enum: [type.getLiteralValue() as number] }
  if (type.isBoolean() || type.isBooleanLiteral()) return { type: 'boolean' }
  if (type.isNull() || type.isUndefined()) return { nullable: true }
  if (type.isAny() || type.isUnknown() || type.isNever()) return {}

  // --- well-known globals ---------------------------------------------------
  const symName = type.getSymbol()?.getName()
  if (symName === 'Date') return { type: 'string', format: 'date-time' }
  if (symName === 'BigInt') return { type: 'string' } // Prisma BigInt serialised as string

  // --- arrays ---------------------------------------------------------------
  if (type.isArray()) {
    const el = type.getArrayElementType()
    return {
      type: 'array',
      items: el ? typeToJsonSchema(el, seen, namedTypes) : {}
    }
  }

  // --- objects --------------------------------------------------------------
  if (type.isObject()) {
    const displayName =
      type.getSymbol()?.getName() ?? type.getText().split('<')[0].trim()

    if (seen.has(displayName) && !isAnonName(displayName)) {
      return { $ref: `#/components/schemas/${displayName}` }
    }

    const nextSeen = new Set(seen)
    if (displayName && !isAnonName(displayName)) nextSeen.add(displayName)

    const props = type.getProperties()
    if (props.length === 0) return { type: 'object', properties: {} }

    const buildSchema = (): JsonSchema => {
      const properties: Record<string, JsonSchema> = {}
      const required: string[] = []

      for (const prop of props) {
        const name = prop.getName()
        if (name.startsWith('__') || name.startsWith('[')) continue

        const decl = prop.getValueDeclaration()
        if (!decl) continue

        const propType = prop.getTypeAtLocation(decl)
        const isOptional =
          (Node.isPropertySignature(decl) && decl.hasQuestionToken()) ||
          (Node.isPropertyDeclaration(decl) && decl.hasQuestionToken()) ||
          propType.isUndefined() ||
          (propType.isUnion() &&
            propType.getUnionTypes().some(t => t.isUndefined()))

        if (!isOptional) required.push(name)
        properties[name] = typeToJsonSchema(propType, nextSeen, namedTypes)
      }

      return {
        type: 'object',
        ...(required.length ? { required } : {}),
        properties
      }
    }

    // Named types → register lazy builder + return $ref for deduplication
    if (displayName && !isAnonName(displayName)) {
      if (!namedTypes.has(displayName)) namedTypes.set(displayName, buildSchema)
      return { $ref: `#/components/schemas/${displayName}` }
    }

    // Anonymous types → inline
    return buildSchema()
  }

  return {}
}

// ─── Zod request schema → JSON Schema ─────────────────────────────────────────

// Recursively normalise a JSON Schema 2020-12 object to be OpenAPI 3.0 compatible:
//   • { const: v }                          → { enum: [v] }
//   • anyOf: [{ type: T }, { type: "null"}] → { type: T, nullable: true }  (and merges siblings)
function oas30(schema: JsonSchema): JsonSchema {
  if (typeof schema !== 'object' || schema === null || Array.isArray(schema))
    return schema

  // Recurse into all child schemas first
  const s: JsonSchema = {}
  for (const [k, v] of Object.entries(schema)) {
    if (k === 'properties' && typeof v === 'object' && v !== null) {
      s[k] = Object.fromEntries(
        Object.entries(v as Record<string, JsonSchema>).map(([pk, pv]) => [
          pk,
          oas30(pv)
        ])
      )
    } else if (k === 'anyOf' || k === 'oneOf' || k === 'allOf') {
      s[k] = (v as JsonSchema[]).map(oas30)
    } else if (k === 'items' && typeof v === 'object') {
      s[k] = oas30(v as JsonSchema)
    } else {
      s[k] = v
    }
  }

  // const → enum
  if ('const' in s) {
    const { const: cv, ...rest } = s
    return oas30({ ...rest, enum: [cv] })
  }

  // anyOf with a sole { type: "null" } member → nullable + unwrap
  if (Array.isArray(s.anyOf)) {
    const nullParts = (s.anyOf as JsonSchema[]).filter(
      t => typeof t === 'object' && (t as any).type === 'null'
    )
    const nonNull = (s.anyOf as JsonSchema[]).filter(
      t => typeof t !== 'object' || (t as any).type !== 'null'
    )
    if (nullParts.length > 0) {
      const { anyOf: _, ...rest } = s
      if (nonNull.length === 1) {
        // Flatten: { anyOf: [T, null] } → { ...T, nullable: true }
        return { ...nonNull[0], ...rest, nullable: true }
      }
      return { ...rest, anyOf: nonNull, nullable: true }
    }
  }

  return s
}

function getZodJsonSchema(schemaName: string): JsonSchema | null {
  try {
    const schema = (schemasModule as Record<string, unknown>)[schemaName]
    if (!schema || !(schema instanceof z.ZodType)) return null
    const result = z.toJSONSchema(schema) as Record<string, unknown>
    delete result.$schema
    return oas30(result as JsonSchema)
  } catch {
    return null
  }
}

// ─── Route file path → /api/... URL ───────────────────────────────────────────

function filePathToRoute(filePath: string): string {
  const rel = filePath.replace(/\\/g, '/').split('/src/routes/')[1]
  const noExt = rel.replace(/\.ts$/, '')
  const parts = noExt
    .split('/')
    .map(part => {
      if (part === 'index') return null
      if (part.startsWith('[') && part.endsWith(']'))
        return `{${part.slice(1, -1)}}`
      return part
    })
    .filter(Boolean)
  return '/api/' + parts.join('/')
}

function extractPathParams(routePath: string): string[] {
  return [...routePath.matchAll(/\{(\w+)\}/g)].map(m => m[1])
}

// ─── JSDoc annotations ────────────────────────────────────────────────────────

function parseJSDoc(fn: import('ts-morph').FunctionDeclaration): JSDocInfo {
  const result: JSDocInfo = {}
  try {
    for (const doc of fn.getJsDocs()) {
      const desc = doc.getDescription().trim()
      if (desc) {
        // Standard convention: first line = summary, remaining lines = description.
        const lines = desc
          .split('\n')
          .map(l => l.trim())
          .filter(Boolean)
        result.summary = lines[0]
        if (lines.length > 1) result.description = lines.slice(1).join('\n')
      }
      for (const tag of doc.getTags()) {
        if (tag.getTagName() === 'deprecated') result.deprecated = true
      }
    }
  } catch {
    /* JSDoc parsing is best-effort */
  }
  return result
}

// ─── Security detection ───────────────────────────────────────────────────────

function requiresAuth(fn: import('ts-morph').FunctionDeclaration): boolean {
  return fn
    .getDescendantsOfKind(SyntaxKind.PropertyAccessExpression)
    .some(
      pa => pa.getExpression().getText() === 'req' && pa.getName() === 'user'
    )
}

// ─── operationId auto-generation ─────────────────────────────────────────────

function makeOperationId(method: string, routePath: string): string {
  // e.g. GET /api/folder/{id} → get-folder-id
  const pathPart = routePath
    .replace(/^\/api\//, '')
    .replace(/\{(\w+)\}/g, '$1')
    .replace(/\//g, '-')
  return pathPart ? `${method}-${pathPart}` : method
}

// ─── Constants ────────────────────────────────────────────────────────────────

const HTTP_METHOD_NAMES = new Set(['get', 'post', 'put', 'patch', 'del'])

const STATUS_DESCRIPTIONS: Record<string, string> = {
  '200': 'OK',
  '201': 'Created',
  '204': 'No Content',
  '400': 'Bad Request',
  '401': 'Unauthorized',
  '403': 'Forbidden',
  '404': 'Not Found',
  '409': 'Conflict',
  '418': 'Wrong token type',
  '500': 'Internal Server Error'
}

// ─── Build OpenAPI spec ───────────────────────────────────────────────────────

const project = new Project({ tsConfigFilePath: './tsconfig.json' })
const namedTypes = new Map<string, () => JsonSchema>()

const spec: OpenAPISpec = {
  openapi: '3.0.3',
  info: {
    title: 'BluFiles API',
    version: '1.0.0',
    description:
      'BluFiles Management API - auto-generated from source code annotations'
  },
  servers: [
    {
      url: '/'
    }
  ],
  components: {
    schemas: {},
    securitySchemes: {
      Token: {
        type: 'apiKey',
        in: 'header',
        name: 'Authorization',
        description:
          'Format: `token <value>`. Types: `user` (session) or `uploader` (API token).'
      }
    }
  },
  paths: {}
}

for (const file of project.getSourceFiles('src/routes/**/*.ts')) {
  const routePath = filePathToRoute(file.getFilePath())
  const pathParams = extractPathParams(routePath)
  const pathObj: Record<string, unknown> = {}

  for (const fn of file.getFunctions()) {
    if (!fn.isExported()) continue
    const fnName = fn.getName()?.toLowerCase()
    if (!fnName || !HTTP_METHOD_NAMES.has(fnName)) continue

    const httpMethod = fnName === 'del' ? 'delete' : fnName
    const jsdoc = parseJSDoc(fn)
    const auth = requiresAuth(fn)

    // Detect .safeParse(req.body) and .safeParse(req.query)
    let bodySchema: JsonSchema | null = null
    let querySchema: JsonSchema | null = null

    for (const call of fn.getDescendantsOfKind(SyntaxKind.CallExpression)) {
      const expr = call.getExpression()
      if (!expr.isKind(SyntaxKind.PropertyAccessExpression)) continue
      if (expr.getName() !== 'safeParse') continue
      const [arg] = call.getArguments()
      if (!arg) continue
      const argText = arg.getText()
      if (argText !== 'req.body' && argText !== 'req.query') continue
      const schemaName = expr.getExpression().getText().trim()
      const resolved = getZodJsonSchema(schemaName)
      if (argText === 'req.body' && !bodySchema) bodySchema = resolved
      if (argText === 'req.query' && !querySchema) querySchema = resolved
    }

    // Detect responses from sendStatus / res.json / res.send
    const responses: Record<string, unknown> = {}

    for (const call of fn.getDescendantsOfKind(SyntaxKind.CallExpression)) {
      const expr = call.getExpression()
      if (!expr.isKind(SyntaxKind.PropertyAccessExpression)) continue
      const callee = expr.getName()

      if (callee === 'sendStatus') {
        const [arg] = call.getArguments()
        if (!arg) continue
        const status = arg.getText()
        if (!responses[status]) {
          responses[status] = {
            description: STATUS_DESCRIPTIONS[status] ?? 'Response'
          }
        }
      } else if (callee === 'json' || callee === 'send') {
        if (responses['200']) continue
        const [arg] = call.getArguments()
        const schema = arg
          ? typeToJsonSchema(arg.getType(), new Set(), namedTypes)
          : undefined
        responses['200'] = {
          description: 'OK',
          ...(schema ? { content: { 'application/json': { schema } } } : {})
        }
      }
    }

    // Build parameters array (path + query)
    const parameters: unknown[] = pathParams.map(p => ({
      name: p,
      in: 'path',
      required: true,
      schema: { type: 'string' }
    }))

    if (querySchema) {
      const qs = querySchema as any
      const required: string[] = qs.required ?? []
      if (qs.properties) {
        for (const [qName, qSchema] of Object.entries<JsonSchema>(
          qs.properties
        )) {
          parameters.push({
            name: qName,
            in: 'query',
            required: required.includes(qName),
            schema: qSchema
          })
        }
      }
    }

    // Assemble the operation object
    const operation: Record<string, unknown> = {}
    operation.operationId = makeOperationId(httpMethod, routePath)
    if (jsdoc.summary) operation.summary = jsdoc.summary
    if (jsdoc.description) operation.description = jsdoc.description
    if (jsdoc.deprecated) operation.deprecated = true
    if (auth) operation.security = [{ Token: [] }]
    if (parameters.length) operation.parameters = parameters
    if (bodySchema) {
      operation.requestBody = {
        required: true,
        content: { 'application/json': { schema: bodySchema } }
      }
    }
    operation.responses = Object.keys(responses).length
      ? responses
      : { '200': { description: 'OK' } }

    pathObj[httpMethod] = operation
  }

  if (Object.keys(pathObj).length) spec.paths[routePath] = pathObj
}

// Resolve named type lazy builders → components.schemas
for (const [name, build] of namedTypes) {
  spec.components.schemas[name] = build()
}

// Write output
const outPath = process.argv[2] ?? 'docs/src/assets/openapi.json'
fs.writeFileSync(outPath, JSON.stringify(spec, null, 2))
process.stderr.write(
  `Written ${Object.keys(spec.paths).length} paths, ` +
    `${Object.keys(spec.components.schemas).length} schemas → ${outPath}\n`
)
