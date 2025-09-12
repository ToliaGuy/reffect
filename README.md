# reffect
React for Effect-TS

## Current status
- **TypeScript JSX limitation**: JSX in TypeScript requires a single concrete `JSX.Element` type. It cannot carry generic error types, so precise error inference does not flow through JSX syntax.
e.g. [see line 55](https://github.com/ToliaGuy/reffect/blob/main/src/main.tsx#L55)
- There is no point in reimplementing frontend framework in Effect until thats fixed as per chat on Discord
> "we plan to investigate temporarily forking tsgo to figure the right JSX implementation and then make a proposal – but that's very long term"
>
> — Michael Arnaldi (founder of Effect-TS)

## Updarte - Its Possible !!!
Typescript doesn't propagate types through children in JSX. But what if typescript didn't do the JSX transpilation?

What if a language server was built that transpiles the JSX into typescript and then used typescript langauge service
to do the work on already transformed typescript code and then use source maps so we know which position in the original corresponds to which generated position.

Something similar to how svelte does it with its own language server (https://github.com/sveltejs/language-tools/blob/master/docs/internal/overview.md)

I believe something like Volar.js could greatly help with that.
