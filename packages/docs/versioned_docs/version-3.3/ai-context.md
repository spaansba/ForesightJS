---
sidebar_position: 8
keywords:
  - ForesightJS
  - AI context
  - LLM context
  - llms.txt
  - documentation
description: How to use ForesightJS's llms.txt file with AI tools and LLMs
last_updated:
  date: 2025-07-31
  author: Bart Spaans
---

# AI Context

ForesightJS provides an `llms.txt` file following the [llms.txt specification](https://llmstxt.org/) to help LLMs understand and work with the library effectively.

## What is llms.txt?

The `llms.txt` file is a standardized way to provide LLM-friendly information about a project. It contains:

- A concise overview of what ForesightJS does
- Links to key documentation sections in markdown format
- Essential information for understanding the API and usage patterns

## Using ForesightJS's llms.txt

### Quick Access

- **Main file:** [foresightjs.com/llms.txt](https://foresightjs.com/llms.txt)
- **Full context:** [foresightjs.com/llms-full.txt](https://foresightjs.com/llms-full.txt)

### Example Prompt

```
Read the ForesightJS documentation from: https://foresightjs.com/llms.txt

I need to implement ForesightJS predictive prefetching in my Next.js application. I want to:

1. Use the useForesight React hook for my custom link components
2. Integrate with Next.js router prefetching using ForesightLink
3. Use the default configuration, except that I want mobile prefetching to be on touch start
```

## Individual Page Markdown

All documentation pages are available as markdown by adding `.md` to any URL:

- `https://foresightjs.com/docs/getting-started/your-first-element.md`
- `https://foresightjs.com/docs/configuration/global-settings.md`
- `https://foresightjs.com/docs/integrations/react/nextjs.md`
