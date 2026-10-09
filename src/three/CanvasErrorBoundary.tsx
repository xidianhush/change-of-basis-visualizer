import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}
interface State {
  hasError: boolean
  message: string
}

/** 捕获 WebGL / Canvas 初始化错误，避免整个应用被拖垮 */
export default class CanvasErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="mb-1 font-mono text-xs text-amber-500/80">
              WebGL 不可用
            </div>
            <div className="text-[10px] leading-snug text-slate-600">
              当前环境无法创建 WebGL 上下文，
              <br />
              请在支持硬件加速的浏览器中查看。
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
