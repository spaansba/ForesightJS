/**
 * ForesightManager JavaScript Test File
 * This file tests the core functionality of the ForesightManager
 */

import { ForesightManager } from "../../../src/ForesightManager/ForesightManager"

/**
 * Test basic initialization of ForesightManager
 */
function testInitialization() {
  console.log("=== Testing ForesightManager Initialization ===")

  // Test default initialization
  const manager1 = ForesightManager.initialize()
  console.log("Default initialization successful:", manager1 instanceof ForesightManager)

  // Test custom initialization
  const customProps = {
    positionHistorySize: 8,
    trajectoryPredictionTime: 75,
    enableMouseTrajectory: true,
    debug: false,
  }

  const manager2 = ForesightManager.initialize(customProps)
  console.log("Custom initialization successful:", manager2 instanceof ForesightManager)

  // Test singleton pattern
  const manager3 = ForesightManager.getInstance()
  console.log("Singleton pattern working:", manager1 === manager2 && manager2 === manager3)
}

/**
 * Test element registration functionality
 */
function testElementRegistration() {
  console.log("\n=== Testing Element Registration ===")

  const manager = ForesightManager.getInstance()

  // Create a test element
  const testElement = document.createElement("div")
  testElement.id = "test-element-js"
  testElement.style.width = "200px"
  testElement.style.height = "200px"
  testElement.style.backgroundColor = "lightblue"
  testElement.textContent = "Test Element (JS)"
  document.body.appendChild(testElement)

  // Test callback counter
  let callbackCount = 0

  // Register element with default hitslop
  const unregister = manager.register(testElement, () => {
    callbackCount++
    console.log("Callback triggered! Count:", callbackCount)
  })

  console.log("Element registered successfully")

  // Create button to test unregistration
  const unregisterButton = document.createElement("button")
  unregisterButton.textContent = "Unregister Element (JS)"
  unregisterButton.style.marginTop = "10px"
  unregisterButton.addEventListener("click", () => {
    unregister()
    console.log("Element unregistered")
  })
  document.body.appendChild(unregisterButton)
}

/**
 * Test trajectory settings configuration
 */
function testTrajectorySettings() {
  console.log("\n=== Testing Trajectory Settings ===")

  const manager = ForesightManager.getInstance()

  // Create UI for adjusting trajectory settings
  const settingsContainer = document.createElement("div")
  settingsContainer.style.marginTop = "20px"

  // History size slider
  const historyLabel = document.createElement("label")
  historyLabel.textContent = "Position History Size (JS): "
  const historyInput = document.createElement("input")
  historyInput.type = "range"
  historyInput.min = "2"
  historyInput.max = "20"
  historyInput.value = "6"
  historyInput.addEventListener("change", () => {
    manager.setTrajectorySettings({
      historySize: parseInt(historyInput.value),
    })
    console.log(`Updated history size to: ${historyInput.value}`)
  })

  // Prediction time slider
  const predictionLabel = document.createElement("label")
  predictionLabel.textContent = "Trajectory Prediction Time (ms) (JS): "
  const predictionInput = document.createElement("input")
  predictionInput.type = "range"
  predictionInput.min = "10"
  predictionInput.max = "200"
  predictionInput.value = "50"
  predictionInput.addEventListener("change", () => {
    manager.setTrajectorySettings({
      predictionTime: parseInt(predictionInput.value),
    })
    console.log(`Updated prediction time to: ${predictionInput.value}ms`)
  })

  // Toggle trajectory
  const toggleLabel = document.createElement("label")
  toggleLabel.textContent = "Enable Mouse Trajectory (JS): "
  const toggleInput = document.createElement("input")
  toggleInput.type = "checkbox"
  toggleInput.checked = true
  toggleInput.addEventListener("change", () => {
    manager.setTrajectorySettings({
      enabled: toggleInput.checked,
    })
    console.log(`Trajectory enabled: ${toggleInput.checked}`)
  })

  // Add all elements to settings container
  settingsContainer.appendChild(historyLabel)
  settingsContainer.appendChild(historyInput)
  settingsContainer.appendChild(document.createElement("br"))
  settingsContainer.appendChild(predictionLabel)
  settingsContainer.appendChild(predictionInput)
  settingsContainer.appendChild(document.createElement("br"))
  settingsContainer.appendChild(toggleLabel)
  settingsContainer.appendChild(toggleInput)

  document.body.appendChild(settingsContainer)
}

/**
 * Test debug mode functionality
 */
function testDebugMode() {
  console.log("\n=== Testing Debug Mode (JS) ===")

  // Create debug toggle button
  const debugButton = document.createElement("button")
  debugButton.textContent = "Toggle Debug Mode (JS)"
  debugButton.style.marginTop = "20px"

  let debugEnabled = false

  debugButton.addEventListener("click", () => {
    debugEnabled = !debugEnabled
    ForesightManager.initialize({ debug: debugEnabled })
    console.log(`Debug mode ${debugEnabled ? "enabled" : "disabled"}`)
  })

  document.body.appendChild(debugButton)
}

/**
 * Test hitslop configuration
 */
function testHitSlop() {
  console.log("\n=== Testing HitSlop Configuration (JS) ===")

  const manager = ForesightManager.getInstance()

  // Create test elements with different hitslop configurations
  const createTestElement = (id, hitSlop) => {
    const element = document.createElement("div")
    element.id = id
    element.style.width = "100px"
    element.style.height = "100px"
    element.style.backgroundColor =
      id === "element1-js" ? "lightgreen" : id === "element2-js" ? "lightcoral" : "lightyellow"
    element.style.margin = "20px"
    element.style.display = "inline-block"
    element.textContent = id

    document.body.appendChild(element)

    // Register with ForesightManager
    manager.register(element, () => console.log(`${id} callback triggered!`), hitSlop)

    return element
  }

  // Element with number hitslop
  createTestElement("element1-js", 50)

  // Element with rect hitslop
  createTestElement("element2-js", { top: 20, right: 100, bottom: 20, left: 100 })

  // Element with no hitslop
  createTestElement("element3-js", undefined)

  console.log("Created test elements with different hitslop configurations")
}

/**
 * Test performance monitoring
 */
function testPerformance() {
  console.log("\n=== Testing Performance (JS) ===")

  // Create a performance testing section
  const perfContainer = document.createElement("div")
  perfContainer.style.marginTop = "30px"
  perfContainer.style.padding = "15px"
  perfContainer.style.border = "1px solid #ccc"

  const perfTitle = document.createElement("h3")
  perfTitle.textContent = "Performance Testing"
  perfContainer.appendChild(perfTitle)

  const perfDescription = document.createElement("p")
  perfDescription.textContent = "Create multiple elements to test ForesightManager performance"
  perfContainer.appendChild(perfDescription)

  // Create button to generate elements
  const generateButton = document.createElement("button")
  generateButton.textContent = "Generate 50 Elements"
  generateButton.addEventListener("click", () => {
    const startTime = performance.now()

    const manager = ForesightManager.getInstance()
    const elementsContainer = document.createElement("div")
    elementsContainer.style.marginTop = "10px"
    elementsContainer.style.display = "flex"
    elementsContainer.style.flexWrap = "wrap"

    // Generate multiple elements
    for (let i = 0; i < 50; i++) {
      const element = document.createElement("div")
      element.style.width = "50px"
      element.style.height = "50px"
      element.style.margin = "5px"
      element.style.backgroundColor = `hsl(${(i * 7) % 360}, 70%, 80%)`

      // Register with ForesightManager
      manager.register(element, () => console.log(`Element ${i} triggered`), 10)

      elementsContainer.appendChild(element)
    }

    perfContainer.appendChild(elementsContainer)

    const endTime = performance.now()
    const elapsedTime = endTime - startTime

    const resultText = document.createElement("p")
    resultText.textContent = `Generated and registered 50 elements in ${elapsedTime.toFixed(2)}ms`
    perfContainer.appendChild(resultText)

    console.log(`Performance test completed in ${elapsedTime.toFixed(2)}ms`)
  })

  perfContainer.appendChild(generateButton)
  document.body.appendChild(perfContainer)
}

/**
 * Run all tests
 */
function runAllTests() {
  // Create test container
  const testContainer = document.createElement("div")
  testContainer.style.padding = "20px"
  testContainer.style.fontFamily = "Arial, sans-serif"

  const heading = document.createElement("h1")
  heading.textContent = "ForesightManager JavaScript Tests"
  testContainer.appendChild(heading)

  const description = document.createElement("p")
  description.textContent =
    "Interact with the elements below to test ForesightManager functionality."
  testContainer.appendChild(description)

  document.body.appendChild(testContainer)

  // Run all test functions
  testInitialization()
  testElementRegistration()
  testTrajectorySettings()
  testDebugMode()
  testHitSlop()
  testPerformance()

  console.log("\nAll tests initialized! Interact with the elements to see results.")
}

// Run tests when the DOM is loaded
document.addEventListener("DOMContentLoaded", runAllTests)

// Export test functions for external use
export {
  testInitialization,
  testElementRegistration,
  testTrajectorySettings,
  testDebugMode,
  testHitSlop,
  testPerformance,
  runAllTests,
}
