import React, { useState, useEffect, useRef } from 'react';
import ReactPage from './pages/ReactPage';

// We'll dynamically import the TypeScript and JavaScript pages
const PageRouter: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<string>('react');
  const [error, setError] = useState<string | null>(null);
  
  // References to hold the imported page modules
  const jsPageRef = useRef<any>(null);
  const tsPageRef = useRef<any>(null);
  
  // Clear any error when changing pages
  useEffect(() => {
    setError(null);
    console.log(`PageRouter: Page changed to ${currentPage}`);
  }, [currentPage]);
  
  // Effect to handle all page loading and initialization
  useEffect(() => {
    const initializePages = async () => {
      try {
        // Handle TypeScript page
        if (currentPage === 'typescript') {
          // Load the module if not already loaded
          if (!tsPageRef.current) {
            console.log("PageRouter: Loading TypeScript page module");
            const tsModule = await import('./pages/TypeScriptPage');
            tsPageRef.current = tsModule.default;
            console.log("PageRouter: TypeScript page module loaded successfully");
          }
          
          // Create an instance and initialize it
          console.log("PageRouter: Creating and initializing TypeScript page instance");
          const container = document.getElementById('typescript-page-container');
          if (container) {
            container.innerHTML = ''; // Clear the container
            const instance = new tsPageRef.current();
            window.tsPage = instance;
            instance.initialize();
          } else {
            console.error("PageRouter: typescript-page-container not found in DOM");
          }
        }
        
        // Handle JavaScript page
        if (currentPage === 'javascript') {
          // Load the module if not already loaded
          if (!jsPageRef.current) {
            console.log("PageRouter: Loading JavaScript page module");
            const jsModule = await import('./pages/JavaScriptPage');
            jsPageRef.current = jsModule.default;
            console.log("PageRouter: JavaScript page module loaded successfully");
          }
          
          // Create an instance and initialize it
          console.log("PageRouter: Creating and initializing JavaScript page instance");
          const container = document.getElementById('javascript-page-container');
          if (container) {
            container.innerHTML = ''; // Clear the container
            const instance = new jsPageRef.current();
            window.jsPage = instance;
            instance.initialize();
          } else {
            console.error("PageRouter: javascript-page-container not found in DOM");
          }
        }
      } catch (err: any) {
        console.error('PageRouter: Error initializing page:', err);
        setError(`Failed to load page: ${err.message}`);
      }
    };
    
    // Cleanup previous page
    const cleanup = () => {
      if (currentPage !== 'typescript' && window.tsPage?.cleanup) {
        console.log("PageRouter: Cleaning up TypeScript page");
        try {
          window.tsPage.cleanup();
        } catch (err) {
          console.error("PageRouter: Error during TypeScript page cleanup", err);
        }
      }
      
      if (currentPage !== 'javascript' && window.jsPage?.cleanup) {
        console.log("PageRouter: Cleaning up JavaScript page");
        try {
          window.jsPage.cleanup();
        } catch (err) {
          console.error("PageRouter: Error during JavaScript page cleanup", err);
        }
      }
    };
    
    // Run cleanup first, then initialize
    cleanup();
    initializePages();
    
    // Cleanup on component unmount
    return cleanup;
  }, [currentPage]);
  
  return (
    <div className="page-router">
      <nav className="p-4 bg-gray-800 text-white mb-5">
        <h2 className="text-xl font-bold mb-4">ForesightManager Test Pages</h2>
        
        <div className="flex gap-2">
          <button 
            onClick={() => setCurrentPage('react')}
            className={`px-4 py-2 rounded font-medium ${
              currentPage === 'react' 
                ? 'bg-green-500 hover:bg-green-600' 
                : 'bg-gray-600 hover:bg-gray-700'
            }`}
          >
            React Page
          </button>
          
          <button 
            onClick={() => setCurrentPage('typescript')}
            className={`px-4 py-2 rounded font-medium ${
              currentPage === 'typescript' 
                ? 'bg-blue-500 hover:bg-blue-600' 
                : 'bg-gray-600 hover:bg-gray-700'
            }`}
          >
            TypeScript Page
          </button>
          
          <button 
            onClick={() => setCurrentPage('javascript')}
            className={`px-4 py-2 rounded font-medium ${
              currentPage === 'javascript' 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-gray-600 hover:bg-gray-700'
            }`}
          >
            JavaScript Page
          </button>
        </div>
      </nav>
      
      {/* Error message display */}
      {error && (
        <div className="mx-5 p-3 bg-red-100 text-red-800 rounded-lg mb-5">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {/* Page containers - always in DOM, only one visible at a time */}
      <div className={currentPage === 'react' ? 'block' : 'hidden'}>
        {currentPage === 'react' && <ReactPage />}
      </div>
      
      <div 
        id="typescript-page-container" 
        className={`${currentPage === 'typescript' ? 'block' : 'hidden'} min-h-[500px]`}
      />
      
      <div 
        id="javascript-page-container" 
        className={`${currentPage === 'javascript' ? 'block' : 'hidden'} min-h-[500px]`}
      />
    </div>
  );
};

// Add window declaration for our custom properties
declare global {
  interface Window {
    jsPage?: {
      initialize: () => void;
      cleanup: () => void;
    };
    tsPage?: {
      initialize: () => void;
      cleanup: () => void;
    };
  }
}

export default PageRouter;
