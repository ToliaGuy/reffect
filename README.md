# reffect
React for Effect-TS

## Current status
- **TypeScript JSX limitation**: JSX in TypeScript requires a single concrete `JSX.Element` type. It cannot carry generic error types, so precise error inference does not flow through JSX syntax.
e.g. [see line 55](https://github.com/ToliaGuy/reffect/blob/main/src/main.tsx#L55)
- There is no point in reimplementing frontend framework in Effect until thats fixed as per chat on Discord
> "we plan to investigate temporarily forking tsgo to figure the right JSX implementation and then make a proposal – but that's very long term"
>
> — Michael Arnaldi (founder of Effect-TS)
