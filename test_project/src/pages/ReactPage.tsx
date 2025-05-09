import React, { useEffect, useRef, useState } from "react"
import { ForesightManager } from "../../../src/ForesightManager/ForesightManager"
import type { JSX } from "react/jsx-dev-runtime"

const ReactPage: React.FC = () => {
  // Start with debug mode on by default
  const [debugMode, setDebugMode] = useState(true)
  const [notification, setNotification] = useState("")
  const [performanceResult, setPerformanceResult] = useState("")
  const [elementsGenerated, setElementsGenerated] = useState<JSX.Element[]>([])

  const box1Ref = useRef<HTMLDivElement>(null)
  const box2Ref = useRef<HTMLDivElement>(null)
  const box3Ref = useRef<HTMLDivElement>(null)
  const unregisterFuncsRef = useRef<(() => void)[]>([])
  const manager = ForesightManager.instance
  // Initialize ForesightManager
  useEffect(() => {
    // Box 1 - standard hitSlop
    let box1CallbackCount = 0
    let unregisterBox1: (() => void) | null = null

    if (box1Ref.current) {
      unregisterBox1 = manager.register(
        box1Ref.current,
        () => {
          box1CallbackCount++
          console.log(`Box 1 callback triggered! Count: ${box1CallbackCount}`)
          showNotification(`Box 1 callback triggered! Count: ${box1CallbackCount}`)
        },
        50 // 50px hitSlop in all directions
      )
      if (unregisterBox1) unregisterFuncsRef.current.push(unregisterBox1)
    }

    // Box 2 - custom hitSlop rectangle
    let box2CallbackCount = 0
    let unregisterBox2: (() => void) | null = null

    if (box2Ref.current) {
      unregisterBox2 = manager.register(
        box2Ref.current,
        () => {
          box2CallbackCount++
          console.log(`Box 2 callback triggered! Count: ${box2CallbackCount}`)
          showNotification(`Box 2 callback triggered! Count: ${box2CallbackCount}`)
        },
        { top: 20, right: 100, bottom: 20, left: 100 } // Custom hitSlop
      )
      if (unregisterBox2) unregisterFuncsRef.current.push(unregisterBox2)
    }

    // Box 3 - no hitSlop
    let box3CallbackCount = 0
    let unregisterBox3: (() => void) | null = null

    if (box3Ref.current) {
      unregisterBox3 = manager.register(box3Ref.current, () => {
        box3CallbackCount++
        console.log(`Box 3 callback triggered! Count: ${box3CallbackCount}`)
        showNotification(`Box 3 callback triggered! Count: ${box3CallbackCount}`)
      })
      if (unregisterBox3) unregisterFuncsRef.current.push(unregisterBox3)
    }

    // Cleanup function
    return () => {
      console.log("ReactPage: Cleaning up ForesightManager registrations")
      unregisterFuncsRef.current.forEach((unregister) => {
        try {
          unregister()
        } catch (err) {
          console.error("ReactPage: Error unregistering element", err)
        }
      })
      unregisterFuncsRef.current = []
    }
  }, [debugMode])

  // Update debug mode
  useEffect(() => {
    manager.alterGlobalSettings({ debug: debugMode })
  }, [debugMode])

  // Show notification
  const showNotification = (message: string) => {
    setNotification(message)

    // Clear after 2 seconds
    setTimeout(() => {
      setNotification((prev) => (prev === message ? "" : prev))
    }, 2000)
  }

  // Performance test handler
  const handleGenerateElements = () => {
    const startTime = performance.now()

    // Clean up any previously generated elements
    unregisterFuncsRef.current.forEach((unregister) => {
      try {
        unregister()
      } catch (err) {
        console.error("Error unregistering element", err)
      }
    })
    unregisterFuncsRef.current = []

    // Generate new elements
    const manager = ForesightManager.instance
    const newElements: JSX.Element[] = []

    for (let i = 0; i < 50; i++) {
      const element = (
        <div
          key={`perf-${i}`}
          className="w-10 h-10 flex justify-center items-center text-xs text-gray-800 rounded"
          style={{ backgroundColor: `hsl(${(i * 7) % 360}, 70%, 80%)` }}
          ref={(el) => {
            if (el) {
              const unregister = manager.register(
                el,
                () => showNotification(`Element ${i + 1} triggered`),
                5 // 5px hitSlop
              )
              unregisterFuncsRef.current.push(unregister)
            }
          }}
        >
          {i + 1}
        </div>
      )

      newElements.push(element)
    }

    setElementsGenerated(newElements)

    const endTime = performance.now()
    const duration = endTime - startTime

    setPerformanceResult(`Generated and registered 50 elements in ${duration.toFixed(2)}ms`)
  }

  return (
    <div className="p-5 font-sans">
      <h1 className="text-2xl font-bold mb-3">ForesightManager - React Example</h1>
      <p className="mb-4">
        Hover over the colored boxes to test the ForesightManager functionality.
      </p>

      <div className="mb-5 p-4 bg-gray-100 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">ForesightManager Settings</h3>

        <div className="mb-3">
          <button
            onClick={() => setDebugMode(!debugMode)}
            className={`px-4 py-2 font-medium rounded text-white ${
              debugMode ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            {debugMode ? "Disable Debug Mode" : "Enable Debug Mode"}
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Demo Elements</h3>

        <div className="flex flex-wrap gap-10 justify-center">
          <div
            ref={box1Ref}
            className="w-36 h-36 bg-green-500 flex flex-col justify-center items-center text-white font-bold rounded"
          >
            Box 1<br />
            <span className="text-xs font-normal">50px HitSlop</span>
          </div>

          <div
            ref={box2Ref}
            className="w-36 h-36 bg-blue-500 flex flex-col justify-center items-center text-white font-bold rounded"
          >
            Box 2<br />
            <span className="text-xs font-normal">Custom HitSlop</span>
          </div>

          <div
            ref={box3Ref}
            className="w-36 h-36 bg-red-500 flex flex-col justify-center items-center text-white font-bold rounded"
          >
            Box 3<br />
            <span className="text-xs font-normal">No HitSlop</span>
          </div>
        </div>

        {/* Notification area */}
        <div className="mt-5 p-3 bg-gray-100 rounded h-8 font-mono">{notification}</div>
      </div>

      {/* Performance Test Section */}
      <div className="mt-8 pt-5 border-t border-gray-200">
        <h3 className="text-lg font-semibold mb-2">Performance Test</h3>
        <p className="mb-3">
          Generate multiple elements with 5px hitSlop to test ForesightManager performance
        </p>

        <button
          onClick={handleGenerateElements}
          className="px-4 py-2 font-medium rounded text-white bg-purple-600 hover:bg-purple-700"
        >
          Generate 50 Elements
        </button>

        <div className="mt-3 font-mono">{performanceResult}</div>

        {/* Container for generated elements */}
        <div className="flex flex-wrap gap-1 mt-4 justify-center">{elementsGenerated}</div>
      </div>

      <div className="mt-8 pt-5 border-t border-gray-200">
        <h3 className="text-lg font-semibold mb-2">How ForesightManager Works:</h3>
        <ul className="list-disc pl-5">
          <li className="mb-2">
            The ForesightManager tracks mouse movement and predicts its trajectory
          </li>
          <li className="mb-2">
            When your mouse is predicted to enter an element's hitSlop area, the callback triggers
          </li>
          <li className="mb-2">
            Enable Debug Mode to visualize the hitSlop areas and trajectory prediction
          </li>
          <li className="mb-2">
            Adjust the settings to see how they affect the prediction behavior
          </li>
        </ul>
      </div>
    </div>
  )
}

export default ReactPage
