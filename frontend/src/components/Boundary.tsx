import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { name: string; children: ReactNode }
type State = { failed: boolean }

// Contains a crash to the one panel that caused it: the rest of the dashboard keeps working.
export class Boundary extends Component<Props, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`${this.props.name} crashed`, error, info.componentStack)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <section role="alert" className="flex flex-col items-start gap-2.5 rounded-panel border border-line bg-panel p-5">
        <h2 className="text-base font-bold">{this.props.name}</h2>
        <p className="text-sm text-alert">This panel hit an unexpected error. The rest of the dashboard still works.</p>
        <button
          type="button"
          onClick={() => this.setState({ failed: false })}
          className="min-h-9 rounded-lg pointer-coarse:min-h-11 border border-control-line bg-panel px-3 text-data font-medium transition-colors duration-150 hover:bg-track"
        >
          Try again
        </button>
      </section>
    )
  }
}
