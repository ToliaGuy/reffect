import { Effect, Console, Data } from "effect";

export class InvalidChildError extends Data.TaggedError("InvalidChildError")<{
  readonly child: unknown;
  readonly childType: string;
  readonly reason: string;
}> {}

export interface VNode {
  type: string | Component<any, any, any>;
  props: Record<string, any>;
  key?: any;
  ref?: any;
}

export type Component<P = any, E = never, R = never> = (props: P) => Effect.Effect<VNode, E, R>;

const createVNode = (
  type: any,
  props: Record<string, any>,
  key?: any,
  ref?: any
) =>
  Effect.succeed<VNode>({
    type,
    props,
    key,
    ref,
  });


function normalizeChild<C>(
  child: C
): C extends Effect.Effect<any, infer E, infer R>
  ? Effect.Effect<any, E, R>
  : Effect.Effect<any, InvalidChildError, never> {
  if (Effect.isEffect(child)) {
    return child as any;
  } else {
    if (child === null || child === undefined) {
      return Effect.succeed(null) as any;
    } else if (typeof child === "number") {
      return Effect.succeed(child.toString()) as any;
    } else if (typeof child === "string") {
      return Effect.succeed(child) as any;
    } else if (typeof child === "boolean") {
      return Effect.succeed(child.toString()) as any;
    } else {
      return Effect.fail(new InvalidChildError({ child, childType: typeof child, reason: "Invalid child" })) as any;
    }
  }
}

// Helper type to extract error type from Effect or default to never
type ExtractError<T> = T extends Effect.Effect<any, infer E, any> ? E : never;

// Helper type to extract requirement type from Effect or default to never  
type ExtractRequirement<T> = T extends Effect.Effect<any, any, infer R> ? R : never;

// Union all error types from children array
type ChildrenErrors<Children extends readonly unknown[]> = {
  [K in keyof Children]: ExtractError<Children[K]>
}[number];

// Union all requirement types from children array
type ChildrenRequirements<Children extends readonly unknown[]> = {
  [K in keyof Children]: ExtractRequirement<Children[K]>
}[number];

export function createElement<
  T extends string | Component<any, any, any>,
  P = T extends Component<infer PP, any, any> ? PP : Record<string, any>,
  Children extends readonly unknown[] = readonly unknown[]
>(
  type: T,
  props: P | null = {} as any,
  ...children: Children
): T extends Component<any, infer E, infer R>
  ? Effect.Effect<VNode, E | ChildrenErrors<Children> | InvalidChildError, R | ChildrenRequirements<Children>>
  : Effect.Effect<VNode, ChildrenErrors<Children> | InvalidChildError, ChildrenRequirements<Children>> {
  
  const effect = Effect.gen(function* () {
    let normalizedProps: any = {};
    let key, ref;

    for (let i in props) {
      if (i === "key") key = (props as any)[i];
      else if (i === "ref" && typeof type !== "function") ref = (props as any)[i];
      else (normalizedProps as any)[i] = (props as any)[i];
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
      return yield* (type as any)(normalizedProps);
    }

    return yield* createVNode(type, normalizedProps, key, ref);
  });
  
  return effect as any;
}

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