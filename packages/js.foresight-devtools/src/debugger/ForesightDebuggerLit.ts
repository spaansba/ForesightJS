import { ControlPanel } from "../control_panel/ControlPanel"

export class ForesightDebuggerLit {
  public static initialize(options: Record<string, unknown> = {}): void {
    console.log("ForesightDebuggerLit initialized with options:", options)

    // Ensure the component is registered by referencing it
    // This forces the module to be evaluated and the decorator to run
    ControlPanel

    // Create the black square control panel
    const controlPanel = document.createElement("control-panel")
    document.body.appendChild(controlPanel)
    console.log("Black square control panel created and appended")
  }
}
