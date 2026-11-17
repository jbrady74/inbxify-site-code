# checks/

`pages.json` tells the **Checks** GitHub Action where each loader page lives on the test title, and how to find its rail tabs.
The keys match `manifests/<page>.json`.

| Field | Meaning |
|---|---|
| `base` | The live site. Tests run on www.inbxify.com by ruling. |
| `loginAt` | Any page that loads Memberstack. The agent member signs in there with `$memberstackDom`. |
| `widths` | The window widths every view is opened at. |
| `pages.<page>.path` | The page on the TEST title (HC-P-AG-3). `null` = no test address yet: a change to that page fails the check with a plain message. |
| `pages.<page>.login` | `true` = the agent member signs in first. |
| `pages.<page>.tabs` | CSS selector for the rail tabs. Each one is clicked once. `null` = no tabs. |

The check never types, saves or submits. It opens pages and clicks rail tabs only (read-only, scoping §3).
The agent's email and password are the repo secrets `IX_AGENT_EMAIL` and `IX_AGENT_PASSWORD`. They are never in this repo.
