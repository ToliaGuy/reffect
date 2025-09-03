import { Effect, Data } from "effect";
import { type VNode, render, createElement, InvalidChildError } from "./vdom";


class MyCustomError extends Data.TaggedError("MyCustomError")<{}> {}

// Components (using JSX)
const Heading = () =>
  Effect.gen(function* () {
    return yield* <h1>Hello World</h1>;
  });

const Paragraph = ({content}: {content: string}) =>
  Effect.gen(function* () {
    return yield* <p>{content}</p>;
  });

const MyComponent = () =>
  Effect.gen(function* () {
    return yield* Effect.fail(new MyCustomError());
    return yield* (
      <div>
        <Heading />
        <Paragraph content="This is MyComponent" />
      </div>
    );
  });

const App = () =>
  Effect.gen(function* () {
    return yield* (
      <div id="root">
        <Heading />
        <Heading />
        <Heading />
        <Paragraph content="This is Effect-TS VDOM with JSX" />
        <MyComponent />
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
    // FUCK all the components have any in error channel,
    // no way to pass generics to JSX.Element
    type Element = Effect.Effect<VNode, any, never>;
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


