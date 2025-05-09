import { ForesightManager } from "../../../src/ForesightManager/ForesightManager"

/**
 * JavaScriptPage - Demonstrates the usage of ForesightManager in JavaScript
 */
export default class JavaScriptPage {
  constructor() {
    // Create and initialize manager with debug mode on by default
    this.manager = ForesightManager.initialize({ debug: true })
    this.unregisterFunctions = []
    this.initialized = false
    this.debugEnabled = true // Debug is on by default

    // Create page container
    this.container = document.createElement("div")
    this.container.className = "p-5 font-sans"

    this.render()
  }

  /**
   * Render the page content
   */
  render() {
    // Page header
    const header = document.createElement("header")

    const title = document.createElement("h1")
    title.className = "text-2xl font-bold mb-3"
    title.textContent = "ForesightManager - JavaScript Example"
    header.appendChild(title)

    const subtitle = document.createElement("p")
    subtitle.className = "mb-4"
    subtitle.textContent =
      "Move your mouse around the elements below to see the ForesightManager in action"
    header.appendChild(subtitle)

    this.container.appendChild(header)

    // Create controls
    this.createControls()

    // Create demo section
    this.createDemoSection()

    // Create performance section
    this.createPerformanceSection()

    // Add instructions
    this.createInstructions()
  }

  /**
   * Create control panel
   */
  createControls() {
    const controls = document.createElement("div")
    controls.className = "mb-5 p-4 bg-gray-100 rounded-lg"

    const controlsTitle = document.createElement("h3")
    controlsTitle.className = "text-lg font-semibold mb-2"
    controlsTitle.textContent = "ForesightManager Controls"
    controls.appendChild(controlsTitle)

    // Toggle debug mode
    const debugToggle = document.createElement("button")
    debugToggle.textContent = "Disable Debug Mode" // Initially debug is on
    debugToggle.className =
      "px-4 py-2 font-medium rounded text-white bg-red-500 hover:bg-red-600 mb-3"

    debugToggle.addEventListener("click", () => {
      this.debugEnabled = !this.debugEnabled
      ForesightManager.initialize({ debug: this.debugEnabled })

      debugToggle.textContent = this.debugEnabled ? "Disable Debug Mode" : "Enable Debug Mode"

      debugToggle.className = this.debugEnabled
        ? "px-4 py-2 font-medium rounded text-white bg-red-500 hover:bg-red-600 mb-3"
        : "px-4 py-2 font-medium rounded text-white bg-blue-500 hover:bg-blue-600 mb-3"
    })

    controls.appendChild(debugToggle)
    this.container.appendChild(controls)
  }

  /**
   * Create demo section with three test elements
   */
  createDemoSection() {
    const demoSection = document.createElement("div")

    const demoTitle = document.createElement("h3")
    demoTitle.className = "text-lg font-semibold mb-2"
    demoTitle.textContent = "Demo Elements"
    demoSection.appendChild(demoTitle)

    const elementsContainer = document.createElement("div")
    elementsContainer.className = "flex flex-wrap gap-10 justify-center"

    // Element 1 - with number hitSlop
    const element1 = this.createBox("bg-green-500", "Element 1", "50px HitSlop")
    const unregister1 = this.manager.register(
      element1,
      () => {
        console.log("Element 1 callback triggered!")
        this.showNotification("Element 1 callback triggered!")
      },
      50 // 50px hitSlop
    )
    this.unregisterFunctions.push(unregister1)
    elementsContainer.appendChild(element1)

    // Element 2 - with rect hitSlop
    const element2 = this.createBox(
      "bg-blue-500",
      "Element 2",
      "Custom HitSlop (20 top/bottom, 100 left/right)"
    )
    const unregister2 = this.manager.register(
      element2,
      () => {
        console.log("Element 2 callback triggered!")
        this.showNotification("Element 2 callback triggered!")
      },
      {
        top: 20,
        right: 100,
        bottom: 20,
        left: 100,
      }
    )
    this.unregisterFunctions.push(unregister2)
    elementsContainer.appendChild(element2)

    // Element 3 - no hitSlop
    const element3 = this.createBox("bg-red-500", "Element 3", "No HitSlop")
    const unregister3 = this.manager.register(element3, () => {
      console.log("Element 3 callback triggered!")
      this.showNotification("Element 3 callback triggered!")
    })
    this.unregisterFunctions.push(unregister3)
    elementsContainer.appendChild(element3)

    demoSection.appendChild(elementsContainer)
    this.container.appendChild(demoSection)

    // Add notification area
    this.notificationArea = document.createElement("div")
    this.notificationArea.className = "mt-5 p-3 bg-gray-100 rounded h-8 font-mono"

    demoSection.appendChild(this.notificationArea)
  }

  /**
   * Create a simple performance test section
   */
  createPerformanceSection() {
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
        element.className = `w-10 h-10 flex justify-center items-center text-xs text-gray-800 rounded`
        element.style.backgroundColor = `hsl(${(i * 7) % 360}, 70%, 80%)`
        element.textContent = i + 1

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
    })

    perfSection.appendChild(generateButton)
    perfSection.appendChild(resultsDisplay)

    this.container.appendChild(perfSection)
  }

  /**
   * Create a colored box element
   */
  createBox(colorClass, label, description) {
    const box = document.createElement("div")
    box.className = `w-36 h-36 ${colorClass} flex flex-col justify-center items-center text-white font-bold rounded`

    const labelDiv = document.createElement("div")
    labelDiv.textContent = label
    box.appendChild(labelDiv)

    const descDiv = document.createElement("div")
    descDiv.className = "text-xs font-normal"
    descDiv.textContent = description
    box.appendChild(descDiv)

    return box
  }

  /**
   * Create instructions section
   */
  createInstructions() {
    const instructionsSection = document.createElement("div")
    instructionsSection.className = "mt-8 pt-5 border-t border-gray-200"

    const instructionsTitle = document.createElement("h3")
    instructionsTitle.className = "text-lg font-semibold mb-2"
    instructionsTitle.textContent = "How ForesightManager Works"
    instructionsSection.appendChild(instructionsTitle)

    const instructionsList = document.createElement("ul")
    instructionsList.className = "list-disc pl-5"

    const instructions = [
      "ForesightManager predicts where your mouse is headed based on its trajectory",
      "When your mouse is predicted to enter an element's hitSlop area, the callback is triggered",
      "The hitSlop is an expanded area around the element that detects the mouse earlier",
      "Enable Debug Mode to visualize hitSlop areas and trajectory prediction",
      "Adjust the trajectory settings to see how they affect prediction behavior",
    ]

    instructions.forEach((text) => {
      const item = document.createElement("li")
      item.className = "mb-2"
      item.textContent = text
      instructionsList.appendChild(item)
    })

    instructionsSection.appendChild(instructionsList)
    this.container.appendChild(instructionsSection)
  }

  /**
   * Display a notification
   */
  showNotification(message) {
    this.notificationArea.textContent = message

    // Clear after 2 seconds
    setTimeout(() => {
      if (this.notificationArea.textContent === message) {
        this.notificationArea.textContent = ""
      }
    }, 2000)
  }

  /**
   * Initialize the page
   */
  initialize() {
    if (this.initialized) {
      return
    }

    // Find the correct container
    const pageContainer = document.getElementById("javascript-page-container")
    if (pageContainer) {
      // Clear container first
      if (pageContainer.firstChild) {
        pageContainer.innerHTML = ""
      }

      pageContainer.appendChild(this.container)
      this.initialized = true
    } else {
      console.error("JavaScriptPage: Could not find javascript-page-container element")
    }
  }

  /**
   * Clean up resources
   */
  cleanup() {
    // Unregister all elements
    this.unregisterFunctions.forEach((unregister) => {
      try {
        unregister()
      } catch (err) {
        console.error("JavaScriptPage: Error unregistering element", err)
      }
    })
    this.unregisterFunctions = []

    // Remove from DOM
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container)
    }

    this.initialized = false
  }
}
