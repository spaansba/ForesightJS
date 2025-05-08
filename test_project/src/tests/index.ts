/**
 * Test Runner for ForesightManager tests
 * This file allows running either the TypeScript or JavaScript tests
 */

// Import both test modules
import * as TSTests from './ForesightManager.test.ts';
import * as JSTests from './ForesightManager.test.js';

// Create UI for selecting which tests to run
document.addEventListener('DOMContentLoaded', () => {
  const container = document.createElement('div');
  container.style.padding = '30px';
  container.style.fontFamily = 'Arial, sans-serif';
  container.style.maxWidth = '800px';
  container.style.margin = '0 auto';
  
  const title = document.createElement('h1');
  title.textContent = 'ForesightManager Test Runner';
  container.appendChild(title);
  
  const description = document.createElement('p');
  description.textContent = 'Select which test suite to run:';
  container.appendChild(description);
  
  // TypeScript test button
  const tsButton = document.createElement('button');
  tsButton.textContent = 'Run TypeScript Tests';
  tsButton.style.padding = '10px 20px';
  tsButton.style.marginRight = '10px';
  tsButton.style.fontSize = '16px';
  tsButton.addEventListener('click', () => {
    clearTestArea();
    TSTests.runAllTests();
  });
  
  // JavaScript test button
  const jsButton = document.createElement('button');
  jsButton.textContent = 'Run JavaScript Tests';
  jsButton.style.padding = '10px 20px';
  jsButton.style.fontSize = '16px';
  jsButton.addEventListener('click', () => {
    clearTestArea();
    JSTests.runAllTests();
  });
  
  // Add buttons to container
  const buttonContainer = document.createElement('div');
  buttonContainer.style.margin = '20px 0';
  buttonContainer.appendChild(tsButton);
  buttonContainer.appendChild(jsButton);
  container.appendChild(buttonContainer);
  
  // Add test area
  const testArea = document.createElement('div');
  testArea.id = 'test-area';
  container.appendChild(testArea);
  
  // Function to clear test area
  function clearTestArea() {
    document.body.innerHTML = '';
    document.body.appendChild(container);
  }
  
  // Add container to document
  document.body.appendChild(container);
});

// Export both test modules
export { TSTests, JSTests };
