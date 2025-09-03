import { Effect, Console, Data } from "effect";

export class InvalidChildError extends Data.TaggedError("InvalidChildError")<{
  readonly child: unknown;
  readonly childType: string;
  readonly reason: string;
}> {}

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


const normalizeChild = (child: any) => {
  if (Effect.isEffect(child)) {
    return child as Effect.Effect<any>;
  } else {
    if (child === null || child === undefined) {
      return Effect.succeed(null);
    } else if (typeof child === "number") {
      return Effect.succeed(child.toString());
    } else if (typeof child === "string") {
      return Effect.succeed(child);
    } else if (typeof child === "boolean") {
      return Effect.succeed(child.toString());
    } else {
      return Effect.fail(new InvalidChildError({ child, childType: typeof child, reason: "Invalid child" }));
    }
  }
}

export const createElement = (
  type: any,
  props: Record<string, any> = {},
  ...children: any[]
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
      normalizedProps.children = yield* normalizeChild(children[0]);
    } else if (children.length > 1) {
      normalizedProps.children = yield* Effect.all(children.map(normalizeChild));
    } else {
      normalizedProps.children = [];
    }

    // If type is a component, run it
    if (typeof type === "function") {
      return yield* type(normalizedProps) as Effect.Effect<VNode>;
    }

    return yield* createVNode(type, normalizedProps, key, ref);
  });

export const render = (vnode: Effect.Effect<VNode>, parentDom: HTMLElement) => Effect.gen(function* () {
  yield* Console.log(yield* vnode);
});

const Heading = () =>
  Effect.gen(function* () {
    return yield* createElement("h1", {}, Effect.succeed("Hello World"));
});

const App = () =>
  Effect.gen(function* () {
    return yield*createElement("div", { id: "root" },
      createElement(Heading),
      createElement("p", {}, "This is Effect-TS VDOM")
    );
});


// Fragment value for JSX
export const Fragment = Symbol.for("reffect.fragment");