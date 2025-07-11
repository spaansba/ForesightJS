# ForesightJS Performance Testing Suite

## Overview

This performance testing suite provides comprehensive benchmarking for ForesightJS's most critical code paths. It helps identify performance bottlenecks and measure the impact of optimizations.

## Features

- **Comprehensive Benchmarks**: Tests all critical ForesightJS algorithms
- **Memory Profiling**: Measures memory usage and allocation patterns
- **Stress Testing**: Tests performance under increasing load
- **Cross-Environment**: Works in both Node.js and browser environments
- **Detailed Reporting**: Generates comprehensive performance reports

## Quick Start

### Node.js Environment

```bash
# Install dependencies (if not already installed)
npm install

# Run all performance tests
npm run perf

# Results will be displayed in console and saved to performance-results-[timestamp].json
```

### Browser Environment

```bash
# Open browser performance runner
npm run perf:browser

# Or directly open the HTML file
open src/performance/browser-runner.html
```

## Test Categories

### 1. Mouse Movement Processing
- **Current Implementation**: Tests the existing O(n) element checking
- **Optimized Implementation**: Tests proposed spatial partitioning approach
- **Memory Usage**: Measures memory allocation during mouse processing

### 2. Trajectory Prediction
- **Array Operations**: Tests current array-based position history
- **Circular Buffer**: Tests optimized circular buffer implementation
- **Variable History Sizes**: Tests performance with different history lengths

### 3. Intersection Detection
- **Point-in-Rectangle**: Tests basic point collision detection
- **Line-Segment Intersection**: Tests trajectory-element intersection
- **Batch Processing**: Tests performance with multiple elements

### 4. Bounds Calculation
- **HitSlop Normalization**: Tests hitslop processing performance
- **Rectangle Expansion**: Tests bounds expansion calculations
- **Bounds Comparison**: Tests rectangle equality checks

### 5. Memory Allocation
- **Object Creation**: Tests memory usage of frequently created objects
- **Array Operations**: Tests memory impact of array manipulations
- **Circular Buffer**: Tests memory efficiency of optimized data structures

### 6. Stress Testing
- **Element Count**: Tests performance with increasing numbers of elements
- **History Size**: Tests trajectory prediction with larger position histories

## Usage Examples

### Basic Performance Test

```typescript
import { ForesightPerformanceBenchmarks } from './src/performance'

const benchmarks = new ForesightPerformanceBenchmarks()
await benchmarks.runAllBenchmarks()

// Get results
const results = benchmarks.getResults()
console.log(results)
```

### Custom Benchmark

```typescript
import { PerformanceSuite } from './src/performance'

const suite = new PerformanceSuite()

// Benchmark a specific function
const result = await suite.benchmark('My Function', () => {
  // Your function here
  myFunction()
}, {
  iterations: 10000,
  warmupIterations: 1000,
  measureMemory: true
})

console.log(`${result.name}: ${result.operationsPerSecond.toFixed(0)} ops/sec`)
```

### Memory Usage Analysis

```typescript
const memoryResult = await suite.measureMemoryUsage('Memory Test', () => {
  // Function that might use memory
  const data = new Array(1000).fill(0)
  return data
}, 1000)

console.log(`Memory delta: ${memoryResult.memoryDelta.toFixed(2)} MB`)
```

## Performance Metrics

### Key Metrics Measured

- **Operations per Second (ops/sec)**: How many operations can be performed per second
- **Average Time (ms)**: Average execution time per operation
- **Min/Max Time (ms)**: Fastest and slowest execution times
- **Memory Usage (MB)**: Memory allocation and peak usage
- **Samples**: Number of iterations performed

### Interpretation Guidelines

- **Mouse Processing**: Target >10,000 ops/sec for 100 elements
- **Trajectory Prediction**: Target >5,000 ops/sec with 8-point history
- **Intersection Detection**: Target >20,000 ops/sec for simple checks
- **Memory Allocation**: Target <1MB for 1000 operations

## Browser-Specific Optimizations

### Chrome DevTools Integration

For the most accurate results in Chrome:

1. **Enable Precise Memory Info**:
   ```bash
   chrome --enable-precise-memory-info
   ```

2. **Enable Garbage Collection**:
   ```bash
   chrome --expose-gc
   ```

3. **Disable Extensions**:
   ```bash
   chrome --disable-extensions
   ```

### Performance Profile Integration

The browser runner includes:
- Real-time progress tracking
- Memory usage monitoring
- Performance.mark() integration
- Exportable JSON results

## Continuous Integration

### GitHub Actions Example

```yaml
name: Performance Tests
on: [push, pull_request]

jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run perf
      - uses: actions/upload-artifact@v3
        with:
          name: performance-results
          path: performance-results-*.json
```

## Results Analysis

### Performance Regression Detection

```typescript
// Compare results between versions
const baseline = loadResults('baseline-results.json')
const current = loadResults('current-results.json')

baseline.forEach(baselineResult => {
  const currentResult = current.find(r => r.name === baselineResult.name)
  if (currentResult) {
    const improvement = ((currentResult.operationsPerSecond - baselineResult.operationsPerSecond) / baselineResult.operationsPerSecond) * 100
    console.log(`${baselineResult.name}: ${improvement.toFixed(1)}% change`)
  }
})
```

### Automated Alerts

Set up alerts for performance regressions:

```typescript
const PERFORMANCE_THRESHOLDS = {
  'Mouse Processing': 10000,
  'Trajectory Prediction': 5000,
  'Intersection Detection': 20000
}

results.forEach(result => {
  const threshold = PERFORMANCE_THRESHOLDS[result.name]
  if (threshold && result.operationsPerSecond < threshold) {
    console.warn(`⚠️  Performance regression detected: ${result.name}`)
  }
})
```

## Tips for Accurate Testing

1. **Close Other Applications**: Minimize background processes
2. **Use Consistent Hardware**: Test on the same device for comparisons
3. **Warm Up the Engine**: Always include warmup iterations
4. **Multiple Runs**: Average results across multiple test runs
5. **Check for Outliers**: Look for unusually high/low results
6. **Monitor Memory**: Watch for memory leaks in long-running tests

## Contributing

When adding new benchmarks:

1. Follow the existing naming convention
2. Include appropriate warmup iterations
3. Add memory measurement for allocation-heavy operations
4. Update documentation with expected performance ranges
5. Test in both Node.js and browser environments

## Troubleshooting

### Common Issues

**TypeScript Errors**: Ensure all dependencies are installed
```bash
npm install --save-dev ts-node
```

**Memory Measurements Not Available**: Enable memory profiling in Chrome
```bash
chrome --enable-precise-memory-info
```

**Performance Varies Wildly**: Check for:
- Background processes
- Browser extensions
- Thermal throttling
- Other tabs/applications

### Debug Mode

Enable debug logging:
```typescript
const suite = new PerformanceSuite()
suite.enableDebug = true
```

This will provide detailed information about each benchmark execution.