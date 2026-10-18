'use strict';
(() => {
  const logBox = document.querySelector('#logs'), status = document.querySelector('#status');
  let worker, deadline, generation = 0;
  const api = window.depthBenchmark = {events: [], report: null, phase: 'idle'};
  function record(event) {
    api.events.push({utc: new Date().toISOString(), ...event});
    logBox.value = api.events.map(e => JSON.stringify(e)).join('\n');
    logBox.scrollTop = logBox.scrollHeight;
  }
  function finish() {
    clearTimeout(deadline);
    if (worker) worker.terminate();
    worker = null;
    document.querySelector('#run').disabled = false;
    document.querySelector('#cancel').disabled = true;
  }
  api.cancel = (reason = 'user') => {
    if (!worker) return;
    ++generation;
    record({type: 'cancel', reason, phase: api.phase, cleanup: 'worker terminated; browser owns context destruction; post-termination GPU counters unavailable'});
    api.report = {status: reason === 'timeout' ? 'TIMEOUT' : 'CANCELLED', phase: api.phase, reason};
    api.phase = api.report.status;
    status.textContent = api.phase;
    finish();
  };
  api.start = (options = {}) => {
    if (worker) throw Error('A benchmark is already running');
    api.report = null;
    api.phase = 'starting';
    const id = ++generation;
    record({type: 'start', generation: id});
    document.querySelector('#run').disabled = true;
    document.querySelector('#cancel').disabled = false;
    try {
      worker = new Worker('worker.js');
      worker.onmessage = ({data}) => {
        if (id !== generation) return;
        record(data);
        if (data.phase) {api.phase = data.phase; status.textContent = data.phase;}
        if (data.type === 'result') {
          api.report = data.report; api.phase = data.report.status;
          status.textContent = data.report.status; finish();
        }
      };
      worker.onerror = event => {
        if (id !== generation) return;
        record({type: 'worker-error', message: event.message});
        api.report = {status: 'FAIL', error: event.message}; api.phase = 'FAIL';
        status.textContent = 'FAIL'; finish();
      };
      deadline = setTimeout(() => api.cancel('timeout'), options.deadlineMs || 240000);
      worker.postMessage({fixture: options.fixture || 'demo01', modelUrl: options.modelUrl || '/graph-model/model.json'});
    } catch (error) {
      record({type: 'failure', error: String(error)}); api.report = {status: 'FAIL', error: String(error)};
      api.phase = 'FAIL'; status.textContent = 'FAIL'; finish();
    }
  };
  document.querySelector('#run').onclick = () => api.start();
  document.querySelector('#cancel').onclick = () => api.cancel();
  document.querySelector('#copy').onclick = async () => {
    try {await navigator.clipboard.writeText(logBox.value); status.textContent = 'Logs copied';}
    catch {logBox.focus(); logBox.select(); status.textContent = 'Select and copy the retained logs';}
  };
  document.querySelector('#download').onclick = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify({events: api.events, report: api.report}, null, 2)], {type: 'application/json'}));
    const a = document.createElement('a'); a.href = url; a.download = 'depth-webgl-benchmark.json'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  addEventListener('pagehide', () => api.cancel('pagehide'));
})();
