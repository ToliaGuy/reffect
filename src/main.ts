import './style.css'
import { Effect, Console } from "effect"



const createVNode = (type: any, props: any, key: any, ref: any) => Effect.gen(function* () {
  yield* Console.log(props)
  const element = document.createElement(type)
  for (let i in props) {
    if (i === 'children') {
      if (typeof props[i] === 'string') {
        element.innerHTML = props[i]
      } else {
        element.appendChild(props[i])
      }
    }
  }
  return element;
})

// props example: { className: "test", id: "test", children: "test", ref: "test", key: "test" }
const createElement = (
  type: any,
  props: Record<string, any> = {},
  ...children: any[]
) => Effect.gen(function* () {
  let normalizedProps = {}
  let key, ref;
	for (let i in props) {
		if (i == 'key') {
      key = props[i];
    }
		else if (i == 'ref' && typeof type != 'function') {
      ref = props[i];
    }
		else {
      // @ts-ignore
      normalizedProps[i] = props[i];
    }
	}

	// 0 children: do nothing.
	// 1 child: store it directly (no array).
	// Many children: build an array only when needed.
	if (children.length === 1) {
    // @ts-ignore
    normalizedProps.children = children[0];
  } else if (children.length > 1) {
    // @ts-ignore
    normalizedProps.children = children;
  }

  // @ts-ignore
	return yield* createVNode(type, normalizedProps, key, ref);
})


const render = (vnode: Effect.Effect<HTMLElement>, parentDom: HTMLElement) => Effect.gen(function* (){
  const result = yield* vnode
  parentDom.append(result)
  yield* Console.log(result)
})



const Component2 = () => Effect.gen(function* () {
  return yield* createElement("h1", {}, "Heading")
})


const Component1 = () => Effect.gen(function* () {
  return yield* createElement("div", {}, yield* Component2())
})

const root = document.getElementById('app') as HTMLElement;


Effect.runFork(render(Component1(), root))
