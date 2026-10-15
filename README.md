# pint

Your context window as a pint of stout, drawn above the Claude Code prompt.

```
pint ▕████████████░░░░░░░░░░░░▏ 51%  settling nicely
```

The glass fills with the context window. The head is what is left. At 85% the barman calls last orders (a toast, and the line turns to the warning colour), because that is about where autocompact tends to fire. At 95% it is time, please. After a compaction or `/clear` the glass is poured again and the band says which round you are on.

`/pint` hides or shows it.

## Install

```
/plugin install pint --marketplace Rudrajmehta/pint
```

Answer `y` to add the marketplace, pick the user scope. Needs Claude Code 2.1.287 or newer (mods).

## Run from this folder while developing

```bash
git clone https://github.com/Rudrajmehta/pint && claude --plugin-dir ./pint
```

The folder is watched; saving `hooks/register.tsx` reloads it.

## Files

- `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`: manifest and the one-entry marketplace that makes the repo installable.
- `hooks/hooks.json`, `hooks/register.tsx`: the mod. It reads `$.session.usage().context.percent` after every turn and draws a band with `ui.render` on `AbovePrompt`.
- `types/index.d.ts`: the `$.state` contract (`percent`, `isHidden`, `pours`).

`claude plugin validate .` passes.
