import { Effect, Data } from "effect";
import { type VNode, render, createElement, InvalidChildError } from "./vdom";
class MyCustomError extends Data.TaggedError("MyCustomError")<{}> {}

// Components (using JSX)
const Heading = () => Effect.gen(function* () {
  return yield* createElement("h1", null, "Hello World");
});
const Paragraph = ({
  content
}: {
  content: string;
}) => Effect.gen(function* () {
  return yield* createElement("p", null, content);
});
const MyComponent = () => Effect.gen(function* () {
  return yield* Effect.fail(new MyCustomError());
  return yield* createElement("div", null, createElement(Heading, null), createElement(Paragraph, {
    content: "This is MyComponent"
  }));
});
const App = () => Effect.gen(function* () {
  return yield* createElement("div", {
    id: "root"
  }, createElement(Heading, null), createElement(Heading, null), createElement(Heading, null), createElement(Paragraph, {
    content: "This is Effect-TS VDOM with JSX"
  }), createElement(MyComponent, null), createElement("p", null, "This is Effect-TS VDOM with JSX"));
});
const root = document.getElementById("app") as HTMLElement;
Effect.runPromise(render(Effect.orDie(createElement(App, {})), root));
console.log("hello");

// Minimal JSX typing (kept local to avoid extra files)
declare global {
  namespace JSX {
    // Use unknown instead of any to preserve type inference
    type Element = Effect.Effect<VNode, any, any>;
    interface ElementChildrenAttribute {
      children: {};
    }
    interface IntrinsicElements {
      div: any;
      h1: any;
      p: any;
      span: any;
      button: any;
    }
  }
}