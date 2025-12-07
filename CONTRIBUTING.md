# Contributing

First of all, thanks for taking the time to contribute to the project! There are several ways to support ForesightJS, and we appreciate all forms of contribution.

## Ways to Contribute

### Request a New Feature

If you have a great idea for ForesightJS or know a better way of doing the same with less overhead or better performance, please make sure to open an issue first before creating a PR. This way we can review the request and align before you or we spend time on building it. This also helps avoid multiple people working on the same feature unknowingly.

### Report a Bug

If you run into a bug, please post an issue in this [repo](https://github.com/spaansba/ForesightJS/issues/new). While reporting an issue please give as much information as possible and share a picture or even video wherever that makes sense.

### Create Framework Integrations

Since ForesightJS is framework agnostic, we welcome integrations for popular frameworks and routers. We already have Next.js and React Router integrations, but would love to see:

- Vue.js integration
- Angular integration
- Svelte integration
- Other popular frameworks or routers

These integrations help newer users easily incorporate ForesightJS into their projects without having to understand the low-level implementation details.

### Improve Documentation

Help us improve our documentation by:

- Fixing typos or unclear explanations
- Adding examples or use cases
- Improving the interactive demo
- Translating documentation

## How to Contribute

### Prerequisites

- Node.js
- pnpm

### Getting Started

**1. Fork the Repository**

```bash
git clone https://github.com/your-username/ForesightJS.git
cd ForesightJS
```

**2. Install dependencies**

This project uses a monorepo structure with multiple packages. Install dependencies from the root:

```bash
# Install all workspace dependencies
pnpm install

# then
pnpm build
```

**3. Start developing with the development page**

```bash
# Start the development page from the monorepo root
pnpm dev
```

The development page directly imports from the core library source code (`packages/js.foresight/src/`), meaning any changes you make to the `ForesightManager` or other source files are immediately reflected without needing to rebuild.

**4. Make your changes**

- Create a new branch for your feature or bug fix
- Test your changes in the development page

**5. Run Tests**

Before submitting your pull request, make sure to run the test suite:

```bash
# Run all tests
pnpm test:run

# Run tests in watch mode during development
pnpm test
```

All tests must pass before your PR will be reviewed.

**6. Submit a Pull Request**

- Push your changes to your fork
- Create a pull request with a clear description of what you've changed
- Include any relevant issue numbers
- Make sure all tests pass
