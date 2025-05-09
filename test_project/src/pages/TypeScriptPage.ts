import { ForesightManager } from "../../../src/ForesightManager/ForesightManager"

/**
 * Define the types locally instead of importing them
 */
type Rect = {
  top: number
  left: number
  right: number
  bottom: number
}

/**
 * TypeScriptPage - Demonstrates the usage of ForesightManager in TypeScript
 */
export default class TypeScriptPage {
  private manager: ForesightManager
  private container: HTMLElement
  private debugButton: HTMLButtonElement
  private debugEnabled: boolean = true // Debug mode enabled by default
  private unregisterFunctions: Array<() => void> = []
  private initialized: boolean = false
  // Initialize the notification area directly to fix TS2564 error
  private notificationArea: HTMLElement = document.createElement("div")

  constructor() {
    console.log("TypeScriptPage: Constructor called")

    // Create page container
    this.container = document.createElement("div")
    this.container.className = "p-5 font-sans"

    // Create page title
    const title = document.createElement("h1")
    title.className = "text-2xl font-bold mb-3"
    title.textContent = "ForesightManager - TypeScript Example"
    this.container.appendChild(title)

    // Create description
    const description = document.createElement("p")
    description.className = "mb-4"
    description.textContent = "This page demonstrates the ForesightManager in TypeScript."
    this.container.appendChild(description)

    // Initialize ForesightManager with debug enabled
    this.manager = ForesightManager.initialize({ debug: true })
    console.log("TypeScriptPage: ForesightManager initialized with debug mode enabled")

    // Create debug toggle button
    this.debugButton = document.createElement("button")
    this.debugButton.textContent = "Disable Debug Mode" // Initially debug is on
    this.debugButton.className =
      "px-4 py-2 font-medium rounded text-white bg-red-500 hover:bg-red-600"

    this.debugButton.addEventListener("click", this.toggleDebugMode.bind(this))

    // Create trajectory settings controls
    this.createTrajectoryControls()

    // Create test elements
    this.createDemoSection()

    // Create performance test section
    this.createPerformanceSection()

    // Create instructions
    this.createInstructions()
  }

  /**
   * Initialize the page
   */
  public initialize(): void {
    console.log("TypeScriptPage: Initialize method called")

    if (this.initialized) {
      console.log("TypeScriptPage: Already initialized, skipping")
      return
    }

    // Find the correct container
    const pageContainer = document.getElementById("typescript-page-container")
    if (pageContainer) {
      console.log("TypeScriptPage: Found container, appending content")

      // Make sure container is empty
      if (pageContainer.firstChild) {
        console.log("TypeScriptPage: Clearing existing content")
        pageContainer.innerHTML = ""
      }

      pageContainer.appendChild(this.container)
      this.initialized = true
      console.log("TypeScriptPage: Successfully initialized and appended to DOM")
      
      // Trigger a resize event after initialization to update element positions
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
        console.log("TypeScriptPage: Triggered resize event to update positions");
      }, 100);
    } else {
      console.error("TypeScriptPage: Could not find typescript-page-container element")
    }
  }

  /**
   * Toggle debug mode
   */
  private toggleDebugMode(): void {
    this.debugEnabled = !this.debugEnabled
    ForesightManager.initialize({ debug: this.debugEnabled })

    this.debugButton.textContent = this.debugEnabled ? "Disable Debug Mode" : "Enable Debug Mode"

    this.debugButton.className = this.debugEnabled
      ? "px-4 py-2 font-medium rounded text-white bg-red-500 hover:bg-red-600"
      : "px-4 py-2 font-medium rounded text-white bg-blue-500 hover:bg-blue-600"
    
    console.log(`TypeScriptPage: Debug mode ${this.debugEnabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Create trajectory settings controls
   */
  private createTrajectoryControls(): void {
    const controlsContainer = document.createElement("div")
    controlsContainer.className = "mb-5 p-4 bg-gray-100 rounded-lg"

    const controlsTitle = document.createElement("h3")
    controlsTitle.className = "text-lg font-semibold mb-2"
    controlsTitle.textContent = "ForesightManager Settings"
    controlsContainer.appendChild(controlsTitle)

    // Add debug button
    const debugContainer = document.createElement("div")
    debugContainer.className = "mb-3"
    debugContainer.appendChild(this.debugButton)
    controlsContainer.appendChild(debugContainer)

    this.container.appendChild(controlsContainer)
  }

  /**
   * Create demo section with test elements
   */
  private createDemoSection(): void {
    const demoSection = document.createElement("div")

    const demoTitle = document.createElement("h3")
    demoTitle.className = "text-lg font-semibold mb-2"
    demoTitle.textContent = "Demo Elements"
    demoSection.appendChild(demoTitle)

    const elementsContainer = document.createElement("div")
    elementsContainer.className = "flex flex-wrap gap-10 justify-center"

    // Create Element 1 - Number hitSlop
    const element1 = this.createBox("Element 1", "bg-green-500", "50px HitSlop")

    const unregister1 = this.manager.register(
      element1,
      () => {
        console.log("Element 1 callback triggered!")
        this.showNotification("Element 1 callback triggered!")
      },
      50
    )

    this.unregisterFunctions.push(unregister1)
    elementsContainer.appendChild(element1)

    // Create Element 2 - Rect hitSlop
    const element2 = this.createBox("Element 2", "bg-blue-500", "Custom HitSlop")

    const customHitSlop: Rect = {
      top: 20,
      right: 100,
      bottom: 20,
      left: 100,
    }

    const unregister2 = this.manager.register(
      element2,
      () => {
        console.log("Element 2 callback triggered!")
        this.showNotification("Element 2 callback triggered!")
      },
      customHitSlop
    )

    this.unregisterFunctions.push(unregister2)
    elementsContainer.appendChild(element2)

    // Create Element 3 - No hitSlop
    const element3 = this.createBox("Element 3", "bg-red-500", "No HitSlop")

    const unregister3 = this.manager.register(element3, () => {
      console.log("Element 3 callback triggered!")
      this.showNotification("Element 3 callback triggered!")
    })

    this.unregisterFunctions.push(unregister3)
    elementsContainer.appendChild(element3)

    demoSection.appendChild(elementsContainer)

    // Set up the notification area
    this.notificationArea.className = "mt-5 p-3 bg-gray-100 rounded h-8 font-mono"
    demoSection.appendChild(this.notificationArea)

    this.container.appendChild(demoSection)
  }

  /**
   * Create a performance test section
   */
  private createPerformanceSection(): void {
    const perfSection = document.createElement("div")
    perfSection.className = "mt-8 pt-5 border-t border-gray-200"

    const perfTitle = document.createElement("h3")
    perfTitle.className = "text-lg font-semibold mb-2"
    perfTitle.textContent = "Performance Test"
    perfSection.appendChild(perfTitle)

    const perfDesc = document.createElement("p")
    perfDesc.className = "mb-3"
    perfDesc.textContent =
      "Generate multiple elements with 5px hitSlop to test ForesightManager performance"
    perfSection.appendChild(perfDesc)

    const generateButton = document.createElement("button")
    generateButton.textContent = "Generate 50 Elements"
    generateButton.className =
      "px-4 py-2 font-medium rounded text-white bg-purple-600 hover:bg-purple-700"

    const resultsDisplay = document.createElement("div")
    resultsDisplay.className = "mt-3 font-mono"

    generateButton.addEventListener("click", () => {
      const startTime = performance.now()

      // Create container for elements
      const elementsGrid = document.createElement("div")
      elementsGrid.className = "flex flex-wrap gap-1 mt-4 justify-center"

      // Generate and register elements
      for (let i = 0; i < 50; i++) {
        const element = document.createElement("div")
        element.className =
          "w-10 h-10 flex justify-center items-center text-xs text-gray-800 rounded"
        element.style.backgroundColor = `hsl(${(i * 7) % 360}, 70%, 80%)`
        element.textContent = (i + 1).toString()

        // Register with ForesightManager (with 5px hitSlop)
        const unregister = this.manager.register(
          element,
          () => this.showNotification(`Element ${i + 1} triggered`),
          5 // 5px hitSlop
        )

        this.unregisterFunctions.push(unregister)
        elementsGrid.appendChild(element)
      }

      // Remove previous grid if exists
      const existingGrid = perfSection.querySelector(".elements-grid")
      if (existingGrid) {
        perfSection.removeChild(existingGrid)
      }

      elementsGrid.className = "elements-grid flex flex-wrap gap-1 mt-4 justify-center"
      perfSection.appendChild(elementsGrid)

      const endTime = performance.now()
      const duration = endTime - startTime

      resultsDisplay.textContent = `Generated and registered 50 elements in ${duration.toFixed(
        2
      )}ms`
      
      // Trigger a resize event to ensure correct hitbox positions for new elements
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
        console.log("TypeScriptPage: Triggered resize after generating elements");
      }, 50);
    })

    perfSection.appendChild(generateButton)
    perfSection.appendChild(resultsDisplay)

    this.container.appendChild(perfSection)
  }

  /**
   * Create a colored box element
   */
  private createBox(id: string, colorClass: string, description: string): HTMLDivElement {
    const box = document.createElement("div")
    box.id = id
    box.className = `w-36 h-36 ${colorClass} flex flex-col justify-center items-center text-white font-bold rounded`

    // Add text content
    const idText = document.createElement("div")
    idText.textContent = id
    box.appendChild(idText)

    const descText = document.createElement("div")
    descText.className = "text-xs font-normal"
    descText.textContent = description
    box.appendChild(descText)

    return box
  }

  /**
   * Display a notification
   */
  private showNotification(message: string): void {
    this.notificationArea.textContent = message

    // Clear after 2 seconds
    setTimeout(() => {
      if (this.notificationArea.textContent === message) {
        this.notificationArea.textContent = ""
      }
    }, 2000)
  }

  /**
   * Create instructions section
   */
  private createInstructions(): void {
    const instructionsContainer = document.createElement("div")
    instructionsContainer.className = "mt-8 pt-5 border-t border-gray-200"

    const instructionsTitle = document.createElement("h3")
    instructionsTitle.className = "text-lg font-semibold mb-2"
    instructionsTitle.textContent = "Instructions:"
    instructionsContainer.appendChild(instructionsTitle)

    const instructions = document.createElement("ul")
    instructions.className = "list-disc pl-5"

    const items = [
      "Move your mouse near the colored boxes to trigger the ForesightManager callbacks",
      "Enable Debug Mode to visualize hitSlop areas and trajectory prediction",
      "Adjust the trajectory settings to see how they affect prediction behavior",
      "Open the browser console to see the callback messages",
    ]

    items.forEach((text) => {
      const item = document.createElement("li")
      item.className = "mb-2"
      item.textContent = text
      instructions.appendChild(item)
    })

    instructionsContainer.appendChild(instructions)
    this.container.appendChild(instructionsContainer)
  }

  /**
   * Cleanup and unregister all elements
   */
  public cleanup(): void {
    console.log("TypeScriptPage: Cleanup method called")
    
    // Unregister all elements
    this.unregisterFunctions.forEach((unregister) => {
      try {
        unregister()
      } catch (err) {
        console.error("TypeScriptPage: Error unregistering element", err)
      }
    })
    this.unregisterFunctions = []

    // Remove container from DOM
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container)
    }

    this.initialized = false
    console.log("TypeScriptPage: Cleanup complete")
  }
}
