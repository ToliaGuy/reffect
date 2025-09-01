import './style.css'
import { Effect } from "effect"

const test = `
  <div>
    TEST
  </div>
`


const render = (vnode, parentDom) => Effect.gen(function* (){
  parentDom.innerHTML = vnode
})


const root = document.getElementById('app') as HTMLElement;


Effect.runFork(render(test, root))
