# checks/

`pages.json` tells the **Checks** GitHub Action where each loader page lives on the test title, and how to find its rail tabs.
The keys match `manifests/<page>.json`.

| Field | Meaning |
|---|---|
| `base` | The live site. Tests run on www.inbxify.com by ruling. |
| `loginAt` | Any page that loads Memberstack. The agent member signs in there with `$memberstackDom`. |
| `widths` | The window widths every view is opened at, unless the page sets its own. |
| `pages.<page>.path` | The page on the TEST title (HC-P-AG-3). `null` = no test address yet: a change to that page fails the check with a plain message. |
| `pages.<page>.login` | `true` = the agent member signs in first. |
| `pages.<page>.tabs` | CSS selector for the rail tabs. Each one is clicked once. `null` = no tabs. |
| `pages.<page>.widths` | Optional. This page's widths. TA Studio, the IPP and Quill are desktop only (1440 and 1280; TA Reskin S1 ruling 2), so they are not opened at 390. |

How a contrast failure is judged (check-pages v1.0.3): it belongs to the element, not to the tab it was seen on or its colours. A failure is the branch's only if main never failed on that element, on any tab, or the branch made the ratio lower. Elements still fading or animating when the picture is taken are left out. The report counts the failures the branch removes.

The check never types, saves or submits. It opens pages and clicks rail tabs only (read-only, scoping §3).
The agent's email and password are the repo secrets `IX_AGENT_EMAIL` and `IX_AGENT_PASSWORD`. They are never in this repo.
