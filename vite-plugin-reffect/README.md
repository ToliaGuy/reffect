# vite-plugin-reffect

A Vite plugin for processing `.reffect` files with JSX transformation for Effect-TS applications.

## Features

- Transforms JSX syntax in `.reffect` files to `createElement` calls
- Compatible with Effect-TS VDOM
- Built on Babel's JSX transformation
- Follows Vite plugin conventions

## Usage

```js
// vite.config.js
import { defineConfig } from 'vite'
import { reffect } from './vite-plugin-reffect'

export default defineConfig({
  plugins: [
    reffect()
  ]
})
```

## File Extension

This plugin processes files with the `.reffect` extension, transforming JSX syntax for use with Effect-TS VDOM.

Example `.reffect` file:
```tsx
import { Effect } from "effect";
import { createElement } from "./vdom";

const MyComponent = () =>
  Effect.gen(function* () {
    return yield* <div>Hello World</div>;
  });
```

The plugin will transform the JSX to:
```tsx
import { Effect } from "effect";
import { createElement } from "./vdom";

const MyComponent = () =>
  Effect.gen(function* () {
    return yield* createElement("div", null, "Hello World");
  });
```
