# Reusable continuation prompt

Paste the following into a fresh chat after an interruption, or to start the next bounded stage:

---

Continue the Depth Anything TFJS WebGL work in GitHub repository tmt11geo/dashboard-pwa using the connected GitHub integration.

First inspect branch depth-tfjs-webgl and read DONE.md from that branch, plus any applicable AGENTS.md instructions. Follow the current working-branch pointer in DONE.md if it has changed. Read docs/depth-tfjs-status.md and docs/depth-tfjs-plan.md on the identified branch. Do not assume these files are on main.

Tell me which branch and commit you are using, the current live/deployed commit, and which stage you will handle. Complete ONLY the earliest incomplete stage whose prerequisites are satisfied. Resume a partially completed stage before starting another. Use previous evidence to avoid rediscovery, but do not treat historical results with missing artifacts as reproducible deliverables.

For stage 6, select only the earliest incomplete substage 6A–6J from DONE.md; never run the whole parent stage. Resume a PARTIAL batch first and skip verified branch-referenced files. Stop after that one substage, including a blocked checkpoint. Never print binary/base64 payloads into the conversation.

Work autonomously within that single stage. I authorize committing checkpoints to the documented working branch. At stage 9 I authorize merging the verified changes into main and deploying through the existing Pages arrangement, then verifying the exact deployment succeeds. At stage 10, if device logs are missing, provide the test sequence and stop with WAITING FOR DEVICE LOGS; do not invent results.

Report progress at least every five minutes while actively working. Prefer tool waits under 60 seconds. If a stage becomes too large, commit a smaller safe checkpoint, mark it PARTIAL, and record the exact next action. Do not continue into another stage in this run.

Preserve Cloudflare Access, relative app paths under /dashboard-pwa/, existing WASM/WebGPU choices, maps, themes, tracker, location tools and PWA behavior. Frames stay local. Do not report GPU operation after CPU fallback, deploy a nonfunctional backend, or claim phone GPU performance from SwiftShader.

Before ending, commit all useful deliverables and update DONE.md and docs/depth-tfjs-status.md with completed checks, evidence paths, current/outcome branch, live deployment state, blockers and next stage/action. Record any difference from current main and protect intervening work. Verify the branch head and changed files through GitHub after committing.

Finish with the checkpoint commit link, branch, completed stage or partial scope, next action, and any input required from me. Then stop.

---

