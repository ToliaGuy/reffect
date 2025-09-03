import { Effect, Console } from "effect";

export interface VNode {
  type: string | Component<any>;
  props: Record<string, any>;
  key?: any;
  ref?: any;
}

export type Component<P = any> = (props: P) => Effect.Effect<VNode>;

const createVNode = (
  type: any,
  props: Record<string, any>,
  key?: any,
  ref?: any
) =>
  Effect.succeed({
    type,
    props,
    key,
    ref,
  });

export const createElement = (
  type: any,
  props: Record<string, any> = {},
  ...children: Effect.Effect<any, never, never>[]
) =>
  Effect.gen(function* () {
    let normalizedProps: any = {};
    let key, ref;

    for (let i in props) {
      if (i === "key") key = props[i];
      else if (i === "ref" && typeof type !== "function") ref = props[i];
      else normalizedProps[i] = props[i];
    }

    // Normalize children
    if (children.length === 1) {
      normalizedProps.children = yield* children[0];
    } else if (children.length > 1) {
      normalizedProps.children = yield* Effect.all(children);
    } else {
      normalizedProps.children = [];
    }

    // If type is a component, run it
    if (typeof type === "function") {
      return yield* type(normalizedProps) as Effect.Effect<VNode>;
    }

    return yield* createVNode(type, normalizedProps, key, ref);
  });

const render = (vnode: Effect.Effect<VNode>, parentDom: HTMLElement) => Effect.gen(function* () {
  yield* Console.log(yield* vnode);
});



const Heading = () =>
  Effect.gen(function* () {
    yield* Console.log("Heading");
    return yield* createElement("h1", {}, Effect.succeed("Hello World"));
});

const App = () =>
  Effect.gen(function* () {
    return yield*createElement("div", { id: "root" },
      createElement(Heading),
      createElement("p", {}, Effect.succeed("This is Effect-TS VDOM"))
    );
});

Effect.runPromise(
  render(createElement(App, {}), document.getElementById("app")!)
);


const root = document.getElementById('app') as HTMLElement;