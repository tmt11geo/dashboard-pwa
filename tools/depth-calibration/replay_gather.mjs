// Private input stays local. Output contains numeric diagnostics only.
import fs from 'node:fs';import crypto from 'node:crypto';
import {loadSession,stitchFrames,buildRelief} from '../../scan-session-core.js';
const bytes=fs.readFileSync(process.argv[2]),s=loadSession(JSON.parse(bytes)),start=performance.now(),r=stitchFrames(s.frames);
const report={inputSha256:crypto.createHash('sha256').update(bytes).digest('hex'),frames:s.frames.length,placed:r.placed.length,anchorRecovery:r.anchorRecovery,points:buildRelief(r).points.length,elapsedMs:performance.now()-start,results:r.results};
fs.writeFileSync(process.argv[3],JSON.stringify(report,null,2)+'\n');console.log({frames:report.frames,placed:report.placed,elapsedMs:report.elapsedMs});
