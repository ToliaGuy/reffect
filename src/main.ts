import './style.css'
import { Effect } from "effect"

const render = (vnode: Effect.Effect<HTMLElement>, parentDom: HTMLElement) => Effect.gen(function* (){
  const result = yield* vnode
  parentDom.appendChild(result)
})


const Component1 = () => Effect.gen(function* () {
  const h1 = document.createElement("h1")
  h1.innerText = "Fist component ever"
  return h1 as HTMLElement
})

const root = document.getElementById('app') as HTMLElement;


Effect.runFork(render(Component1(), root))
