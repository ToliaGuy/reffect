import { Effect } from "effect";
import { InvalidChildError, type Component, type VNode, render, createElement } from "./vdom";


// Components (using JSX)
const Heading = () =>
  Effect.gen(function* () {
    return yield* <h1>Hello World</h1>;
  });

const App = () =>
  Effect.gen(function* () {
    return yield* (
      <div id="root">
        <Heading />
        <p>This is Effect-TS VDOM with JSX</p>
      </div>
    );
  });

const root = document.getElementById("app") as HTMLElement;

Effect.runPromise(
  render(
    Effect.orDie(createElement(App, {})),
    root
  )
);

// Minimal JSX typing (kept local to avoid extra files)
declare global {
  namespace JSX {
    type Element = Effect.Effect<VNode, InvalidChildError, never>;
    interface ElementChildrenAttribute { children: {}; }
    interface IntrinsicElements {
      div: any;
      h1: any;
      p: any;
      span: any;
      button: any;
    }
  }
}


