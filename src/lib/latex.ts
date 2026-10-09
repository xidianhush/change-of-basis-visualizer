import { math, type Matrix } from './matrix'

export class ParseError extends Error {}

/** 将单元格内的常见 LaTeX 表达式转换为 mathjs 可求值的字符串 */
function preprocessExpr(raw: string): string {
  let s = raw
  // 反复处理可能嵌套的 \frac{a}{b} -> (a)/(b)
  const fracRe = /\\frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/
  while (fracRe.test(s)) s = s.replace(fracRe, '($1)/($2)')
  // \sqrt{x} -> sqrt(x)
  s = s.replace(/\\sqrt\s*\{([^{}]*)\}/g, 'sqrt($1)')
  // \pi -> pi
  s = s.replace(/\\pi/g, 'pi')
  // LaTeX 间距命令
  s = s.replace(/\\[,;! ]/g, '')
  return s.trim()
}

/**
 * 解析 LaTeX 矩阵（bmatrix / pmatrix / matrix），返回二维数值数组。
 * 仅接受 2×2 或 3×3 方阵。
 */
export function parseLatexMatrix(input: string): Matrix {
  const text = input ?? ''
  const envMatch = text.match(
    /\\begin\s*\{(?:bmatrix|pmatrix|matrix)\}([\s\S]*?)\\end\s*\{(?:bmatrix|pmatrix|matrix)\}/,
  )
  const body = envMatch ? envMatch[1] : text

  // LaTeX 行分隔符为两个反斜杠
  const rawRows = body
    .split(/\\{2}/)
    .map((r) => r.trim())
    .filter((r) => r.length > 0)

  if (rawRows.length === 0) {
    throw new ParseError('未检测到矩阵行，请使用 bmatrix 环境，例如 \\begin{bmatrix} 1 & 0 \\\\ 0 & 1 \\end{bmatrix}')
  }

  const result: Matrix = []
  let width = -1

  for (const row of rawRows) {
    const cells = row.split('&').map((c) => c.trim())
    const values = cells.map((cell) => {
      const expr = preprocessExpr(cell)
      if (expr === '') throw new ParseError('存在空的矩阵元素')
      let value: number
      try {
        value = Number(math.evaluate(expr))
      } catch {
        throw new ParseError(`无法解析元素“${cell}”`)
      }
      if (!Number.isFinite(value)) throw new ParseError(`元素“${cell}”不是有限数值`)
      return value
    })

    if (width === -1) width = values.length
    else if (values.length !== width) throw new ParseError('矩阵各行的元素数量不一致')

    result.push(values)
  }

  const n = result.length
  if (width !== n) throw new ParseError('矩阵必须为方阵（行数 = 列数）')
  if (n !== 2 && n !== 3) throw new ParseError('仅支持 2×2 或 3×3 矩阵')
  return result
}

/** 数值显示格式化：消除浮点尾差，整数不带小数点，其余最多 4 位小数 */
export function formatNumber(x: number): string {
  if (Math.abs(x) < 1e-9) return '0'
  const rounded = Math.round(x)
  if (Math.abs(x - rounded) < 1e-7) return String(rounded)
  return x
    .toFixed(4)
    .replace(/0+$/, '')
    .replace(/\.$/, '')
}

/** 将数值矩阵转回 LaTeX bmatrix 字符串（供 KaTeX 渲染） */
export function matrixToLatex(m: Matrix | null | undefined): string {
  if (!m || m.length === 0) return '\\text{—}'
  const rows = m.map((row) => row.map(formatNumber).join(' & ')).join(' \\\\ ')
  return `\\begin{bmatrix} ${rows} \\end{bmatrix}`
}
