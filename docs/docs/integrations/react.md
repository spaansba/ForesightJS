---
sidebar_position: 2
---

# React

ForesightJS integrates smoothly with React applications, giving you the ability to predict user navigation intent and improve the perceived performance of your app. This guide shows how to implement ForesightJS with React Router for optimized navigation.

## Installation

Install ForesightJS and React Router (if not already installed):

```bash
npm install foresightjs react-router-dom
# or
yarn add foresightjs react-router-dom
# or
pnpm add foresightjs react-router-dom
```

## Setting Up ForesightManager

Initialize the ForesightManager at the root of your React application:

```jsx
// src/App.jsx or src/App.tsx
import { useEffect } from "react"
import { ForesightManager } from "foresightjs"
import { BrowserRouter as Router } from "react-router-dom"
import AppRoutes from "./AppRoutes"

function App() {
  useEffect(() => {
    // Initialize ForesightManager once when the app loads
    ForesightManager.initialize({
      positionHistorySize: 8,
      trajectoryPredictionTime: 80,
      defaultHitSlop: 20,
      debug: process.env.NODE_ENV === "development", // Optional: enable debug in development
    })
  }, [])

  return (
    <Router>
      <AppRoutes />
    </Router>
  )
}

export default App
```

## Creating a Smart Link Component

Create a custom link component that integrates ForesightJS with React Router:

```jsx
// src/components/SmartLink.jsx or src/components/SmartLink.tsx
import { useEffect, useRef } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ForesightManager } from "foresightjs"

function SmartLink({
  to,
  children,
  prefetchDistance = 30,
  className = "",
  prefetchFn = null,
  ...props
}) {
  const linkRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const linkElement = linkRef.current
    if (!linkElement) return

    // Define what happens when we predict the user will interact with this link
    const handlePredictedInteraction = () => {
      // If a custom prefetch function is provided, use it
      if (prefetchFn && typeof prefetchFn === "function") {
        prefetchFn(to)
        return
      }

      // Default behavior: Begin pre-loading the route data
      // This would typically be done with your data fetching solution
      // Here's a simple example using React Router's preload feature
      navigate.preload(to)

      console.log(`Prefetching route: ${to}`)
    }

    // Register with ForesightManager
    const unregister = ForesightManager.instance.register(
      linkElement,
      handlePredictedInteraction,
      prefetchDistance,
      `Link to ${to}` // Name for debugging
    )

    // Cleanup when component unmounts
    return () => {
      unregister()
    }
  }, [to, prefetchDistance, navigate, prefetchFn])

  return (
    <Link to={to} ref={linkRef} className={className} {...props}>
      {children}
    </Link>
  )
}

export default SmartLink
```

## Advanced Data Prefetching with React Router

React Router v6.4+ provides data loading capabilities that work well with ForesightJS. Here's how to implement advanced prefetching using the `loader` functionality:

```jsx
// src/components/SmartRouterLink.jsx or src/components/SmartRouterLink.tsx
import { useEffect, useRef } from "react"
import { Link, useFetcher } from "react-router-dom"
import { ForesightManager } from "foresightjs"
import { loaders } from "../routes"

function SmartRouterLink({
  to,
  children,
  prefetchDistance = 30,
  loaderKey = null,
  loaderParams = {},
  className = "",
  ...props
}) {
  const linkRef = useRef(null)
  const fetcher = useFetcher()

  useEffect(() => {
    const linkElement = linkRef.current
    if (!linkElement) return

    // Define what happens when we predict the user will interact with this link
    const handlePredictedInteraction = () => {
      // If a specific loader is provided, use it to prefetch data
      if (loaderKey && loaders[loaderKey]) {
        // Use React Router's fetcher to load the data in the background
        // without triggering a navigation
        fetcher.load({
          loader: loaders[loaderKey],
          params: loaderParams,
        })

        console.log(`Prefetching data for ${to} using ${loaderKey} loader`)
      } else {
        // Default: Just prefetch the route without specific data
        console.log(`Prefetching route: ${to}`)
      }
    }

    // Register with ForesightManager
    const unregister = ForesightManager.instance.register(
      linkElement,
      handlePredictedInteraction,
      prefetchDistance,
      `Link to ${to}` // Name for debugging
    )

    // Cleanup when component unmounts
    return () => {
      unregister()
    }
  }, [to, prefetchDistance, loaderKey, fetcher, loaderParams])

  return (
    <Link to={to} ref={linkRef} className={className} {...props}>
      {children}
    </Link>
  )
}

export default SmartRouterLink
```

## Usage Examples

### Basic Navigation

```jsx
import SmartLink from "./components/SmartLink"

function Navigation() {
  return (
    <nav>
      <SmartLink to="/">Home</SmartLink>
      <SmartLink to="/about" prefetchDistance={40}>
        About
      </SmartLink>
      <SmartLink to="/products">Products</SmartLink>
      <SmartLink to="/contact">Contact</SmartLink>
    </nav>
  )
}
```

### With Data Prefetching

```jsx
import SmartRouterLink from "./components/SmartRouterLink"

function ProductNavigation({ categories }) {
  return (
    <div className="product-nav">
      {categories.map((category) => (
        <SmartRouterLink
          key={category.id}
          to={`/category/${category.id}`}
          loaderKey="categoryProducts"
          loaderParams={{ categoryId: category.id }}
          prefetchDistance={50}
        >
          {category.name}
        </SmartRouterLink>
      ))}
    </div>
  )
}
```

## Using the useForeSight Hook

For more flexibility, you can create a custom hook to use ForesightJS with any React element:

```jsx
// src/hooks/useForeSight.js
import { useEffect, useRef } from "react"
import { ForesightManager } from "foresightjs"

export default function useForeSight({ onPredict, hitSlop = 30, debugName = "", enabled = true }) {
  const elementRef = useRef(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element || !enabled || typeof onPredict !== "function") {
      return
    }

    const unregister = ForesightManager.instance.register(element, onPredict, hitSlop, debugName)

    return () => {
      unregister()
    }
  }, [onPredict, hitSlop, debugName, enabled])

  return elementRef
}
```

### Using the Hook

```jsx
import useForeSight from "../hooks/useForeSight"

function LazyLoadedImage({ src, alt, width, height }) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [imageUrl, setImageUrl] = useState(null)

  const handlePredict = () => {
    if (!isLoaded) {
      const img = new Image()
      img.src = src
      setImageUrl(src)
      setIsLoaded(true)
    }
  }

  const imgContainerRef = useForeSight({
    onPredict: handlePredict,
    hitSlop: 100, // Large hit area for images
    debugName: `LazyImage: ${alt || "unnamed"}`,
    enabled: !isLoaded,
  })

  return (
    <div ref={imgContainerRef} className="lazy-image-container" style={{ width, height }}>
      {imageUrl ? <img src={imageUrl} alt={alt} /> : <div className="placeholder">Loading...</div>}
    </div>
  )
}
```

## Component Prefetching with React.lazy()

ForesightJS works great with code-splitting in React. You can prefetch lazily loaded components when the user's cursor suggests they'll navigate to a section:

```jsx
// Define lazy-loaded components
const ProductDetail = React.lazy(() => import("./pages/ProductDetail"))
const Cart = React.lazy(() => import("./pages/Cart"))

// Prefetch function
const prefetchComponent = (componentImport) => {
  // Trigger the dynamic import without rendering the component
  componentImport()
}

function NavMenu() {
  return (
    <nav>
      <SmartLink to="/">Home</SmartLink>

      <SmartLink
        to="/products/1234"
        prefetchFn={() => prefetchComponent(() => import("./pages/ProductDetail"))}
      >
        Featured Product
      </SmartLink>

      <SmartLink to="/cart" prefetchFn={() => prefetchComponent(() => import("./pages/Cart"))}>
        Shopping Cart
      </SmartLink>
    </nav>
  )
}
```

## Performance Optimization Tips

1. **Adjust hit slop based on UI density**:

   ```jsx
   // More space for main navigation items
   <SmartLink to="/dashboard" prefetchDistance={60}>Dashboard</SmartLink>

   // Less space for dense menus to avoid overlap
   <SmartLink to="/settings" prefetchDistance={20}>Settings</SmartLink>
   ```

2. **Prioritize resource prefetching**:

   ```jsx
   // For important but resource-heavy pages, use larger prediction areas
   <SmartLink
     to="/product-gallery"
     prefetchDistance={80}
     prefetchFn={() => {
       // Prefetch code for the page
       import("./pages/ProductGallery")
       // Prefetch critical images
       preloadCriticalImages(["banner.jpg", "featured.jpg"])
     }}
   >
     Product Gallery
   </SmartLink>
   ```

3. **Conditionally enable prediction**:

   ```jsx
   // Don't predict on mobile devices where mouse movement doesn't apply
   useEffect(() => {
     const isMobile = window.matchMedia("(max-width: 768px)").matches
     ForesightManager.instance.alterGlobalSettings({
       enableMousePrediction: !isMobile,
     })
   }, [])
   ```

4. **Combine with other optimization techniques**:

   ```jsx
   // Use both React.lazy for code-splitting and ForesightJS for prediction
   const HeavyComponent = React.lazy(() => import("./components/HeavyComponent"))

   function MyPage() {
     const [isComponentVisible, setIsComponentVisible] = useState(false)
     const buttonRef = useForeSight({
       onPredict: () => {
         // Preload the component when user is likely to click the button
         import("./components/HeavyComponent")
       },
     })

     return (
       <div>
         <button ref={buttonRef} onClick={() => setIsComponentVisible(true)}>
           Show Heavy Component
         </button>

         {isComponentVisible && (
           <Suspense fallback={<div>Loading...</div>}>
             <HeavyComponent />
           </Suspense>
         )}
       </div>
     )
   }
   ```

By implementing these techniques, you can significantly improve the perceived performance of your React application, making navigation feel instantaneous and providing a smoother user experience.
