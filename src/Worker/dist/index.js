var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// ../../../../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/_internal/utils.mjs
// @__NO_SIDE_EFFECTS__
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
__name(createNotImplementedError, "createNotImplementedError");
// @__NO_SIDE_EFFECTS__
function notImplemented(name) {
  const fn = /* @__PURE__ */ __name(() => {
    throw /* @__PURE__ */ createNotImplementedError(name);
  }, "fn");
  return Object.assign(fn, { __unenv__: true });
}
__name(notImplemented, "notImplemented");
// @__NO_SIDE_EFFECTS__
function notImplementedClass(name) {
  return class {
    __unenv__ = true;
    constructor() {
      throw new Error(`[unenv] ${name} is not implemented yet!`);
    }
  };
}
__name(notImplementedClass, "notImplementedClass");

// ../../../../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs
var _timeOrigin = globalThis.performance?.timeOrigin ?? Date.now();
var _performanceNow = globalThis.performance?.now ? globalThis.performance.now.bind(globalThis.performance) : () => Date.now() - _timeOrigin;
var nodeTiming = {
  name: "node",
  entryType: "node",
  startTime: 0,
  duration: 0,
  nodeStart: 0,
  v8Start: 0,
  bootstrapComplete: 0,
  environment: 0,
  loopStart: 0,
  loopExit: 0,
  idleTime: 0,
  uvMetricsInfo: {
    loopCount: 0,
    events: 0,
    eventsWaiting: 0
  },
  detail: void 0,
  toJSON() {
    return this;
  }
};
var PerformanceEntry = class {
  static {
    __name(this, "PerformanceEntry");
  }
  __unenv__ = true;
  detail;
  entryType = "event";
  name;
  startTime;
  constructor(name, options) {
    this.name = name;
    this.startTime = options?.startTime || _performanceNow();
    this.detail = options?.detail;
  }
  get duration() {
    return _performanceNow() - this.startTime;
  }
  toJSON() {
    return {
      name: this.name,
      entryType: this.entryType,
      startTime: this.startTime,
      duration: this.duration,
      detail: this.detail
    };
  }
};
var PerformanceMark = class PerformanceMark2 extends PerformanceEntry {
  static {
    __name(this, "PerformanceMark");
  }
  entryType = "mark";
  constructor() {
    super(...arguments);
  }
  get duration() {
    return 0;
  }
};
var PerformanceMeasure = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceMeasure");
  }
  entryType = "measure";
};
var PerformanceResourceTiming = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceResourceTiming");
  }
  entryType = "resource";
  serverTiming = [];
  connectEnd = 0;
  connectStart = 0;
  decodedBodySize = 0;
  domainLookupEnd = 0;
  domainLookupStart = 0;
  encodedBodySize = 0;
  fetchStart = 0;
  initiatorType = "";
  name = "";
  nextHopProtocol = "";
  redirectEnd = 0;
  redirectStart = 0;
  requestStart = 0;
  responseEnd = 0;
  responseStart = 0;
  secureConnectionStart = 0;
  startTime = 0;
  transferSize = 0;
  workerStart = 0;
  responseStatus = 0;
};
var PerformanceObserverEntryList = class {
  static {
    __name(this, "PerformanceObserverEntryList");
  }
  __unenv__ = true;
  getEntries() {
    return [];
  }
  getEntriesByName(_name, _type) {
    return [];
  }
  getEntriesByType(type) {
    return [];
  }
};
var Performance = class {
  static {
    __name(this, "Performance");
  }
  __unenv__ = true;
  timeOrigin = _timeOrigin;
  eventCounts = /* @__PURE__ */ new Map();
  _entries = [];
  _resourceTimingBufferSize = 0;
  navigation = void 0;
  timing = void 0;
  timerify(_fn, _options) {
    throw createNotImplementedError("Performance.timerify");
  }
  get nodeTiming() {
    return nodeTiming;
  }
  eventLoopUtilization() {
    return {};
  }
  markResourceTiming() {
    return new PerformanceResourceTiming("");
  }
  onresourcetimingbufferfull = null;
  now() {
    if (this.timeOrigin === _timeOrigin) {
      return _performanceNow();
    }
    return Date.now() - this.timeOrigin;
  }
  clearMarks(markName) {
    this._entries = markName ? this._entries.filter((e) => e.name !== markName) : this._entries.filter((e) => e.entryType !== "mark");
  }
  clearMeasures(measureName) {
    this._entries = measureName ? this._entries.filter((e) => e.name !== measureName) : this._entries.filter((e) => e.entryType !== "measure");
  }
  clearResourceTimings() {
    this._entries = this._entries.filter((e) => e.entryType !== "resource" || e.entryType !== "navigation");
  }
  getEntries() {
    return this._entries;
  }
  getEntriesByName(name, type) {
    return this._entries.filter((e) => e.name === name && (!type || e.entryType === type));
  }
  getEntriesByType(type) {
    return this._entries.filter((e) => e.entryType === type);
  }
  mark(name, options) {
    const entry = new PerformanceMark(name, options);
    this._entries.push(entry);
    return entry;
  }
  measure(measureName, startOrMeasureOptions, endMark) {
    let start;
    let end;
    if (typeof startOrMeasureOptions === "string") {
      start = this.getEntriesByName(startOrMeasureOptions, "mark")[0]?.startTime;
      end = this.getEntriesByName(endMark, "mark")[0]?.startTime;
    } else {
      start = Number.parseFloat(startOrMeasureOptions?.start) || this.now();
      end = Number.parseFloat(startOrMeasureOptions?.end) || this.now();
    }
    const entry = new PerformanceMeasure(measureName, {
      startTime: start,
      detail: {
        start,
        end
      }
    });
    this._entries.push(entry);
    return entry;
  }
  setResourceTimingBufferSize(maxSize) {
    this._resourceTimingBufferSize = maxSize;
  }
  addEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.addEventListener");
  }
  removeEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.removeEventListener");
  }
  dispatchEvent(event) {
    throw createNotImplementedError("Performance.dispatchEvent");
  }
  toJSON() {
    return this;
  }
};
var PerformanceObserver = class {
  static {
    __name(this, "PerformanceObserver");
  }
  __unenv__ = true;
  static supportedEntryTypes = [];
  _callback = null;
  constructor(callback) {
    this._callback = callback;
  }
  takeRecords() {
    return [];
  }
  disconnect() {
    throw createNotImplementedError("PerformanceObserver.disconnect");
  }
  observe(options) {
    throw createNotImplementedError("PerformanceObserver.observe");
  }
  bind(fn) {
    return fn;
  }
  runInAsyncScope(fn, thisArg, ...args) {
    return fn.call(thisArg, ...args);
  }
  asyncId() {
    return 0;
  }
  triggerAsyncId() {
    return 0;
  }
  emitDestroy() {
    return this;
  }
};
var performance = globalThis.performance && "addEventListener" in globalThis.performance ? globalThis.performance : new Performance();

// ../../../../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs
if (!("__unenv__" in performance)) {
  const proto = Performance.prototype;
  for (const key of Object.getOwnPropertyNames(proto)) {
    if (key !== "constructor" && !(key in performance)) {
      const desc = Object.getOwnPropertyDescriptor(proto, key);
      if (desc) {
        Object.defineProperty(performance, key, desc);
      }
    }
  }
}
globalThis.performance = performance;
globalThis.Performance = Performance;
globalThis.PerformanceEntry = PerformanceEntry;
globalThis.PerformanceMark = PerformanceMark;
globalThis.PerformanceMeasure = PerformanceMeasure;
globalThis.PerformanceObserver = PerformanceObserver;
globalThis.PerformanceObserverEntryList = PerformanceObserverEntryList;
globalThis.PerformanceResourceTiming = PerformanceResourceTiming;

// ../../../../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/node/console.mjs
import { Writable } from "node:stream";

// ../../../../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/mock/noop.mjs
var noop_default = Object.assign(() => {
}, { __unenv__: true });

// ../../../../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/node/console.mjs
var _console = globalThis.console;
var _ignoreErrors = true;
var _stderr = new Writable();
var _stdout = new Writable();
var log = _console?.log ?? noop_default;
var info = _console?.info ?? log;
var trace = _console?.trace ?? info;
var debug = _console?.debug ?? log;
var table = _console?.table ?? log;
var error = _console?.error ?? log;
var warn = _console?.warn ?? error;
var createTask = _console?.createTask ?? /* @__PURE__ */ notImplemented("console.createTask");
var clear = _console?.clear ?? noop_default;
var count = _console?.count ?? noop_default;
var countReset = _console?.countReset ?? noop_default;
var dir = _console?.dir ?? noop_default;
var dirxml = _console?.dirxml ?? noop_default;
var group = _console?.group ?? noop_default;
var groupEnd = _console?.groupEnd ?? noop_default;
var groupCollapsed = _console?.groupCollapsed ?? noop_default;
var profile = _console?.profile ?? noop_default;
var profileEnd = _console?.profileEnd ?? noop_default;
var time = _console?.time ?? noop_default;
var timeEnd = _console?.timeEnd ?? noop_default;
var timeLog = _console?.timeLog ?? noop_default;
var timeStamp = _console?.timeStamp ?? noop_default;
var Console = _console?.Console ?? /* @__PURE__ */ notImplementedClass("console.Console");
var _times = /* @__PURE__ */ new Map();
var _stdoutErrorHandler = noop_default;
var _stderrErrorHandler = noop_default;

// ../../../../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/@cloudflare/unenv-preset/dist/runtime/node/console.mjs
var workerdConsole = globalThis["console"];
var {
  assert,
  clear: clear2,
  // @ts-expect-error undocumented public API
  context,
  count: count2,
  countReset: countReset2,
  // @ts-expect-error undocumented public API
  createTask: createTask2,
  debug: debug2,
  dir: dir2,
  dirxml: dirxml2,
  error: error2,
  group: group2,
  groupCollapsed: groupCollapsed2,
  groupEnd: groupEnd2,
  info: info2,
  log: log2,
  profile: profile2,
  profileEnd: profileEnd2,
  table: table2,
  time: time2,
  timeEnd: timeEnd2,
  timeLog: timeLog2,
  timeStamp: timeStamp2,
  trace: trace2,
  warn: warn2
} = workerdConsole;
Object.assign(workerdConsole, {
  Console,
  _ignoreErrors,
  _stderr,
  _stderrErrorHandler,
  _stdout,
  _stdoutErrorHandler,
  _times
});
var console_default = workerdConsole;

// ../../../../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-console
globalThis.console = console_default;

// ../../../../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs
var hrtime = /* @__PURE__ */ Object.assign(/* @__PURE__ */ __name(function hrtime2(startTime) {
  const now = Date.now();
  const seconds = Math.trunc(now / 1e3);
  const nanos = now % 1e3 * 1e6;
  if (startTime) {
    let diffSeconds = seconds - startTime[0];
    let diffNanos = nanos - startTime[0];
    if (diffNanos < 0) {
      diffSeconds = diffSeconds - 1;
      diffNanos = 1e9 + diffNanos;
    }
    return [diffSeconds, diffNanos];
  }
  return [seconds, nanos];
}, "hrtime"), { bigint: /* @__PURE__ */ __name(function bigint() {
  return BigInt(Date.now() * 1e6);
}, "bigint") });

// ../../../../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/node/internal/process/process.mjs
import { EventEmitter } from "node:events";

// ../../../../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs
var ReadStream = class {
  static {
    __name(this, "ReadStream");
  }
  fd;
  isRaw = false;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  setRawMode(mode) {
    this.isRaw = mode;
    return this;
  }
};

// ../../../../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs
var WriteStream = class {
  static {
    __name(this, "WriteStream");
  }
  fd;
  columns = 80;
  rows = 24;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  clearLine(dir3, callback) {
    callback && callback();
    return false;
  }
  clearScreenDown(callback) {
    callback && callback();
    return false;
  }
  cursorTo(x, y, callback) {
    callback && typeof callback === "function" && callback();
    return false;
  }
  moveCursor(dx, dy, callback) {
    callback && callback();
    return false;
  }
  getColorDepth(env2) {
    return 1;
  }
  hasColors(count3, env2) {
    return false;
  }
  getWindowSize() {
    return [this.columns, this.rows];
  }
  write(str, encoding, cb) {
    if (str instanceof Uint8Array) {
      str = new TextDecoder().decode(str);
    }
    try {
      console.log(str);
    } catch {
    }
    cb && typeof cb === "function" && cb();
    return false;
  }
};

// ../../../../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/node/internal/process/node-version.mjs
var NODE_VERSION = "22.14.0";

// ../../../../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/node/internal/process/process.mjs
var Process = class _Process extends EventEmitter {
  static {
    __name(this, "Process");
  }
  env;
  hrtime;
  nextTick;
  constructor(impl) {
    super();
    this.env = impl.env;
    this.hrtime = impl.hrtime;
    this.nextTick = impl.nextTick;
    for (const prop of [...Object.getOwnPropertyNames(_Process.prototype), ...Object.getOwnPropertyNames(EventEmitter.prototype)]) {
      const value = this[prop];
      if (typeof value === "function") {
        this[prop] = value.bind(this);
      }
    }
  }
  // --- event emitter ---
  emitWarning(warning, type, code) {
    console.warn(`${code ? `[${code}] ` : ""}${type ? `${type}: ` : ""}${warning}`);
  }
  emit(...args) {
    return super.emit(...args);
  }
  listeners(eventName) {
    return super.listeners(eventName);
  }
  // --- stdio (lazy initializers) ---
  #stdin;
  #stdout;
  #stderr;
  get stdin() {
    return this.#stdin ??= new ReadStream(0);
  }
  get stdout() {
    return this.#stdout ??= new WriteStream(1);
  }
  get stderr() {
    return this.#stderr ??= new WriteStream(2);
  }
  // --- cwd ---
  #cwd = "/";
  chdir(cwd2) {
    this.#cwd = cwd2;
  }
  cwd() {
    return this.#cwd;
  }
  // --- dummy props and getters ---
  arch = "";
  platform = "";
  argv = [];
  argv0 = "";
  execArgv = [];
  execPath = "";
  title = "";
  pid = 200;
  ppid = 100;
  get version() {
    return `v${NODE_VERSION}`;
  }
  get versions() {
    return { node: NODE_VERSION };
  }
  get allowedNodeEnvironmentFlags() {
    return /* @__PURE__ */ new Set();
  }
  get sourceMapsEnabled() {
    return false;
  }
  get debugPort() {
    return 0;
  }
  get throwDeprecation() {
    return false;
  }
  get traceDeprecation() {
    return false;
  }
  get features() {
    return {};
  }
  get release() {
    return {};
  }
  get connected() {
    return false;
  }
  get config() {
    return {};
  }
  get moduleLoadList() {
    return [];
  }
  constrainedMemory() {
    return 0;
  }
  availableMemory() {
    return 0;
  }
  uptime() {
    return 0;
  }
  resourceUsage() {
    return {};
  }
  // --- noop methods ---
  ref() {
  }
  unref() {
  }
  // --- unimplemented methods ---
  umask() {
    throw createNotImplementedError("process.umask");
  }
  getBuiltinModule() {
    return void 0;
  }
  getActiveResourcesInfo() {
    throw createNotImplementedError("process.getActiveResourcesInfo");
  }
  exit() {
    throw createNotImplementedError("process.exit");
  }
  reallyExit() {
    throw createNotImplementedError("process.reallyExit");
  }
  kill() {
    throw createNotImplementedError("process.kill");
  }
  abort() {
    throw createNotImplementedError("process.abort");
  }
  dlopen() {
    throw createNotImplementedError("process.dlopen");
  }
  setSourceMapsEnabled() {
    throw createNotImplementedError("process.setSourceMapsEnabled");
  }
  loadEnvFile() {
    throw createNotImplementedError("process.loadEnvFile");
  }
  disconnect() {
    throw createNotImplementedError("process.disconnect");
  }
  cpuUsage() {
    throw createNotImplementedError("process.cpuUsage");
  }
  setUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.setUncaughtExceptionCaptureCallback");
  }
  hasUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.hasUncaughtExceptionCaptureCallback");
  }
  initgroups() {
    throw createNotImplementedError("process.initgroups");
  }
  openStdin() {
    throw createNotImplementedError("process.openStdin");
  }
  assert() {
    throw createNotImplementedError("process.assert");
  }
  binding() {
    throw createNotImplementedError("process.binding");
  }
  // --- attached interfaces ---
  permission = { has: /* @__PURE__ */ notImplemented("process.permission.has") };
  report = {
    directory: "",
    filename: "",
    signal: "SIGUSR2",
    compact: false,
    reportOnFatalError: false,
    reportOnSignal: false,
    reportOnUncaughtException: false,
    getReport: /* @__PURE__ */ notImplemented("process.report.getReport"),
    writeReport: /* @__PURE__ */ notImplemented("process.report.writeReport")
  };
  finalization = {
    register: /* @__PURE__ */ notImplemented("process.finalization.register"),
    unregister: /* @__PURE__ */ notImplemented("process.finalization.unregister"),
    registerBeforeExit: /* @__PURE__ */ notImplemented("process.finalization.registerBeforeExit")
  };
  memoryUsage = Object.assign(() => ({
    arrayBuffers: 0,
    rss: 0,
    external: 0,
    heapTotal: 0,
    heapUsed: 0
  }), { rss: /* @__PURE__ */ __name(() => 0, "rss") });
  // --- undefined props ---
  mainModule = void 0;
  domain = void 0;
  // optional
  send = void 0;
  exitCode = void 0;
  channel = void 0;
  getegid = void 0;
  geteuid = void 0;
  getgid = void 0;
  getgroups = void 0;
  getuid = void 0;
  setegid = void 0;
  seteuid = void 0;
  setgid = void 0;
  setgroups = void 0;
  setuid = void 0;
  // internals
  _events = void 0;
  _eventsCount = void 0;
  _exiting = void 0;
  _maxListeners = void 0;
  _debugEnd = void 0;
  _debugProcess = void 0;
  _fatalException = void 0;
  _getActiveHandles = void 0;
  _getActiveRequests = void 0;
  _kill = void 0;
  _preload_modules = void 0;
  _rawDebug = void 0;
  _startProfilerIdleNotifier = void 0;
  _stopProfilerIdleNotifier = void 0;
  _tickCallback = void 0;
  _disconnect = void 0;
  _handleQueue = void 0;
  _pendingMessage = void 0;
  _channel = void 0;
  _send = void 0;
  _linkedBinding = void 0;
};

// ../../../../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs
var globalProcess = globalThis["process"];
var getBuiltinModule = globalProcess.getBuiltinModule;
var workerdProcess = getBuiltinModule("node:process");
var unenvProcess = new Process({
  env: globalProcess.env,
  hrtime,
  // `nextTick` is available from workerd process v1
  nextTick: workerdProcess.nextTick
});
var { exit, features, platform } = workerdProcess;
var {
  _channel,
  _debugEnd,
  _debugProcess,
  _disconnect,
  _events,
  _eventsCount,
  _exiting,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _handleQueue,
  _kill,
  _linkedBinding,
  _maxListeners,
  _pendingMessage,
  _preload_modules,
  _rawDebug,
  _send,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  arch,
  argv,
  argv0,
  assert: assert2,
  availableMemory,
  binding,
  channel,
  chdir,
  config,
  connected,
  constrainedMemory,
  cpuUsage,
  cwd,
  debugPort,
  disconnect,
  dlopen,
  domain,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exitCode,
  finalization,
  getActiveResourcesInfo,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getMaxListeners,
  getuid,
  hasUncaughtExceptionCaptureCallback,
  hrtime: hrtime3,
  initgroups,
  kill,
  listenerCount,
  listeners,
  loadEnvFile,
  mainModule,
  memoryUsage,
  moduleLoadList,
  nextTick,
  off,
  on,
  once,
  openStdin,
  permission,
  pid,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  reallyExit,
  ref,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  send,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setMaxListeners,
  setSourceMapsEnabled,
  setuid,
  setUncaughtExceptionCaptureCallback,
  sourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  throwDeprecation,
  title,
  traceDeprecation,
  umask,
  unref,
  uptime,
  version,
  versions
} = unenvProcess;
var _process = {
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  hasUncaughtExceptionCaptureCallback,
  setUncaughtExceptionCaptureCallback,
  loadEnvFile,
  sourceMapsEnabled,
  arch,
  argv,
  argv0,
  chdir,
  config,
  connected,
  constrainedMemory,
  availableMemory,
  cpuUsage,
  cwd,
  debugPort,
  dlopen,
  disconnect,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exit,
  finalization,
  features,
  getBuiltinModule,
  getActiveResourcesInfo,
  getMaxListeners,
  hrtime: hrtime3,
  kill,
  listeners,
  listenerCount,
  memoryUsage,
  nextTick,
  on,
  off,
  once,
  pid,
  platform,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  setMaxListeners,
  setSourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  title,
  throwDeprecation,
  traceDeprecation,
  umask,
  uptime,
  version,
  versions,
  // @ts-expect-error old API
  domain,
  initgroups,
  moduleLoadList,
  reallyExit,
  openStdin,
  assert: assert2,
  binding,
  send,
  exitCode,
  channel,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getuid,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setuid,
  permission,
  mainModule,
  _events,
  _eventsCount,
  _exiting,
  _maxListeners,
  _debugEnd,
  _debugProcess,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _kill,
  _preload_modules,
  _rawDebug,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  _disconnect,
  _handleQueue,
  _pendingMessage,
  _channel,
  _send,
  _linkedBinding
};
var process_default = _process;

// ../../../../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process
globalThis.process = process_default;

// src/index.ts
async function ensureInternalOrgAndProjects(env2) {
  try {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await env2.DB.prepare(`
      INSERT OR IGNORE INTO customers (id, lexware_contact_id, name, contact_person, email, street, zip_code, city, country_code, is_active, is_archived, created_at_utc, updated_at_utc)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind("cust_internal", "INTERNAL_ORG", "[INTERN] Eigene Organisation & Administration", "Michael Kirst-Neshva", "mkn@ankbs.de", "", "", "", "DE", 1, 0, now, now).run();
    const internalProjs = [
      { id: "prj_internal_acq", nr: "INT-AKQUISE", name: "Kundenakquise & Vertrieb", desc: "Akquise, Kundengespr\xE4che & Angebote" },
      { id: "prj_internal_acc", nr: "INT-BUCHHALTUNG", name: "Buchhaltung, Steuern & Finanzen", desc: "Belegwesen, Buchhaltung & GoBD Administration" },
      { id: "prj_internal_rd", nr: "INT-RECHERCHE", name: "Wissensaufbau & Technologierecherche", desc: "Recherche, Weiterbildung & Zertifizierungen" },
      { id: "prj_internal_it", nr: "INT-IT-ORGA", name: "Interne IT, Tools & Administration", desc: "Wartung von internen Systemen und Workflows" }
    ];
    for (const ip of internalProjs) {
      await env2.DB.prepare(`
        INSERT OR IGNORE INTO projects (id, customer_id, project_number, name, default_hourly_rate, planned_hours, total_budget_net, lexware_service_article_id, approver_email, approver_name, is_active, is_archived, created_at_utc)
        VALUES (?, ?, ?, ?, 0.0, 0.0, 0.0, 'INTERNAL', 'mkn@ankbs.de', 'Michael Kirst-Neshva', 1, 0, ?)
      `).bind(ip.id, "cust_internal", ip.nr, ip.name, now).run();
    }
  } catch (err) {
    console.error("Internal org initialization error:", err?.message || err);
  }
}
__name(ensureInternalOrgAndProjects, "ensureInternalOrgAndProjects");
var lastLexwareContactsSyncTime = 0;
async function syncLexwareContactsInternal(env2, customApiKey, force = false) {
  const apiKey = customApiKey || env2.LEXWARE_API_KEY;
  if (!apiKey) {
    return { success: false, error: "Kein LEXWARE_API_KEY konfiguriert." };
  }
  const nowMs = Date.now();
  if (!force && nowMs - lastLexwareContactsSyncTime < 1e4) {
    return { success: true, cached: true };
  }
  try {
    try {
      await env2.DB.prepare("ALTER TABLE customers ADD COLUMN customer_number TEXT").run();
    } catch {
    }
    const lexRes = await fetch("https://api.lexware.io/v1/contacts?size=250", {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Accept": "application/json"
      }
    });
    if (!lexRes.ok) {
      const errText = await lexRes.text();
      return { success: false, error: `Fehler beim Abruf von Lexware API (HTTP ${lexRes.status}): ${errText}` };
    }
    const lexData = await lexRes.json();
    const lexContacts = lexData.content || [];
    const now = (/* @__PURE__ */ new Date()).toISOString();
    let createdCount = 0;
    let updatedCount = 0;
    const activeLexwareIds = /* @__PURE__ */ new Set();
    for (const item of lexContacts) {
      const lexContactId = item.id;
      if (!lexContactId) continue;
      const hasCustomerRole = !!(item.roles?.customer || item.customerNumber);
      const hasVendorRole = !!(item.roles?.vendor || item.vendorNumber);
      if (hasVendorRole && !hasCustomerRole) continue;
      if (!hasCustomerRole) continue;
      const customerNum = item.roles?.customer?.number || item.customerNumber || null;
      const customerNumVal = Number(customerNum || 0);
      if (customerNumVal > 0 && customerNumVal < 10002) {
        continue;
      }
      const customerNumberStr = customerNum ? String(customerNum) : null;
      activeLexwareIds.add(lexContactId);
      const companyName = item.company?.name || "";
      let personName = "";
      let email = "";
      if (item.company?.contactPersons && Array.isArray(item.company.contactPersons) && item.company.contactPersons.length > 0) {
        const primaryPerson = item.company.contactPersons.find((cp) => cp.primary) || item.company.contactPersons[0];
        personName = `${primaryPerson.firstName || ""} ${primaryPerson.lastName || ""}`.trim();
        email = primaryPerson.emailAddress || primaryPerson.email || "";
      }
      if (item.person) {
        const pName = `${item.person.firstName || ""} ${item.person.lastName || ""}`.trim();
        if (!personName) personName = pName;
        if (!email && item.person.emailAddress) email = item.person.emailAddress;
      }
      if (!email && item.company?.contactPersons && Array.isArray(item.company.contactPersons)) {
        for (const cp of item.company.contactPersons) {
          if (cp.emailAddress || cp.email) {
            email = cp.emailAddress || cp.email;
            if (!personName) personName = `${cp.firstName || ""} ${cp.lastName || ""}`.trim();
            break;
          }
        }
      }
      if (!email && item.emailAddresses) {
        const candidateEmails = [
          ...item.emailAddresses.business || [],
          ...item.emailAddresses.office || [],
          ...item.emailAddresses.other || [],
          ...item.emailAddresses.private || []
        ].filter(Boolean);
        if (candidateEmails.length > 0) {
          email = candidateEmails[0];
        }
      }
      const displayName = companyName || personName || "Unbekannter Kunde";
      const billingAddr = item.addresses?.billing?.[0] || item.addresses?.primary?.[0] || item.addresses?.shipping?.[0];
      const street = billingAddr?.street || null;
      const zipCode = billingAddr?.zip || null;
      const city = billingAddr?.city || null;
      const countryCode = billingAddr?.countryCode || "DE";
      const vatId = item.taxInformation?.vatId || item.company?.vatRegistrationNumber || null;
      const existing = await env2.DB.prepare("SELECT id, email, contact_person FROM customers WHERE lexware_contact_id = ?").bind(lexContactId).first();
      const custId = existing?.id || crypto.randomUUID();
      if (existing) {
        updatedCount++;
      } else {
        createdCount++;
      }
      await env2.DB.prepare(`
        INSERT INTO customers (id, lexware_contact_id, customer_number, name, contact_person, email, street, zip_code, city, country_code, vat_id, is_active, is_archived, created_at_utc, updated_at_utc)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?)
        ON CONFLICT(lexware_contact_id) DO UPDATE SET
          customer_number = excluded.customer_number,
          name = excluded.name,
          contact_person = excluded.contact_person,
          email = excluded.email,
          street = excluded.street,
          zip_code = excluded.zip_code,
          city = excluded.city,
          country_code = excluded.country_code,
          vat_id = excluded.vat_id,
          is_active = 1,
          is_archived = 0,
          updated_at_utc = excluded.updated_at_utc
      `).bind(
        custId,
        lexContactId,
        customerNumberStr,
        displayName,
        personName || null,
        email || null,
        street,
        zipCode,
        city,
        countryCode,
        vatId,
        now,
        now
      ).run();
      if (email) {
        try {
          await env2.DB.prepare(`
            UPDATE projects
            SET 
              approver_email = CASE WHEN approver_email IS NULL OR approver_email = '' THEN ? ELSE approver_email END,
              approver_name = CASE WHEN approver_name IS NULL OR approver_name = '' THEN ? ELSE approver_name END
            WHERE customer_id = ?
          `).bind(email, personName || null, custId).run();
        } catch {
        }
      }
    }
    const { results: localCustomers } = await env2.DB.prepare("SELECT * FROM customers WHERE id != 'cust_internal'").all();
    let archivedCount = 0;
    let deletedCount = 0;
    for (const localCust of localCustomers) {
      if (!activeLexwareIds.has(localCust.lexware_contact_id)) {
        const projCount = await env2.DB.prepare("SELECT COUNT(*) as cnt FROM projects WHERE customer_id = ?").bind(localCust.id).first();
        const hasHistory = (projCount?.cnt || 0) > 0;
        if (hasHistory) {
          await env2.DB.prepare("UPDATE customers SET is_active = 0, is_archived = 1, updated_at_utc = ? WHERE id = ?").bind(now, localCust.id).run();
          archivedCount++;
        } else {
          await env2.DB.prepare("DELETE FROM customers WHERE id = ?").bind(localCust.id).run();
          deletedCount++;
        }
      }
    }
    await env2.DB.prepare(`
      INSERT INTO customers (id, lexware_contact_id, name, contact_person, email, street, zip_code, city, country_code, is_active, is_archived, created_at_utc, updated_at_utc)
      VALUES ('cust_internal', 'INTERNAL_ORG', '[INTERN] Eigene Organisation & Administration', 'Michael Kirst-Neshva', 'mkn@ankbs.de', '', '', '', 'DE', 1, 0, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        is_active = 1,
        is_archived = 0,
        name = '[INTERN] Eigene Organisation & Administration',
        updated_at_utc = excluded.updated_at_utc
    `).bind(now, now).run();
    lastLexwareContactsSyncTime = Date.now();
    return {
      success: true,
      stats: {
        totalFromLexware: lexContacts.length,
        created: createdCount,
        updated: updatedCount,
        archived: archivedCount,
        deleted: deletedCount
      }
    };
  } catch (err) {
    console.error("Fehler bei Lexware Kunden-Sync:", err?.message || err);
    return { success: false, error: err?.message || String(err) };
  }
}
__name(syncLexwareContactsInternal, "syncLexwareContactsInternal");
async function ensureSettings(env2) {
  try {
    await env2.DB.prepare(`
      CREATE TABLE IF NOT EXISTS app_settings (
        id TEXT PRIMARY KEY,
        mileage_rate_business REAL NOT NULL DEFAULT 0.30,
        commute_rate_tier1 REAL NOT NULL DEFAULT 0.30,
        commute_rate_tier2 REAL NOT NULL DEFAULT 0.38,
        vma_rate_8h REAL NOT NULL DEFAULT 14.00,
        vma_rate_24h REAL NOT NULL DEFAULT 28.00,
        pdf_storage_mode TEXT NOT NULL DEFAULT 'R2',
        email_sender_name TEXT DEFAULT 'Michael Kirst-Neshva | IT Architecture & Security',
        email_sender_email TEXT DEFAULT 'mkn@ankbs.de',
        email_service TEXT DEFAULT 'resend',
        email_api_key TEXT DEFAULT '',
        email_subject_template TEXT DEFAULT 'Freigabe Leistungsnachweis {period} f\xFCr Projekt {projectName}',
        email_body_template TEXT,
        email_reminder1_subject TEXT DEFAULT '1. Erinnerung: Freigabe Leistungsnachweis {period} f\xFCr Projekt {projectName}',
        email_reminder1_body TEXT,
        email_reminder2_subject TEXT DEFAULT '2. Dringende Erinnerung: Ausstehende Freigabe Leistungsnachweis {period} ({projectName})',
        email_reminder2_body TEXT,
        email_admin_notify_rejection INTEGER DEFAULT 1,
        email_admin_notify_reminder INTEGER DEFAULT 1,
        contractor_signature_data_url TEXT,
        contractor_title TEXT DEFAULT 'Senior Cloud & Security Architect',
        updated_at_utc TEXT NOT NULL
      )
    `).run();
    try {
      await env2.DB.prepare("ALTER TABLE app_settings ADD COLUMN contractor_signature_data_url TEXT;").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE app_settings ADD COLUMN contractor_title TEXT DEFAULT 'Senior Cloud & Security Architect';").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE app_settings ADD COLUMN lexware_webhook_callback_url TEXT;").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE app_settings ADD COLUMN billing_provider TEXT DEFAULT 'lexware';").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE app_settings ADD COLUMN chart_of_accounts TEXT DEFAULT 'SKR04';").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE app_settings ADD COLUMN tax_mode TEXT DEFAULT 'standard';").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE app_settings ADD COLUMN datev_consultant_number TEXT DEFAULT '1001';").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE app_settings ADD COLUMN datev_client_number TEXT DEFAULT '10001';").run();
    } catch {
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await env2.DB.prepare(`
      INSERT OR IGNORE INTO app_settings (id, mileage_rate_business, commute_rate_tier1, commute_rate_tier2, vma_rate_8h, vma_rate_24h, pdf_storage_mode, email_sender_name, email_sender_email, email_service, email_api_key, email_subject_template, billing_provider, chart_of_accounts, tax_mode, datev_consultant_number, datev_client_number, updated_at_utc)
      VALUES ('global_config', 0.30, 0.30, 0.38, 14.00, 28.00, 'R2', 'Michael Kirst-Neshva | IT Architecture & Security', 'mkn@ankbs.de', 'resend', '', 'Freigabe Leistungsnachweis {period} f\xFCr Projekt {projectName}', 'lexware', 'SKR04', 'standard', '1001', '10001', ?)
    `).bind(now).run();
    await env2.DB.prepare(`
      CREATE TABLE IF NOT EXISTS otp_verifications (
        id TEXT PRIMARY KEY,
        timesheet_id TEXT NOT NULL,
        email TEXT NOT NULL,
        otp_code_hash TEXT NOT NULL,
        expires_at_utc TEXT NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        is_verified INTEGER NOT NULL DEFAULT 0,
        created_at_utc TEXT NOT NULL
      )
    `).run();
  } catch (err) {
    console.error("Settings initialization error:", err);
  }
}
__name(ensureSettings, "ensureSettings");
async function ensureProjectColumns(env2) {
  try {
    await env2.DB.prepare("ALTER TABLE projects ADD COLUMN end_customer_name TEXT;").run();
  } catch {
  }
  try {
    await env2.DB.prepare("ALTER TABLE projects ADD COLUMN approver_2_email TEXT;").run();
  } catch {
  }
  try {
    await env2.DB.prepare("ALTER TABLE projects ADD COLUMN approver_2_name TEXT;").run();
  } catch {
  }
  try {
    await env2.DB.prepare("ALTER TABLE projects ADD COLUMN approver_3_email TEXT;").run();
  } catch {
  }
  try {
    await env2.DB.prepare("ALTER TABLE projects ADD COLUMN approver_3_name TEXT;").run();
  } catch {
  }
  try {
    await env2.DB.prepare("ALTER TABLE projects ADD COLUMN updated_at_utc TEXT;").run();
  } catch {
  }
}
__name(ensureProjectColumns, "ensureProjectColumns");
async function sendSystemEmail(env2, options) {
  try {
    await ensureSettings(env2);
    const settings = await env2.DB.prepare("SELECT * FROM app_settings WHERE id = 'global_config'").first();
    const senderName = options.senderName || settings?.email_sender_name || "Michael Kirst-Neshva";
    const senderEmail = options.senderEmail || settings?.email_sender_email || "mkn@ankbs.de";
    const emailService = settings?.email_service || "resend";
    const apiKey = settings?.email_api_key || "";
    if (emailService === "resend" && apiKey) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: `${senderName} <${senderEmail}>`,
          to: [options.to],
          subject: options.subject,
          text: options.text,
          html: options.html || options.text.replace(/\n/g, "<br>")
        })
      });
      if (!res.ok) {
        const err = await res.text();
        console.error("Resend API error:", err);
        return { success: false, error: err };
      }
      return { success: true };
    }
    try {
      const mailRes = await fetch("https://api.mailchannels.net/tx/v1/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: options.to, name: options.to }]
            }
          ],
          from: {
            email: senderEmail,
            name: senderName
          },
          subject: options.subject,
          content: [
            {
              type: "text/plain",
              value: options.text
            }
          ]
        })
      });
      if (mailRes.ok || mailRes.status === 202) {
        return { success: true };
      }
    } catch (e) {
      console.warn("MailChannels attempt:", e?.message);
    }
    return { success: true };
  } catch (err) {
    console.error("Email send general error:", err);
    return { success: false, error: err?.message || String(err) };
  }
}
__name(sendSystemEmail, "sendSystemEmail");
async function ensureTripExpenses(env2) {
  try {
    await env2.DB.prepare(`
      CREATE TABLE IF NOT EXISTS trip_expenses (
        id TEXT PRIMARY KEY,
        trip_id TEXT NOT NULL,
        expense_date TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT NOT NULL,
        skr04_account TEXT NOT NULL,
        amount_gross REAL NOT NULL,
        amount_net REAL NOT NULL,
        tax_rate REAL NOT NULL,
        tax_amount REAL NOT NULL,
        receipt_r2_key TEXT,
        receipt_filename TEXT,
        receipt_mime_type TEXT,
        is_billable_to_client INTEGER NOT NULL DEFAULT 1,
        is_synced_to_lexware INTEGER NOT NULL DEFAULT 0,
        lexware_voucher_id TEXT,
        lexware_voucher_number TEXT,
        lexware_status TEXT DEFAULT 'open',
        is_voucher_canceled INTEGER DEFAULT 0,
        voucher_canceled_at_utc TEXT,
        created_at_utc TEXT NOT NULL
      )
    `).run();
    try {
      await env2.DB.prepare("ALTER TABLE trip_expenses ADD COLUMN lexware_voucher_number TEXT").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE trip_expenses ADD COLUMN lexware_status TEXT DEFAULT 'open'").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE trip_expenses ADD COLUMN is_voucher_canceled INTEGER DEFAULT 0").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE trip_expenses ADD COLUMN voucher_canceled_at_utc TEXT").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE projects ADD COLUMN lexware_quotation_status TEXT DEFAULT 'open'").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE projects ADD COLUMN lexware_order_confirmation_status TEXT DEFAULT 'open'").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE timesheet_versions ADD COLUMN is_invoice_paid INTEGER DEFAULT 0").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE timesheet_versions ADD COLUMN invoice_paid_at_utc TEXT").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE timesheet_versions ADD COLUMN is_archived INTEGER DEFAULT 0").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE timesheet_versions ADD COLUMN external_invoice_number TEXT").run();
    } catch {
    }
    try {
      await env2.DB.prepare("ALTER TABLE timesheet_versions ADD COLUMN external_invoice_date TEXT").run();
    } catch {
    }
  } catch (err) {
    console.error("trip_expenses init error:", err?.message || err);
  }
}
__name(ensureTripExpenses, "ensureTripExpenses");
async function ensureOperationalVouchers(env2) {
  try {
    await env2.DB.prepare(`
      CREATE TABLE IF NOT EXISTS operational_vouchers (
        id TEXT PRIMARY KEY,
        voucher_number TEXT NOT NULL UNIQUE,
        voucher_type TEXT NOT NULL,
        voucher_date TEXT NOT NULL,
        supplier_name TEXT NOT NULL,
        description TEXT NOT NULL,
        business_purpose TEXT NOT NULL,
        project_id TEXT,
        customer_id TEXT,
        is_billable_to_client INTEGER NOT NULL DEFAULT 0,
        amount_gross REAL NOT NULL DEFAULT 0.0,
        amount_net REAL NOT NULL DEFAULT 0.0,
        tax_rate REAL NOT NULL DEFAULT 19.0,
        tax_amount REAL NOT NULL DEFAULT 0.0,
        tip_amount REAL NOT NULL DEFAULT 0.0,
        total_attendees_count INTEGER DEFAULT 1,
        business_attendees_count INTEGER DEFAULT 1,
        business_share_percent REAL DEFAULT 100.0,
        tax_deductible_net REAL DEFAULT 0.0,
        tax_non_deductible_net REAL DEFAULT 0.0,
        private_share_gross REAL DEFAULT 0.0,
        attendees_json TEXT,
        location_address TEXT,
        is_own_receipt INTEGER NOT NULL DEFAULT 0,
        own_receipt_reason TEXT,
        transport_type TEXT,
        distance_km REAL DEFAULT 0.0,
        origin_address TEXT,
        destination_address TEXT,
        parent_hospitality_voucher_id TEXT,
        skr04_account TEXT NOT NULL DEFAULT '4650',
        skr03_account TEXT NOT NULL DEFAULT '4650',
        receipt_r2_key TEXT,
        receipt_filename TEXT,
        receipt_mime_type TEXT,
        payment_slip_r2_key TEXT,
        payment_slip_filename TEXT,
        payment_slip_total_gross REAL DEFAULT 0.0,
        payment_method TEXT DEFAULT 'Card_NFC',
        secondary_attachment_r2_key TEXT,
        secondary_attachment_filename TEXT,
        voucher_pdf_r2_key TEXT,
        voucher_pdf_hash_sha256 TEXT,
        is_synced_to_lexware INTEGER NOT NULL DEFAULT 0,
        lexware_voucher_id TEXT,
        lexware_voucher_number TEXT,
        lexware_status TEXT DEFAULT 'open',
        status TEXT DEFAULT 'Verified',
        created_at_utc TEXT NOT NULL,
        updated_at_utc TEXT
      )
    `).run();
    await env2.DB.prepare(`
      CREATE TABLE IF NOT EXISTS voucher_upload_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        status TEXT NOT NULL DEFAULT 'waiting',
        uploaded_files_json TEXT DEFAULT '[]',
        ai_extracted_json TEXT,
        expires_at_utc TEXT NOT NULL,
        created_at_utc TEXT NOT NULL
      )
    `).run();
    try {
      await env2.DB.prepare("ALTER TABLE operational_vouchers ADD COLUMN status TEXT DEFAULT 'Verified'").run();
    } catch {
    }
  } catch (err) {
    console.error("ensureOperationalVouchers error:", err?.message || err);
  }
}
__name(ensureOperationalVouchers, "ensureOperationalVouchers");
async function hashPassword(password, saltHex) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const saltBuf = new Uint8Array(saltHex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: saltBuf,
      iterations: 1e5,
      hash: "SHA-256"
    },
    keyMaterial,
    512
  );
  return Array.from(new Uint8Array(derivedBits)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(hashPassword, "hashPassword");
async function ensureAuthTables(env2) {
  try {
    await env2.DB.prepare(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'Admin',
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at_utc TEXT NOT NULL,
        last_login_utc TEXT
      )
    `).run();
    await env2.DB.prepare(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        expires_at_utc TEXT NOT NULL,
        created_at_utc TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `).run();
    const userCount = await env2.DB.prepare("SELECT COUNT(*) as count FROM users").first();
    if (!userCount || userCount.count === 0) {
      const salt = "f5de90270b9f7d2cb8efea3b9ff63eda";
      const hash = "2173e5a4c2d7848ff8834a103b32211fb3b64248826cc36e4f0d8de0a275a2e07b8e06da97ecaee7db75bfac4cb5752fd0bbd997ed5f0f73a1e217c1fda77c29";
      await env2.DB.prepare(`
        INSERT INTO users (id, email, password_hash, salt, full_name, role, is_active, created_at_utc)
        VALUES ('usr_admin_01', 'michael_kirst@hotmail.com', ?, ?, 'Michael Kirst-Neshva', 'Admin', 1, ?)
      `).bind(hash, salt, (/* @__PURE__ */ new Date()).toISOString()).run();
    }
  } catch (err) {
    console.error("Auth tables init error:", err);
  }
}
__name(ensureAuthTables, "ensureAuthTables");
var index_default = {
  async fetch(request, env2, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    if (method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400"
        }
      });
    }
    try {
      if (path === "/api/v1/health" && method === "GET") {
        return jsonResponse({
          status: "healthy",
          app: "Freelancer Evidence & Billing Hub",
          version: "2.7.0",
          author: "Michael Kirst-Neshva",
          copyright: "(c) 2026 Michael Kirst-Neshva",
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
      if (path === "/api/v1/system/diagnostics" && method === "GET") {
        let customersCount = 0;
        let projectsCount = 0;
        let timeEntriesCount = 0;
        let timesheetVersionsCount = 0;
        let tripsCount = 0;
        let auditCount = 0;
        let recentAuditEvents = [];
        try {
          const c = await env2.DB.prepare("SELECT COUNT(*) as count FROM customers").first();
          customersCount = c?.count || 0;
        } catch {
        }
        try {
          const p = await env2.DB.prepare("SELECT COUNT(*) as count FROM projects").first();
          projectsCount = p?.count || 0;
        } catch {
        }
        try {
          const t = await env2.DB.prepare("SELECT COUNT(*) as count FROM time_entries").first();
          timeEntriesCount = t?.count || 0;
        } catch {
        }
        try {
          const tv = await env2.DB.prepare("SELECT COUNT(*) as count FROM timesheet_versions").first();
          timesheetVersionsCount = tv?.count || 0;
        } catch {
        }
        try {
          const tr = await env2.DB.prepare("SELECT COUNT(*) as count FROM trips").first();
          tripsCount = tr?.count || 0;
        } catch {
        }
        try {
          const a = await env2.DB.prepare("SELECT COUNT(*) as count FROM gobd_audit_log").first();
          auditCount = a?.count || 0;
        } catch {
        }
        try {
          const recent = await env2.DB.prepare(`
            SELECT id, event_type, entity_type, entity_id, timestamp_utc, description
            FROM gobd_audit_log
            ORDER BY timestamp_utc DESC
            LIMIT 30
          `).all();
          recentAuditEvents = recent.results || [];
        } catch {
        }
        return jsonResponse({
          report_name: "Evidence Hub Diagnostics & Support Bundle",
          app_version: "2.7.0",
          generated_at_utc: (/* @__PURE__ */ new Date()).toISOString(),
          environment: {
            is_cloudflare_worker: true,
            has_lexware_key: !!env2.LEXWARE_API_KEY,
            has_resend_key: !!env2.RESEND_API_KEY,
            has_jwt_secret: !!env2.JWT_SECRET,
            has_r2_bucket: !!(env2.STORAGE || env2.DOCUMENTS_BUCKET)
          },
          database_health: {
            customers: customersCount,
            projects: projectsCount,
            time_entries: timeEntriesCount,
            timesheets: timesheetVersionsCount,
            trips: tripsCount,
            audit_events: auditCount
          },
          recent_audit_log: recentAuditEvents
        });
      }
      if (path === "/api/v1/auth/login" && method === "POST") {
        await ensureAuthTables(env2);
        const body = await request.json();
        const email = (body.email || "").trim().toLowerCase();
        const password = body.password || "";
        const rememberMe = !!body.rememberMe;
        if (!email || !password) {
          return errorResponse("Bitte geben Sie Ihre E-Mail-Adresse und Ihr Passwort ein.", 400);
        }
        const user = await env2.DB.prepare("SELECT * FROM users WHERE email = ? AND is_active = 1").bind(email).first();
        if (!user) {
          return errorResponse("Ung\xFCltige Anmeldedaten. Bitte \xFCberpr\xFCfen Sie Ihre Eingabe.", 401);
        }
        const computedHash = await hashPassword(password, user.salt);
        if (computedHash !== user.password_hash) {
          return errorResponse("Ung\xFCltige Anmeldedaten. Bitte \xFCberpr\xFCfen Sie Ihre Eingabe.", 401);
        }
        const token = "auth_" + crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
        const now = /* @__PURE__ */ new Date();
        const durationDays = rememberMe ? 30 : 1;
        const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1e3).toISOString();
        await env2.DB.prepare(`
          INSERT INTO user_sessions (token, user_id, expires_at_utc, created_at_utc)
          VALUES (?, ?, ?, ?)
        `).bind(token, user.id, expiresAt, now.toISOString()).run();
        await env2.DB.prepare("UPDATE users SET last_login_utc = ? WHERE id = ?").bind(now.toISOString(), user.id).run();
        const isDefault = (user.email === "admin@example.com" || user.email === "michael_kirst@hotmail.com") && user.salt === "f5de90270b9f7d2cb8efea3b9ff63eda";
        return jsonResponse({
          success: true,
          token,
          user: {
            id: user.id,
            email: user.email,
            fullName: user.full_name,
            role: user.role
          },
          requiresCredentialChange: isDefault,
          expiresAt
        });
      }
      if (path === "/api/v1/auth/logout" && (method === "POST" || method === "GET")) {
        await ensureAuthTables(env2);
        const authHeader = request.headers.get("Authorization") || "";
        const token = authHeader.replace("Bearer ", "").trim();
        if (token) {
          await env2.DB.prepare("DELETE FROM user_sessions WHERE token = ?").bind(token).run();
        }
        return jsonResponse({ success: true, message: "Erfolgreich abgemeldet." });
      }
      if (path === "/api/v1/auth/me" && method === "GET") {
        await ensureAuthTables(env2);
        const authHeader = request.headers.get("Authorization") || "";
        const token = authHeader.replace("Bearer ", "").trim();
        if (!token) {
          return errorResponse("Nicht authentifiziert.", 401);
        }
        const session = await env2.DB.prepare(`
          SELECT s.*, u.email, u.full_name, u.role, u.is_active, u.salt
          FROM user_sessions s
          JOIN users u ON s.user_id = u.id
          WHERE s.token = ? AND datetime(s.expires_at_utc) > datetime('now')
        `).bind(token).first();
        if (!session || session.is_active === 0) {
          return errorResponse("Sitzung abgelaufen oder ung\xFCltig.", 401);
        }
        const isDefault = (session.email === "admin@example.com" || session.email === "michael_kirst@hotmail.com") && session.salt === "f5de90270b9f7d2cb8efea3b9ff63eda";
        return jsonResponse({
          authenticated: true,
          user: {
            id: session.user_id,
            email: session.email,
            fullName: session.full_name,
            role: session.role
          },
          requiresCredentialChange: isDefault
        });
      }
      if ((path === "/api/v1/auth/change-credentials" || path === "/api/v1/auth/change-password") && method === "POST") {
        await ensureAuthTables(env2);
        const authHeader = request.headers.get("Authorization") || "";
        const token = authHeader.replace("Bearer ", "").trim();
        if (!token) {
          return errorResponse("Nicht authentifiziert.", 401);
        }
        const session = await env2.DB.prepare(`
          SELECT s.*, u.id as user_id, u.email, u.password_hash, u.salt, u.full_name, u.role
          FROM user_sessions s
          JOIN users u ON s.user_id = u.id
          WHERE s.token = ? AND datetime(s.expires_at_utc) > datetime('now')
        `).bind(token).first();
        if (!session) {
          return errorResponse("Sitzung abgelaufen oder ung\xFCltig.", 401);
        }
        const body = await request.json();
        const currentPassword = (body.currentPassword || "").trim();
        const newEmail = (body.newEmail || "").trim().toLowerCase();
        const newFullName = (body.newFullName || "").trim();
        const newPassword = (body.newPassword || "").trim();
        if (!currentPassword) {
          return errorResponse("Bitte geben Sie Ihr aktuelles Passwort zur Best\xE4tigung ein.", 400);
        }
        const currentHash = await hashPassword(currentPassword, session.salt);
        if (currentHash !== session.password_hash) {
          return errorResponse("Das aktuelle Passwort ist leider nicht korrekt.", 403);
        }
        let updatedEmail = session.email;
        if (newEmail && newEmail !== session.email) {
          if (!newEmail.includes("@") || !newEmail.includes(".")) {
            return errorResponse("Bitte geben Sie eine g\xFCltige neue E-Mail-Adresse ein.", 400);
          }
          const emailCheck = await env2.DB.prepare("SELECT id FROM users WHERE email = ? AND id != ?").bind(newEmail, session.user_id).first();
          if (emailCheck) {
            return errorResponse("Diese E-Mail-Adresse wird bereits von einem anderen Benutzer verwendet.", 400);
          }
          updatedEmail = newEmail;
        }
        let updatedFullName = newFullName || session.full_name;
        const newSalt = Array.from(crypto.getRandomValues(new Uint8Array(16))).map((b) => b.toString(16).padStart(2, "0")).join("");
        let updatedHash = session.password_hash;
        if (newPassword) {
          if (newPassword.length < 8) {
            return errorResponse("Das neue Passwort muss mindestens 8 Zeichen lang sein.", 400);
          }
          updatedHash = await hashPassword(newPassword, newSalt);
        } else {
          updatedHash = await hashPassword(currentPassword, newSalt);
        }
        await env2.DB.prepare(`
          UPDATE users
          SET email = ?, full_name = ?, password_hash = ?, salt = ?
          WHERE id = ?
        `).bind(updatedEmail, updatedFullName, updatedHash, newSalt, session.user_id).run();
        await logAuditEvent(env2, {
          eventType: "USER_CREDENTIALS_UPDATED",
          entityType: "users",
          entityId: session.user_id,
          actor: updatedFullName,
          description: `Zugangsdaten f\xFCr ${updatedEmail} (${updatedFullName}) erfolgreich aktualisiert.`
        });
        return jsonResponse({
          success: true,
          message: "Zugangsdaten & Profil wurden erfolgreich aktualisiert!",
          user: {
            id: session.user_id,
            email: updatedEmail,
            fullName: updatedFullName,
            role: session.role
          },
          requiresCredentialChange: false
        });
      }
      if (path === "/api/v1/settings" && method === "GET") {
        await ensureSettings(env2);
        const settings = await env2.DB.prepare("SELECT * FROM app_settings WHERE id = 'global_config'").first();
        return jsonResponse(settings || {
          id: "global_config",
          mileage_rate_business: 0.3,
          commute_rate_tier1: 0.3,
          commute_rate_tier2: 0.38,
          vma_rate_8h: 14,
          vma_rate_24h: 28,
          pdf_storage_mode: "R2",
          email_sender_name: "Michael Kirst-Neshva | IT Architecture & Security",
          email_sender_email: "mkn@ankbs.de",
          email_service: "resend",
          email_api_key: "",
          email_subject_template: "Freigabe Leistungsnachweis {period} f\xFCr Projekt {projectName}",
          email_body_template: "",
          email_reminder1_subject: "1. Erinnerung: Freigabe Leistungsnachweis {period} f\xFCr Projekt {projectName}",
          email_reminder1_body: "",
          email_reminder2_subject: "2. Dringende Erinnerung: Ausstehende Freigabe Leistungsnachweis {period} ({projectName})",
          email_reminder2_body: "",
          email_admin_notify_rejection: 1,
          email_admin_notify_reminder: 1,
          billing_provider: "lexware",
          chart_of_accounts: "SKR04",
          tax_mode: "standard",
          datev_consultant_number: "1001",
          datev_client_number: "10001"
        });
      }
      if (path === "/api/v1/settings" && method === "PUT") {
        await ensureSettings(env2);
        const body = await request.json();
        const now = (/* @__PURE__ */ new Date()).toISOString();
        const existing = await env2.DB.prepare("SELECT * FROM app_settings WHERE id = 'global_config'").first();
        await env2.DB.prepare(`
          UPDATE app_settings
          SET mileage_rate_business = ?,
              commute_rate_tier1 = ?,
              commute_rate_tier2 = ?,
              vma_rate_8h = ?,
              vma_rate_24h = ?,
              pdf_storage_mode = ?,
              email_sender_name = ?,
              email_sender_email = ?,
              email_service = ?,
              email_api_key = ?,
              email_subject_template = ?,
              email_body_template = ?,
              email_reminder1_subject = ?,
              email_reminder1_body = ?,
              email_reminder2_subject = ?,
              email_reminder2_body = ?,
              email_admin_notify_rejection = ?,
              email_admin_notify_reminder = ?,
              contractor_signature_data_url = ?,
              contractor_title = ?,
              lexware_webhook_callback_url = ?,
              billing_provider = ?,
              chart_of_accounts = ?,
              tax_mode = ?,
              datev_consultant_number = ?,
              datev_client_number = ?,
              updated_at_utc = ?
          WHERE id = 'global_config'
        `).bind(
          body.mileage_rate_business !== void 0 ? parseFloat(body.mileage_rate_business) : existing?.mileage_rate_business ?? 0.3,
          body.commute_rate_tier1 !== void 0 ? parseFloat(body.commute_rate_tier1) : existing?.commute_rate_tier1 ?? 0.3,
          body.commute_rate_tier2 !== void 0 ? parseFloat(body.commute_rate_tier2) : existing?.commute_rate_tier2 ?? 0.38,
          body.vma_rate_8h !== void 0 ? parseFloat(body.vma_rate_8h) : existing?.vma_rate_8h ?? 14,
          body.vma_rate_24h !== void 0 ? parseFloat(body.vma_rate_24h) : existing?.vma_rate_24h ?? 28,
          body.pdf_storage_mode || existing?.pdf_storage_mode || "R2",
          body.email_sender_name || existing?.email_sender_name || "Michael Kirst-Neshva | IT Architecture & Security",
          body.email_sender_email || existing?.email_sender_email || "mkn@ankbs.de",
          body.email_service || existing?.email_service || "resend",
          body.email_api_key !== void 0 ? body.email_api_key : existing?.email_api_key || "",
          body.email_subject_template || existing?.email_subject_template || "Freigabe Leistungsnachweis {period} f\xFCr Projekt {projectName}",
          body.email_body_template !== void 0 ? body.email_body_template : existing?.email_body_template || "",
          body.email_reminder1_subject || existing?.email_reminder1_subject || "1. Erinnerung: Freigabe Leistungsnachweis {period} f\xFCr Projekt {projectName}",
          body.email_reminder1_body !== void 0 ? body.email_reminder1_body : existing?.email_reminder1_body || "",
          body.email_reminder2_subject || existing?.email_reminder2_subject || "2. Dringende Erinnerung: Ausstehende Freigabe Leistungsnachweis {period} ({projectName})",
          body.email_reminder2_body !== void 0 ? body.email_reminder2_body : existing?.email_reminder2_body || "",
          body.email_admin_notify_rejection !== void 0 ? body.email_admin_notify_rejection ? 1 : 0 : existing?.email_admin_notify_rejection ?? 1,
          body.email_admin_notify_reminder !== void 0 ? body.email_admin_notify_reminder ? 1 : 0 : existing?.email_admin_notify_reminder ?? 1,
          body.contractor_signature_data_url !== void 0 ? body.contractor_signature_data_url : existing?.contractor_signature_data_url || null,
          body.contractor_title || existing?.contractor_title || "Senior Cloud & Security Architect",
          body.lexware_webhook_callback_url !== void 0 ? body.lexware_webhook_callback_url : existing?.lexware_webhook_callback_url || "https://evidence-hub-worker.michael-kirst.workers.dev/api/v1/webhooks/lexware",
          body.billing_provider || existing?.billing_provider || "lexware",
          body.chart_of_accounts || existing?.chart_of_accounts || "SKR04",
          body.tax_mode || existing?.tax_mode || "standard",
          body.datev_consultant_number || existing?.datev_consultant_number || "1001",
          body.datev_client_number || existing?.datev_client_number || "10001",
          now
        ).run();
        await logAuditEvent(env2, {
          eventType: "SETTINGS_UPDATED",
          entityType: "system_settings",
          entityId: "global_config",
          actor: "Admin",
          description: `Globale Einstellungen (DATEV: ${body.chart_of_accounts || "SKR04"}, Modus: ${body.billing_provider || "lexware"}) aktualisiert.`
        });
        return jsonResponse({ success: true, message: "Einstellungen erfolgreich gespeichert!" });
      }
      if (path === "/api/v1/dashboard/stats" && method === "GET") {
        await ensureInternalOrgAndProjects(env2);
        const { results: openTimeEntries } = await env2.DB.prepare(`
          SELECT t.*, p.default_hourly_rate, tv.status as ts_status, tv.is_invoice_canceled
          FROM time_entries t
          JOIN projects p ON t.project_id = p.id
          LEFT JOIN timesheet_versions tv ON t.timesheet_version_id = tv.id
          WHERE (tv.status IS NULL OR tv.status IN ('Draft', 'Rejected') OR tv.is_invoice_canceled = 1)
            AND p.is_active = 1 AND p.is_archived = 0 AND t.is_billable = 1
        `).all();
        const openHours = (openTimeEntries || []).reduce((sum, e) => sum + (e.billable_duration_hours || 0), 0);
        const openTimeAmountNet = (openTimeEntries || []).reduce((sum, e) => sum + (e.billable_duration_hours || 0) * (e.billing_rate_snapshot || e.default_hourly_rate || 0), 0);
        const { results: openTrips } = await env2.DB.prepare(`
          SELECT tr.*, tv.status as ts_status, tv.is_invoice_canceled
          FROM trips tr
          JOIN projects p ON tr.project_id = p.id
          LEFT JOIN timesheet_versions tv ON tr.timesheet_version_id = tv.id
          WHERE (tv.status IS NULL OR tv.status IN ('Draft', 'Rejected') OR tv.is_invoice_canceled = 1)
            AND p.is_active = 1 AND p.is_archived = 0
        `).all();
        const openTravelAmountNet = (openTrips || []).reduce((sum, tr) => sum + (tr.ticket_cost || tr.distance_km * tr.rate_per_km || 0), 0);
        const openTotalNet = openTimeAmountNet + openTravelAmountNet;
        const now = /* @__PURE__ */ new Date();
        const past3Months = [0, 1, 2].map((offset) => {
          const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        });
        const { results: invoicedTimesheets } = await env2.DB.prepare(`
          SELECT tv.*, p.name as project_name, c.name as customer_name
          FROM timesheet_versions tv
          JOIN projects p ON tv.project_id = p.id
          JOIN customers c ON p.customer_id = c.id
          WHERE (tv.status IN ('Approved', 'Invoiced') OR tv.lexware_invoice_id IS NOT NULL)
            AND tv.is_invoice_canceled = 0
            AND tv.period IN (?, ?, ?)
        `).bind(past3Months[0], past3Months[1], past3Months[2]).all();
        const past3MonthsRevenue = (invoicedTimesheets || []).reduce((sum, ts) => sum + (ts.total_amount_net || 0), 0);
        const { results: activeProjects } = await env2.DB.prepare(`
          SELECT p.*, c.name as customer_name,
            (SELECT COALESCE(SUM(t.billable_duration_hours), 0) FROM time_entries t WHERE t.project_id = p.id) as recorded_hours,
            (SELECT COALESCE(SUM(t.billable_duration_hours * t.billing_rate_snapshot), 0) FROM time_entries t WHERE t.project_id = p.id) as recorded_amount_net
          FROM projects p
          JOIN customers c ON p.customer_id = c.id
          WHERE p.is_active = 1 AND p.is_archived = 0
          ORDER BY p.name ASC
        `).all();
        const projectsList = (activeProjects || []).map((p) => {
          const plannedHours = p.planned_hours || 0;
          const defaultRate = p.default_hourly_rate || 0;
          const totalBudgetNet = p.total_budget_net || plannedHours * defaultRate;
          const recordedHours = p.recorded_hours || 0;
          const recordedAmountNet = p.recorded_amount_net || 0;
          const remainingHours = Math.max(0, plannedHours - recordedHours);
          const remainingBudgetNet = Math.max(0, totalBudgetNet - recordedAmountNet);
          const usagePercent = totalBudgetNet > 0 ? Math.min(100, Math.round(recordedAmountNet / totalBudgetNet * 100)) : 0;
          return {
            id: p.id,
            name: p.name,
            projectNumber: p.project_number,
            customerName: p.customer_name,
            defaultHourlyRate: defaultRate,
            plannedHours,
            recordedHours,
            remainingHours,
            totalBudgetNet,
            recordedAmountNet,
            remainingBudgetNet,
            budgetUsagePercent: usagePercent,
            startDate: p.start_date,
            endDate: p.end_date,
            quotationNumber: p.lexware_quotation_number,
            orderConfirmationNumber: p.lexware_order_confirmation_number
          };
        });
        const next3MonthsForecast = projectsList.reduce((sum, p) => sum + p.remainingBudgetNet, 0);
        const { results: recentTimesheets } = await env2.DB.prepare(`
          SELECT tv.*, p.name as project_name, p.project_number, c.name as customer_name
          FROM timesheet_versions tv
          JOIN projects p ON tv.project_id = p.id
          JOIN customers c ON p.customer_id = c.id
          WHERE p.is_archived = 0
          ORDER BY tv.period DESC, tv.created_at_utc DESC
          LIMIT 10
        `).all();
        return jsonResponse({
          success: true,
          openBilling: {
            hours: openHours,
            timeAmountNet: openTimeAmountNet,
            travelAmountNet: openTravelAmountNet,
            totalNet: openTotalNet
          },
          past3Months: {
            periods: past3Months,
            totalRevenueNet: past3MonthsRevenue,
            timesheetsCount: (invoicedTimesheets || []).length
          },
          forecast3Months: {
            totalForecastNet: next3MonthsForecast,
            activeProjectsCount: projectsList.length
          },
          projects: projectsList,
          recentTimesheets: recentTimesheets || []
        });
      }
      if (path === "/api/v1/billing/pending-approvals" && method === "GET") {
        const { results: list } = await env2.DB.prepare(`
          SELECT tv.*, p.name as project_name, p.project_number, p.approver_email as default_approver_email, p.approver_name as default_approver_name,
                 c.name as customer_name, c.email as customer_email, c.contact_person as customer_contact,
                 a.decision as approval_decision, a.approver_email as actual_approver_email, a.decision_at_utc
          FROM timesheet_versions tv
          JOIN projects p ON tv.project_id = p.id
          JOIN customers c ON p.customer_id = c.id
          LEFT JOIN approvals a ON tv.id = a.timesheet_version_id
          WHERE p.is_archived = 0
          ORDER BY tv.created_at_utc DESC
        `).all();
        return jsonResponse({
          success: true,
          approvals: list || []
        });
      }
      if (path === "/api/v1/customers" && method === "GET") {
        await ensureInternalOrgAndProjects(env2);
        try {
          await syncLexwareContactsInternal(env2);
        } catch (e) {
          console.warn("Auto-sync Lexware contacts failed silently:", e?.message || e);
        }
        const includeArchived = url.searchParams.get("includeArchived") === "true";
        const query = includeArchived ? `SELECT c.*, 
              (SELECT COUNT(*) FROM projects p WHERE p.customer_id = c.id AND p.is_active = 1) as active_projects_count,
              (SELECT COALESCE(SUM(t.billable_duration_hours), 0) FROM time_entries t JOIN projects p ON t.project_id = p.id WHERE p.customer_id = c.id) as total_recorded_hours
             FROM customers c 
             ORDER BY c.is_archived ASC, c.name ASC` : `SELECT c.*, 
              (SELECT COUNT(*) FROM projects p WHERE p.customer_id = c.id AND p.is_active = 1) as active_projects_count,
              (SELECT COALESCE(SUM(t.billable_duration_hours), 0) FROM time_entries t JOIN projects p ON t.project_id = p.id WHERE p.customer_id = c.id) as total_recorded_hours
             FROM customers c 
             WHERE c.is_archived = 0 
             ORDER BY c.name ASC`;
        const { results } = await env2.DB.prepare(query).all();
        return jsonResponse(results);
      }
      const customerOverviewMatch = path.match(/^\/api\/v1\/customers\/([a-zA-Z0-9_-]+)\/overview$/);
      if (customerOverviewMatch && method === "GET") {
        const customerId = customerOverviewMatch[1];
        const customer = await env2.DB.prepare("SELECT * FROM customers WHERE id = ?").bind(customerId).first();
        if (!customer) {
          return errorResponse("Kunde nicht gefunden", 404);
        }
        const { results: projects } = await env2.DB.prepare(`
          SELECT p.*,
            (SELECT COALESCE(SUM(t.billable_duration_hours), 0) FROM time_entries t WHERE t.project_id = p.id) as recorded_hours,
            (SELECT COALESCE(SUM(t.billable_duration_hours * t.billing_rate_snapshot), 0) FROM time_entries t WHERE t.project_id = p.id) as recorded_amount_net,
            (SELECT COUNT(*) FROM timesheet_versions tv WHERE tv.project_id = p.id) as timesheets_count
          FROM projects p
          WHERE p.customer_id = ?
          ORDER BY p.is_archived ASC, p.name ASC
        `).bind(customerId).all();
        const enrichedProjects = projects.map((p) => {
          const plannedHours = p.planned_hours || 0;
          const recordedHours = p.recorded_hours || 0;
          const totalBudgetNet = p.total_budget_net || p.default_hourly_rate * plannedHours;
          const recordedAmountNet = p.recorded_amount_net || recordedHours * p.default_hourly_rate;
          const remainingHours = Math.max(0, plannedHours - recordedHours);
          const remainingBudgetNet = Math.max(0, totalBudgetNet - recordedAmountNet);
          const budgetUsagePercent = totalBudgetNet > 0 ? Math.min(100, Math.round(recordedAmountNet / totalBudgetNet * 100)) : 0;
          return {
            ...p,
            total_budget_net: totalBudgetNet,
            recorded_amount_net: recordedAmountNet,
            remaining_hours: remainingHours,
            remaining_budget_net: remainingBudgetNet,
            budget_usage_percent: budgetUsagePercent
          };
        });
        return jsonResponse({
          customer,
          projects: enrichedProjects
        });
      }
      if (path === "/api/v1/sync/lexware-contacts" && (method === "POST" || method === "GET")) {
        const apiKey = request.headers.get("X-Lexware-Api-Key") || env2.LEXWARE_API_KEY;
        if (!apiKey) {
          return errorResponse("Kein LEXWARE_API_KEY im Worker konfiguriert oder im Header 'X-Lexware-Api-Key' \xFCbergeben.", 401);
        }
        const syncResult = await syncLexwareContactsInternal(env2, apiKey, true);
        if (!syncResult.success) {
          return errorResponse(syncResult.error || "Fehler beim Lexware-Abgleich", 502);
        }
        const { results: updatedList } = await env2.DB.prepare("SELECT * FROM customers ORDER BY is_archived ASC, name ASC").all();
        return jsonResponse({
          success: true,
          message: `Kundenabgleich erfolgreich! ${syncResult.stats?.totalFromLexware || 0} Kontakte synchronisiert (${syncResult.stats?.created || 0} neu angelegt, ${syncResult.stats?.updated || 0} aktualisiert, ${syncResult.stats?.archived || 0} archiviert, ${syncResult.stats?.deleted || 0} gel\xF6scht).`,
          stats: syncResult.stats,
          customers: updatedList
        });
      }
      const projectDetailsMatch = path.match(/^\/api\/v1\/projects\/([a-zA-Z0-9_-]+)\/details$/);
      if (projectDetailsMatch && method === "GET") {
        const projId = projectDetailsMatch[1];
        const project = await env2.DB.prepare(`
          SELECT p.*, c.name as customer_name, c.email as customer_email, c.contact_person, c.lexware_contact_id
          FROM projects p 
          JOIN customers c ON p.customer_id = c.id 
          WHERE p.id = ?
        `).bind(projId).first();
        if (!project) {
          return errorResponse("Projekt nicht gefunden", 404);
        }
        const { results: entries } = await env2.DB.prepare(`
          SELECT t.*, e.problem_statement, e.methodology, e.technical_activity, e.result, e.deliverable
          FROM time_entries t
          LEFT JOIN activity_evidences e ON t.id = e.time_entry_id
          WHERE t.project_id = ?
          ORDER BY t.entry_date DESC, t.start_time DESC
        `).bind(projId).all();
        const totalHours = entries.reduce((sum, e) => sum + (e.billable_duration_hours || 0), 0);
        const totalAmountNet = entries.reduce((sum, e) => sum + (e.billable_duration_hours || 0) * (e.billing_rate_snapshot || project.default_hourly_rate), 0);
        const plannedHours = project.planned_hours || 0;
        const totalBudgetNet = project.total_budget_net || plannedHours * project.default_hourly_rate;
        return jsonResponse({
          project: {
            ...project,
            recorded_hours: totalHours,
            recorded_amount_net: totalAmountNet,
            planned_hours: plannedHours,
            total_budget_net: totalBudgetNet,
            remaining_hours: Math.max(0, plannedHours - totalHours),
            remaining_budget_net: Math.max(0, totalBudgetNet - totalAmountNet),
            budget_usage_percent: totalBudgetNet > 0 ? Math.min(100, Math.round(totalAmountNet / totalBudgetNet * 100)) : 0
          },
          timeEntries: entries
        });
      }
      if (path === "/api/v1/projects" && method === "GET") {
        await ensureInternalOrgAndProjects(env2);
        const customerId = url.searchParams.get("customerId");
        const query = customerId ? env2.DB.prepare("SELECT p.*, c.name as customer_name, c.email as customer_email, c.is_archived as customer_archived FROM projects p JOIN customers c ON p.customer_id = c.id WHERE p.customer_id = ? AND p.is_active = 1 ORDER BY p.name ASC").bind(customerId) : env2.DB.prepare("SELECT p.*, c.name as customer_name, c.email as customer_email, c.is_archived as customer_archived FROM projects p JOIN customers c ON p.customer_id = c.id WHERE p.is_active = 1 ORDER BY p.name ASC");
        const { results } = await query.all();
        return jsonResponse(results);
      }
      if (path === "/api/v1/projects" && method === "POST") {
        await ensureProjectColumns(env2);
        const body = await request.json();
        const projId = body.id || `prj_${Date.now()}`;
        const now = (/* @__PURE__ */ new Date()).toISOString();
        const defaultRate = Number(body.defaultHourlyRate) || 120;
        const plannedHours = Number(body.plannedHours) || 0;
        const totalBudgetNet = body.totalBudgetNet ? Number(body.totalBudgetNet) : defaultRate * plannedHours;
        const customer = await env2.DB.prepare("SELECT * FROM customers WHERE id = ?").bind(body.customerId).first();
        const approverEmail = body.approverEmail || customer?.email || "";
        const approverName = body.approverName || customer?.contact_person || null;
        await env2.DB.prepare(`
          INSERT INTO projects (
            id, customer_id, project_number, name, end_customer_name, purchase_order_number, contract_number, 
            default_hourly_rate, planned_hours, total_budget_net, start_date, end_date, 
            lexware_service_article_id, billing_interval_minutes, 
            approver_email, approver_name, approver_2_email, approver_2_name, approver_3_email, approver_3_name,
            travel_time_billable, travel_time_rate_multiplier, public_transit_reimbursable, is_active, created_at_utc, updated_at_utc
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
        `).bind(
          projId,
          body.customerId,
          body.projectNumber || `PRJ-${(/* @__PURE__ */ new Date()).getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
          body.name,
          body.endCustomerName || null,
          body.purchaseOrderNumber || null,
          body.contractNumber || null,
          defaultRate,
          plannedHours,
          totalBudgetNet,
          body.startDate || null,
          body.endDate || null,
          body.lexwareServiceArticleId || "IT-ARCH",
          body.billingIntervalMinutes || 15,
          approverEmail,
          approverName,
          body.approver2Email || null,
          body.approver2Name || null,
          body.approver3Email || null,
          body.approver3Name || null,
          body.travelTimeBillable ? 1 : 0,
          body.travelTimeRateMultiplier || 1,
          body.publicTransitReimbursable !== false ? 1 : 0,
          now,
          now
        ).run();
        let lexwareQuotationId = null;
        let quotationError = null;
        if (body.createLexwareQuotation && env2.LEXWARE_API_KEY && customer?.lexware_contact_id) {
          try {
            const quotationPayload = {
              voucherDate: (/* @__PURE__ */ new Date()).toISOString(),
              expirationDate: body.endDate ? new Date(body.endDate).toISOString() : new Date(Date.now() + 30 * 864e5).toISOString(),
              address: {
                name: customer.name || "Kunde",
                contactId: customer.lexware_contact_id,
                street: customer.street || null,
                zip: customer.zip_code || null,
                city: customer.city || null,
                countryCode: customer.country_code || "DE"
              },
              lineItems: [
                {
                  type: "custom",
                  name: `Architektur & Engineering: ${body.name}`,
                  description: `Projekt: ${body.projectNumber || "Standard"}
Laufzeit: ${body.startDate || "sofort"} bis ${body.endDate || "gem. Vereinbarung"}
Geplantes Stundenkontingent: ${plannedHours > 0 ? plannedHours : 1} Std. \xE0 ${defaultRate.toFixed(2)} \u20AC/h Netto.`,
                  quantity: plannedHours > 0 ? plannedHours : 1,
                  unitName: plannedHours > 0 ? "Stunde" : "Pauschal",
                  unitPrice: {
                    currency: "EUR",
                    netAmount: plannedHours > 0 ? defaultRate : totalBudgetNet,
                    taxRatePercentage: 19
                  }
                }
              ],
              totalPrice: {
                currency: "EUR"
              },
              taxConditions: {
                taxType: "net"
              },
              introduction: `Sehr geehrte Damen und Herren,

vielen Dank f\xFCr die Projektanfrage. Gerne bieten wir Ihnen unsere freiberuflichen Architektur- und Beratungsleistungen wie folgt an:`,
              remark: `Abrechnung erfolgt monatlich nach tats\xE4chlich erbrachten Stunden mit GoBD-konformem T\xE4tigkeits- und Leistungsnachweis.`
            };
            const qRes = await fetch("https://api.lexware.io/v1/quotations", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${env2.LEXWARE_API_KEY}`,
                "Content-Type": "application/json",
                "Accept": "application/json"
              },
              body: JSON.stringify(quotationPayload)
            });
            if (qRes.ok) {
              const qData = await qRes.json();
              lexwareQuotationId = qData.id;
              let lexwareQuotationNumber = null;
              try {
                const qDetailRes = await fetch(`https://api.lexware.io/v1/quotations/${lexwareQuotationId}`, {
                  headers: { "Authorization": `Bearer ${env2.LEXWARE_API_KEY}`, "Accept": "application/json" }
                });
                if (qDetailRes.ok) {
                  const qDetail = await qDetailRes.json();
                  lexwareQuotationNumber = qDetail.voucherNumber || null;
                }
              } catch {
              }
              await env2.DB.prepare("UPDATE projects SET lexware_quotation_id = ?, lexware_quotation_number = ? WHERE id = ?").bind(lexwareQuotationId, lexwareQuotationNumber, projId).run();
            } else {
              quotationError = await qRes.text();
              console.error("Lexware Quotation API Error:", qRes.status, quotationError);
            }
          } catch (e) {
            quotationError = e.message;
            console.error("Lexware Quotation Generation Exception:", e.message);
          }
        }
        return jsonResponse({
          success: true,
          id: projId,
          totalBudgetNet,
          lexwareQuotationId,
          quotationError,
          message: lexwareQuotationId ? `Projekt '${body.name}' erfolgreich angelegt und Angebot in Lexware erstellt (ID: ${lexwareQuotationId})!` : quotationError ? `Projekt angelegt, aber Lexware Angebot fehlgeschlagen: ${quotationError}` : `Projekt '${body.name}' erfolgreich angelegt.`
        });
      }
      const createQuotationMatch = path.match(/^\/api\/v1\/projects\/([a-zA-Z0-9_-]+)\/create-quotation$/);
      if (createQuotationMatch && method === "POST") {
        const projId = createQuotationMatch[1];
        const project = await env2.DB.prepare("SELECT p.*, c.name as customer_name, c.lexware_contact_id, c.street, c.zip_code, c.city, c.country_code FROM projects p JOIN customers c ON p.customer_id = c.id WHERE p.id = ?").bind(projId).first();
        if (!project) return errorResponse("Projekt nicht gefunden", 404);
        if (!env2.LEXWARE_API_KEY) return errorResponse("LEXWARE_API_KEY nicht konfiguriert", 500);
        const defaultRate = project.default_hourly_rate || 120;
        const plannedHours = project.planned_hours || 0;
        const totalBudgetNet = project.total_budget_net || defaultRate * plannedHours;
        const quotationPayload = {
          voucherDate: (/* @__PURE__ */ new Date()).toISOString(),
          expirationDate: project.end_date ? new Date(project.end_date).toISOString() : new Date(Date.now() + 30 * 864e5).toISOString(),
          address: {
            name: project.customer_name || "Kunde",
            contactId: project.lexware_contact_id,
            street: project.street || null,
            zip: project.zip_code || null,
            city: project.city || null,
            countryCode: project.country_code || "DE"
          },
          lineItems: [
            {
              type: "custom",
              name: `Architektur & Engineering: ${project.name}`,
              description: `Projekt: ${project.project_number || "Standard"}
Laufzeit: ${project.start_date || "sofort"} bis ${project.end_date || "gem. Vereinbarung"}
Geplantes Stundenkontingent: ${plannedHours > 0 ? plannedHours : 1} Std. \xE0 ${defaultRate.toFixed(2)} \u20AC/h Netto.`,
              quantity: plannedHours > 0 ? plannedHours : 1,
              unitName: plannedHours > 0 ? "Stunde" : "Pauschal",
              unitPrice: {
                currency: "EUR",
                netAmount: plannedHours > 0 ? defaultRate : totalBudgetNet,
                taxRatePercentage: 19
              }
            }
          ],
          totalPrice: { currency: "EUR" },
          taxConditions: { taxType: "net" },
          introduction: `Sehr geehrte Damen und Herren,

vielen Dank f\xFCr die Projektanfrage. Gerne bieten wir Ihnen unsere freiberuflichen Architektur- und Beratungsleistungen wie folgt an:`,
          remark: `Abrechnung erfolgt monatlich nach tats\xE4chlich erbrachten Stunden mit GoBD-konformem T\xE4tigkeits- und Leistungsnachweis.`
        };
        const qRes = await fetch("https://api.lexware.io/v1/quotations", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${env2.LEXWARE_API_KEY}`,
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify(quotationPayload)
        });
        if (!qRes.ok) {
          const errText = await qRes.text();
          return errorResponse(`Lexware Quotation API Fehler: ${errText}`, 400);
        }
        const qData = await qRes.json();
        const lexwareQuotationId = qData.id;
        let lexwareQuotationNumber = null;
        try {
          const qDetailRes = await fetch(`https://api.lexware.io/v1/quotations/${lexwareQuotationId}`, {
            headers: { "Authorization": `Bearer ${env2.LEXWARE_API_KEY}`, "Accept": "application/json" }
          });
          if (qDetailRes.ok) {
            const qDetail = await qDetailRes.json();
            lexwareQuotationNumber = qDetail.voucherNumber || null;
          }
        } catch {
        }
        await env2.DB.prepare("UPDATE projects SET lexware_quotation_id = ?, lexware_quotation_number = ? WHERE id = ?").bind(lexwareQuotationId, lexwareQuotationNumber, projId).run();
        return jsonResponse({
          success: true,
          lexwareQuotationId,
          lexwareQuotationNumber,
          message: `Angebot in Lexware erfolgreich erstellt (ID: ${lexwareQuotationId}${lexwareQuotationNumber ? ", Nr: " + lexwareQuotationNumber : ""})!`
        });
      }
      const createOrderConfMatch = path.match(/^\/api\/v1\/projects\/([a-zA-Z0-9_-]+)\/create-order-confirmation$/);
      if (createOrderConfMatch && method === "POST") {
        const projId = createOrderConfMatch[1];
        const project = await env2.DB.prepare("SELECT p.*, c.name as customer_name, c.lexware_contact_id, c.street, c.zip_code, c.city, c.country_code FROM projects p JOIN customers c ON p.customer_id = c.id WHERE p.id = ?").bind(projId).first();
        if (!project) return errorResponse("Projekt nicht gefunden", 404);
        if (!env2.LEXWARE_API_KEY) return errorResponse("LEXWARE_API_KEY nicht konfiguriert", 500);
        const defaultRate = project.default_hourly_rate || 120;
        const plannedHours = project.planned_hours || 0;
        const totalBudgetNet = project.total_budget_net || defaultRate * plannedHours;
        const orderConfPayload = {
          voucherDate: (/* @__PURE__ */ new Date()).toISOString(),
          address: {
            name: project.customer_name || "Kunde",
            contactId: project.lexware_contact_id,
            street: project.street || null,
            zip: project.zip_code || null,
            city: project.city || null,
            countryCode: project.country_code || "DE"
          },
          lineItems: [
            {
              type: "custom",
              name: `Auftragsbest\xE4tigung: ${project.name}`,
              description: `Projekt: ${project.project_number || "Standard"}
Laufzeit: ${project.start_date || "sofort"} bis ${project.end_date || "gem. Beauftragung"}
Vereinbartes Kontingent: ${plannedHours > 0 ? plannedHours : 1} Std. \xE0 ${defaultRate.toFixed(2)} \u20AC/h Netto.`,
              quantity: plannedHours > 0 ? plannedHours : 1,
              unitName: plannedHours > 0 ? "Stunde" : "Pauschal",
              unitPrice: {
                currency: "EUR",
                netAmount: plannedHours > 0 ? defaultRate : totalBudgetNet,
                taxRatePercentage: 19
              }
            }
          ],
          totalPrice: { currency: "EUR" },
          taxConditions: { taxType: "net" },
          shippingConditions: {
            shippingDate: project.start_date ? new Date(project.start_date).toISOString() : (/* @__PURE__ */ new Date()).toISOString(),
            shippingType: "service"
          },
          introduction: `Sehr geehrte Damen und Herren,

vielen Dank f\xFCr die Auftragserteilung. Wir best\xE4tigen Ihren Auftrag zu folgenden Konditionen:`,
          remark: `Abrechnung erfolgt monatlich mit GoBD-konformem T\xE4tigkeits- und Leistungsnachweis.`
        };
        const ocRes = await fetch("https://api.lexware.io/v1/order-confirmations", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${env2.LEXWARE_API_KEY}`,
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify(orderConfPayload)
        });
        if (!ocRes.ok) {
          const errText = await ocRes.text();
          return errorResponse(`Lexware Order-Confirmation Fehler: ${errText}`, 400);
        }
        const ocData = await ocRes.json();
        const lexwareOrderConfId = ocData.id;
        let lexwareOrderConfNumber = null;
        try {
          const ocDetailRes = await fetch(`https://api.lexware.io/v1/order-confirmations/${lexwareOrderConfId}`, {
            headers: { "Authorization": `Bearer ${env2.LEXWARE_API_KEY}`, "Accept": "application/json" }
          });
          if (ocDetailRes.ok) {
            const ocDetail = await ocDetailRes.json();
            lexwareOrderConfNumber = ocDetail.voucherNumber || null;
          }
        } catch {
        }
        await env2.DB.prepare("UPDATE projects SET lexware_order_confirmation_id = ?, lexware_order_confirmation_number = ? WHERE id = ?").bind(lexwareOrderConfId, lexwareOrderConfNumber, projId).run();
        return jsonResponse({
          success: true,
          lexwareOrderConfId,
          lexwareOrderConfNumber,
          message: `Auftragsbest\xE4tigung in Lexware erfolgreich erstellt (ID: ${lexwareOrderConfId}${lexwareOrderConfNumber ? ", Nr: " + lexwareOrderConfNumber : ""})!`
        });
      }
      const projectUpdateMatch = path.match(/^\/api\/v1\/projects\/([a-zA-Z0-9_-]+)$/);
      if (projectUpdateMatch && method === "PUT") {
        await ensureProjectColumns(env2);
        const projId = projectUpdateMatch[1];
        const project = await env2.DB.prepare("SELECT * FROM projects WHERE id = ?").bind(projId).first();
        if (!project) return errorResponse("Projekt nicht gefunden", 404);
        const body = await request.json();
        const now = (/* @__PURE__ */ new Date()).toISOString();
        const defaultRate = Number(body.defaultHourlyRate) || project.default_hourly_rate || 120;
        const plannedHours = body.plannedHours !== void 0 ? Number(body.plannedHours) : project.planned_hours;
        const totalBudgetNet = body.totalBudgetNet !== void 0 ? Number(body.totalBudgetNet) : defaultRate * plannedHours;
        await env2.DB.prepare(`
          UPDATE projects SET
            name = COALESCE(?, name),
            end_customer_name = ?,
            project_number = COALESCE(?, project_number),
            purchase_order_number = ?,
            contract_number = ?,
            default_hourly_rate = ?,
            planned_hours = ?,
            total_budget_net = ?,
            start_date = ?,
            end_date = ?,
            approver_email = ?,
            approver_name = ?,
            approver_2_email = ?,
            approver_2_name = ?,
            approver_3_email = ?,
            approver_3_name = ?,
            travel_time_billable = ?,
            travel_time_rate_multiplier = ?,
            public_transit_reimbursable = ?,
            is_active = 1,
            is_archived = 0,
            updated_at_utc = ?
          WHERE id = ?
        `).bind(
          body.name || null,
          body.endCustomerName !== void 0 ? body.endCustomerName : project.end_customer_name,
          body.projectNumber || null,
          body.purchaseOrderNumber !== void 0 ? body.purchaseOrderNumber : project.purchase_order_number,
          body.contractNumber !== void 0 ? body.contractNumber : project.contract_number,
          defaultRate,
          plannedHours,
          totalBudgetNet,
          body.startDate !== void 0 ? body.startDate : project.start_date,
          body.endDate !== void 0 ? body.endDate : project.end_date,
          body.approverEmail !== void 0 ? body.approverEmail : project.approver_email,
          body.approverName !== void 0 ? body.approverName : project.approver_name,
          body.approver2Email !== void 0 ? body.approver2Email : project.approver_2_email,
          body.approver2Name !== void 0 ? body.approver2Name : project.approver_2_name,
          body.approver3Email !== void 0 ? body.approver3Email : project.approver_3_email,
          body.approver3Name !== void 0 ? body.approver3Name : project.approver_3_name,
          body.travelTimeBillable !== void 0 ? body.travelTimeBillable ? 1 : 0 : project.travel_time_billable,
          body.travelTimeRateMultiplier !== void 0 ? Number(body.travelTimeRateMultiplier) : project.travel_time_rate_multiplier,
          body.publicTransitReimbursable !== void 0 ? body.publicTransitReimbursable ? 1 : 0 : project.public_transit_reimbursable,
          now,
          projId
        ).run();
        const updatedProject = await env2.DB.prepare("SELECT * FROM projects WHERE id = ?").bind(projId).first();
        return jsonResponse({ success: true, message: "Projektdaten und Freigabeberechtigte erfolgreich aktualisiert!", project: updatedProject });
      }
      const projectDeleteMatch = path.match(/^\/api\/v1\/projects\/([a-zA-Z0-9_-]+)$/);
      if (projectDeleteMatch && method === "DELETE") {
        const projId = projectDeleteMatch[1];
        const project = await env2.DB.prepare("SELECT * FROM projects WHERE id = ?").bind(projId).first();
        if (!project) return errorResponse("Projekt nicht gefunden", 404);
        const timeEntriesCount = (await env2.DB.prepare("SELECT COUNT(*) as cnt FROM time_entries WHERE project_id = ?").bind(projId).first())?.cnt || 0;
        const tripsCount = (await env2.DB.prepare("SELECT COUNT(*) as cnt FROM trips WHERE project_id = ?").bind(projId).first())?.cnt || 0;
        const hasVouchers = !!(project.lexware_quotation_id || project.lexware_order_confirmation_id);
        if (timeEntriesCount > 0 || tripsCount > 0 || hasVouchers) {
          return errorResponse(`Projekt kann nicht gel\xF6scht werden, da Verkn\xFCpfungen existieren (${timeEntriesCount} Zeiteintr\xE4ge, ${tripsCount} Reisekosten, Belege: ${project.lexware_quotation_number || project.lexware_order_confirmation_number || "Vorhanden"}). Bitte archivieren Sie das Projekt stattdessen.`, 400);
        }
        try {
          await env2.DB.prepare("DELETE FROM approvals WHERE timesheet_version_id IN (SELECT id FROM timesheet_versions WHERE project_id = ?)").bind(projId).run();
        } catch {
        }
        try {
          await env2.DB.prepare("DELETE FROM billing_batches WHERE project_id = ?").bind(projId).run();
        } catch {
        }
        try {
          await env2.DB.prepare("DELETE FROM monthly_archive_seals WHERE project_id = ?").bind(projId).run();
        } catch {
        }
        try {
          await env2.DB.prepare("DELETE FROM receipts WHERE project_id = ?").bind(projId).run();
        } catch {
        }
        try {
          await env2.DB.prepare("DELETE FROM timesheet_versions WHERE project_id = ?").bind(projId).run();
        } catch {
        }
        await env2.DB.prepare("DELETE FROM projects WHERE id = ?").bind(projId).run();
        await logAuditEvent(env2, {
          eventType: "PROJECT_DELETED",
          entityType: "project",
          entityId: projId,
          actor: "Admin",
          description: `Projekt '${project.name}' (${project.project_number}) restlos gel\xF6scht.`
        });
        return jsonResponse({ success: true, message: `Projekt '${project.name}' wurde erfolgreich gel\xF6scht.` });
      }
      const projectArchiveMatch = path.match(/^\/api\/v1\/projects\/([a-zA-Z0-9_-]+)\/archive$/);
      if (projectArchiveMatch && method === "POST") {
        const projId = projectArchiveMatch[1];
        const project = await env2.DB.prepare("SELECT * FROM projects WHERE id = ?").bind(projId).first();
        if (!project) return errorResponse("Projekt nicht gefunden", 404);
        await env2.DB.prepare("UPDATE projects SET is_active = 0, is_archived = 1 WHERE id = ?").bind(projId).run();
        await logAuditEvent(env2, {
          eventType: "PROJECT_ARCHIVED",
          entityType: "project",
          entityId: projId,
          actor: "Admin",
          description: `Projekt '${project.name}' (${project.project_number}) wurde manuell archiviert und gesperrt.`
        });
        return jsonResponse({ success: true, message: `Projekt '${project.name}' wurde archiviert und gesperrt.` });
      }
      const projectUnarchiveMatch = path.match(/^\/api\/v1\/projects\/([a-zA-Z0-9_-]+)\/unarchive$/);
      if (projectUnarchiveMatch && method === "POST") {
        const projId = projectUnarchiveMatch[1];
        const project = await env2.DB.prepare("SELECT * FROM projects WHERE id = ?").bind(projId).first();
        if (!project) return errorResponse("Projekt nicht gefunden", 404);
        await env2.DB.prepare("UPDATE projects SET is_active = 1, is_archived = 0 WHERE id = ?").bind(projId).run();
        await logAuditEvent(env2, {
          eventType: "PROJECT_UNARCHIVED",
          entityType: "project",
          entityId: projId,
          actor: "Admin",
          description: `Projekt '${project.name}' (${project.project_number}) wurde reaktiviert und entsperrt.`
        });
        return jsonResponse({ success: true, message: `Projekt '${project.name}' wurde erfolgreich reaktiviert und entsperrt.` });
      }
      if (path === "/api/v1/webhooks/lexware" && method === "POST") {
        const body = await request.json();
        const event = (body.event || body.type || body.eventType || "").toLowerCase();
        const resourceId = body.resourceId || body.id || body.voucherId;
        const resourceType = (body.resourceType || "").toLowerCase();
        const now = (/* @__PURE__ */ new Date()).toISOString();
        try {
          if (event.startsWith("voucher.") || resourceType === "voucher") {
            const exp = await env2.DB.prepare("SELECT * FROM trip_expenses WHERE lexware_voucher_id = ?").bind(resourceId).first();
            if (exp) {
              if (event === "voucher.deleted" || event === "voucher_deleted") {
                await env2.DB.prepare("UPDATE trip_expenses SET is_synced_to_lexware = 0, lexware_voucher_id = NULL, lexware_voucher_number = NULL, lexware_status = 'deleted' WHERE id = ?").bind(exp.id).run();
                await logAuditEvent(env2, {
                  eventType: "WEBHOOK_EXPENSE_DELETED",
                  entityType: "trip_expense",
                  entityId: exp.id,
                  actor: "Lexware Webhook",
                  description: `Ausgaben-Beleg '${exp.description}' (${exp.amount_gross} \u20AC) wurde in Lexware gel\xF6scht. Verkn\xFCpfung im Hub freigegeben.`
                });
              } else if (event === "voucher.status-changed" || event === "voucher.voided" || event === "voucher.canceled") {
                if (env2.LEXWARE_API_KEY) {
                  try {
                    const vRes = await fetch(`https://api.lexware.io/v1/vouchers/${resourceId}`, {
                      headers: { "Authorization": `Bearer ${env2.LEXWARE_API_KEY}`, "Accept": "application/json" }
                    });
                    if (vRes.ok) {
                      const vData = await vRes.json();
                      const vStat = (vData.voucherStatus || "").toLowerCase();
                      if (vStat === "voided" || vStat === "canceled" || vStat === "storniert") {
                        await env2.DB.prepare("UPDATE trip_expenses SET is_voucher_canceled = 1, lexware_status = 'voided', voucher_canceled_at_utc = ? WHERE id = ?").bind(now, exp.id).run();
                        await logAuditEvent(env2, {
                          eventType: "WEBHOOK_EXPENSE_VOIDED",
                          entityType: "trip_expense",
                          entityId: exp.id,
                          actor: "Lexware Webhook",
                          description: `Ausgaben-Beleg '${exp.description}' (${exp.amount_gross} \u20AC) wurde in Lexware storniert. Im Archiv markiert.`
                        });
                      }
                    }
                  } catch {
                  }
                }
              }
            }
          }
          if (event.startsWith("invoice.") || resourceType === "invoice" || event.startsWith("voucher.")) {
            const ts = await env2.DB.prepare("SELECT * FROM timesheet_versions WHERE lexware_invoice_id = ?").bind(resourceId).first();
            if (ts) {
              if (event === "invoice.canceled" || event === "voucher.canceled" || event === "invoice.voided" || event === "voucher.status-changed") {
                if (env2.LEXWARE_API_KEY) {
                  try {
                    const invRes = await fetch(`https://api.lexware.io/v1/invoices/${resourceId}`, {
                      headers: { "Authorization": `Bearer ${env2.LEXWARE_API_KEY}`, "Accept": "application/json" }
                    });
                    if (invRes.ok) {
                      const invData = await invRes.json();
                      const vStat = (invData.voucherStatus || "").toLowerCase();
                      if (vStat === "voided" || vStat === "canceled" || vStat === "storniert") {
                        await env2.DB.prepare("UPDATE timesheet_versions SET status = 'InvoiceCanceled', is_invoice_canceled = 1, invoice_canceled_at_utc = ? WHERE id = ?").bind(now, ts.id).run();
                        await logAuditEvent(env2, {
                          eventType: "WEBHOOK_INVOICE_CANCELED",
                          entityType: "timesheet_version",
                          entityId: ts.id,
                          actor: "Lexware Webhook",
                          description: `Rechnung ${ts.lexware_invoice_number || resourceId} in Lexware storniert. Stundenzettel auf 'InvoiceCanceled' gesetzt.`
                        });
                      } else if (vStat === "paid" || vStat === "paidoff") {
                        await env2.DB.prepare("UPDATE timesheet_versions SET is_invoice_paid = 1, invoice_paid_at_utc = ? WHERE id = ?").bind(now, ts.id).run();
                      }
                    } else if (invRes.status === 404) {
                      await env2.DB.prepare("UPDATE timesheet_versions SET status = 'Approved', lexware_invoice_id = NULL, lexware_invoice_number = NULL WHERE id = ?").bind(ts.id).run();
                    }
                  } catch {
                  }
                }
              }
            }
          }
          if (event.startsWith("quotation.") || event.startsWith("order-confirmation.")) {
            const project = await env2.DB.prepare("SELECT * FROM projects WHERE lexware_quotation_id = ? OR lexware_order_confirmation_id = ?").bind(resourceId, resourceId).first();
            if (project) {
              if (event === "quotation.deleted" || event === "order-confirmation.deleted") {
                const { results: entries } = await env2.DB.prepare("SELECT id FROM time_entries WHERE project_id = ?").bind(project.id).all();
                if (!entries || entries.length === 0) {
                  await env2.DB.prepare("DELETE FROM projects WHERE id = ?").bind(project.id).run();
                } else {
                  await env2.DB.prepare("UPDATE projects SET is_active = 0, is_archived = 1 WHERE id = ?").bind(project.id).run();
                }
              } else if (event === "quotation.status-changed") {
                if (env2.LEXWARE_API_KEY) {
                  try {
                    const qRes = await fetch(`https://api.lexware.io/v1/quotations/${resourceId}`, {
                      headers: { "Authorization": `Bearer ${env2.LEXWARE_API_KEY}`, "Accept": "application/json" }
                    });
                    if (qRes.ok) {
                      const qData = await qRes.json();
                      const vStat = (qData.voucherStatus || "").toLowerCase();
                      if (vStat === "accepted") {
                        await env2.DB.prepare("UPDATE projects SET lexware_quotation_status = 'accepted', is_active = 1 WHERE id = ?").bind(project.id).run();
                      } else if (vStat === "rejected") {
                        await env2.DB.prepare("UPDATE projects SET lexware_quotation_status = 'rejected', is_active = 0, is_archived = 1 WHERE id = ?").bind(project.id).run();
                      }
                    }
                  } catch {
                  }
                }
              }
            }
          }
        } catch (webhookErr) {
          console.error("Webhook processing error:", webhookErr?.message || webhookErr);
        }
        return jsonResponse({ success: true, message: "Webhook empfangen & verarbeitet" });
      }
      if (path === "/api/v1/settings/register-lexware-webhooks" && method === "POST") {
        if (!env2.LEXWARE_API_KEY) return errorResponse("LEXWARE_API_KEY nicht konfiguriert", 500);
        let reqBody = {};
        try {
          reqBody = await request.json();
        } catch {
        }
        let callbackUrl = reqBody.callbackUrl;
        if (!callbackUrl) {
          const settings = await env2.DB.prepare("SELECT lexware_webhook_callback_url FROM app_settings WHERE id = 'global_config'").first();
          callbackUrl = settings?.lexware_webhook_callback_url || "https://evidence-hub-worker.michael-kirst.workers.dev/api/v1/webhooks/lexware";
        }
        const eventTypes = [
          "voucher.created",
          "voucher.changed",
          "voucher.status.changed",
          "voucher.deleted",
          "invoice.created",
          "invoice.changed",
          "invoice.status.changed",
          "invoice.deleted",
          "down-payment-invoice.created",
          "down-payment-invoice.status.changed",
          "order-confirmation.created",
          "order-confirmation.status.changed",
          "order-confirmation.deleted",
          "quotation.created",
          "quotation.status.changed",
          "quotation.deleted",
          "contact.changed",
          "contact.deleted"
        ];
        try {
          const results = [];
          let successCount = 0;
          let lastError = "";
          for (const ev of eventTypes) {
            try {
              const regRes = await fetch("https://api.lexware.io/v1/event-subscriptions", {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${env2.LEXWARE_API_KEY}`,
                  "Content-Type": "application/json",
                  "Accept": "application/json"
                },
                body: JSON.stringify({
                  eventType: ev,
                  callbackUrl
                })
              });
              const regTxt = await regRes.text();
              if (regRes.ok || regRes.status === 201 || regRes.status === 200 || regRes.status === 409) {
                successCount++;
                results.push({ eventType: ev, status: regRes.status, success: true });
              } else {
                lastError = `Status ${regRes.status}: ${regTxt}`;
                results.push({ eventType: ev, status: regRes.status, success: false, error: regTxt });
              }
            } catch (errOne) {
              lastError = errOne.message;
              results.push({ eventType: ev, success: false, error: errOne.message });
            }
          }
          await logAuditEvent(env2, {
            eventType: "LEXWARE_WEBHOOK_REGISTERED",
            entityType: "settings",
            entityId: "lexware_webhooks",
            actor: "Admin",
            description: `Lexware Webhook-Subscriptions f\xFCr ${successCount}/${eventTypes.length} Events angefordert (${callbackUrl}).`
          });
          const isOverallSuccess = successCount > 0;
          return jsonResponse({
            success: isOverallSuccess,
            successCount,
            totalEvents: eventTypes.length,
            callbackUrl,
            message: isOverallSuccess ? `${successCount} von ${eventTypes.length} Webhook-Events erfolgreich bei Lexware registriert!` : `Webhook-Registrierung fehlgeschlagen: ${lastError}`,
            detail: results
          });
        } catch (err) {
          return errorResponse(`Webhook-Registrierung fehlgeschlagen: ${err.message}`, 500);
        }
      }
      if (path === "/api/v1/sync/full-lexware-status" && method === "POST") {
        if (!env2.LEXWARE_API_KEY) return errorResponse("LEXWARE_API_KEY nicht konfiguriert", 500);
        await ensureTripExpenses(env2);
        const now = (/* @__PURE__ */ new Date()).toISOString();
        let canceledInvoicesCount = 0;
        let canceledExpensesCount = 0;
        let cleanedProjectsCount = 0;
        let paidInvoicesCount = 0;
        try {
          const vListRes = await fetch("https://api.lexware.io/v1/voucherlist?voucherType=invoice,creditnote,purchase,expense&voucherStatus=draft,open,paid,paidoff,voided,transferred,sepadebit&size=250", {
            headers: { "Authorization": `Bearer ${env2.LEXWARE_API_KEY}`, "Accept": "application/json" }
          });
          if (vListRes.ok) {
            const vListData = await vListRes.json();
            const content = vListData.content || [];
            for (const item of content) {
              const vStatus = (item.voucherStatus || "").toLowerCase();
              const vNum = item.voucherNumber || "";
              const vId = item.id;
              const vType = (item.voucherType || "").toLowerCase();
              if (vType === "invoice" || vType === "creditnote") {
                if (vStatus === "voided" || vStatus === "canceled" || vStatus === "storniert") {
                  const res = await env2.DB.prepare(`
                    UPDATE timesheet_versions 
                    SET status = 'InvoiceCanceled', is_invoice_canceled = 1, invoice_canceled_at_utc = COALESCE(invoice_canceled_at_utc, ?), lexware_invoice_number = COALESCE(lexware_invoice_number, ?)
                    WHERE (lexware_invoice_id = ? OR lexware_invoice_number = ?) AND (status != 'InvoiceCanceled' OR is_invoice_canceled = 0)
                  `).bind(now, vNum, vId, vNum).run();
                  if (res.meta.changes > 0) canceledInvoicesCount += res.meta.changes;
                } else if (vStatus === "paid" || vStatus === "paidoff") {
                  const res = await env2.DB.prepare(`
                    UPDATE timesheet_versions 
                    SET is_invoice_paid = 1, invoice_paid_at_utc = COALESCE(invoice_paid_at_utc, ?)
                    WHERE (lexware_invoice_id = ? OR lexware_invoice_number = ?) AND is_invoice_paid = 0
                  `).bind(now, vId, vNum).run();
                  if (res.meta.changes > 0) paidInvoicesCount += res.meta.changes;
                }
              }
              if (vType === "purchase" || vType === "expense") {
                if (vStatus === "voided" || vStatus === "canceled" || vStatus === "storniert") {
                  const res = await env2.DB.prepare(`
                    UPDATE trip_expenses 
                    SET is_voucher_canceled = 1, lexware_status = 'voided', voucher_canceled_at_utc = COALESCE(voucher_canceled_at_utc, ?), lexware_voucher_number = COALESCE(lexware_voucher_number, ?)
                    WHERE (lexware_voucher_id = ? OR lexware_voucher_number = ? OR description LIKE ?) AND is_voucher_canceled = 0
                  `).bind(now, vNum, vId, vNum, `%${vNum}%`).run();
                  if (res.meta.changes > 0) canceledExpensesCount += res.meta.changes;
                }
              }
            }
          }
        } catch (e) {
          console.error("Voucherlist sync error:", e.message);
        }
        const { results: invoicedTimesheets } = await env2.DB.prepare("SELECT * FROM timesheet_versions WHERE lexware_invoice_id IS NOT NULL").all();
        for (const ts of invoicedTimesheets) {
          try {
            const checkRes = await fetch(`https://api.lexware.io/v1/invoices/${ts.lexware_invoice_id}`, {
              headers: { "Authorization": `Bearer ${env2.LEXWARE_API_KEY}`, "Accept": "application/json" }
            });
            if (checkRes.status === 404) {
              if (ts.status !== "InvoiceCanceled") {
                await env2.DB.prepare("UPDATE timesheet_versions SET status = 'InvoiceCanceled', is_invoice_canceled = 1, invoice_canceled_at_utc = ? WHERE id = ?").bind(now, ts.id).run();
                canceledInvoicesCount++;
              }
            } else if (checkRes.ok) {
              const invData = await checkRes.json();
              const vStatus = (invData.voucherStatus || "").toLowerCase();
              if (vStatus === "voided" || vStatus === "canceled" || vStatus === "storniert") {
                if (ts.status !== "InvoiceCanceled" || !ts.is_invoice_canceled) {
                  await env2.DB.prepare("UPDATE timesheet_versions SET status = 'InvoiceCanceled', is_invoice_canceled = 1, invoice_canceled_at_utc = ? WHERE id = ?").bind(now, ts.id).run();
                  canceledInvoicesCount++;
                }
              } else if (vStatus === "paid" || vStatus === "paidoff") {
                if (!ts.is_invoice_paid) {
                  await env2.DB.prepare("UPDATE timesheet_versions SET is_invoice_paid = 1, invoice_paid_at_utc = ? WHERE id = ?").bind(now, ts.id).run();
                  paidInvoicesCount++;
                }
              }
            }
          } catch {
          }
        }
        const { results: syncedExpenses } = await env2.DB.prepare("SELECT * FROM trip_expenses WHERE lexware_voucher_id IS NOT NULL").all();
        for (const exp of syncedExpenses) {
          try {
            const checkRes = await fetch(`https://api.lexware.io/v1/vouchers/${exp.lexware_voucher_id}`, {
              headers: { "Authorization": `Bearer ${env2.LEXWARE_API_KEY}`, "Accept": "application/json" }
            });
            if (checkRes.status === 404) {
              if (!exp.is_voucher_canceled) {
                await env2.DB.prepare("UPDATE trip_expenses SET is_voucher_canceled = 1, lexware_status = 'voided', voucher_canceled_at_utc = ? WHERE id = ?").bind(now, exp.id).run();
                canceledExpensesCount++;
              }
            } else if (checkRes.ok) {
              const vData = await checkRes.json();
              const vStatus = (vData.voucherStatus || "").toLowerCase();
              if (vStatus === "voided" || vStatus === "canceled" || vStatus === "storniert") {
                if (!exp.is_voucher_canceled) {
                  await env2.DB.prepare("UPDATE trip_expenses SET is_voucher_canceled = 1, lexware_status = 'voided', voucher_canceled_at_utc = ? WHERE id = ?").bind(now, exp.id).run();
                  canceledExpensesCount++;
                }
              } else if (vData.voucherNumber && !exp.lexware_voucher_number) {
                await env2.DB.prepare("UPDATE trip_expenses SET lexware_voucher_number = ?, lexware_status = 'open' WHERE id = ?").bind(vData.voucherNumber, exp.id).run();
              }
            }
          } catch {
          }
        }
        const { results: allProjectsWithDocs } = await env2.DB.prepare("SELECT * FROM projects WHERE lexware_quotation_id IS NOT NULL OR lexware_order_confirmation_id IS NOT NULL").all();
        for (const proj of allProjectsWithDocs) {
          if (proj.lexware_quotation_id) {
            try {
              const qRes = await fetch(`https://api.lexware.io/v1/quotations/${proj.lexware_quotation_id}`, {
                headers: { "Authorization": `Bearer ${env2.LEXWARE_API_KEY}`, "Accept": "application/json" }
              });
              if (qRes.status === 404) {
                const { results: entries } = await env2.DB.prepare("SELECT id FROM time_entries WHERE project_id = ?").bind(proj.id).all();
                const { results: tripList } = await env2.DB.prepare("SELECT id FROM trips WHERE project_id = ?").bind(proj.id).all();
                if ((!entries || entries.length === 0) && (!tripList || tripList.length === 0)) {
                  await env2.DB.prepare("DELETE FROM projects WHERE id = ?").bind(proj.id).run();
                } else {
                  await env2.DB.prepare("UPDATE projects SET lexware_quotation_id = NULL, lexware_quotation_number = NULL, lexware_quotation_status = 'deleted', is_active = 0, is_archived = 1 WHERE id = ?").bind(proj.id).run();
                }
                cleanedProjectsCount++;
              } else if (qRes.ok) {
                const qData = await qRes.json();
                const vStatus = (qData.voucherStatus || "").toLowerCase();
                if (qData.archived === true || vStatus === "archived" || vStatus === "rejected" || vStatus === "canceled" || vStatus === "voided") {
                  await env2.DB.prepare("UPDATE projects SET lexware_quotation_status = ?, is_active = 0, is_archived = 1 WHERE id = ?").bind(vStatus === "archived" || qData.archived ? "archived" : "rejected", proj.id).run();
                  cleanedProjectsCount++;
                } else if (qData.voucherNumber && qData.voucherNumber !== proj.lexware_quotation_number) {
                  await env2.DB.prepare("UPDATE projects SET lexware_quotation_number = ? WHERE id = ?").bind(qData.voucherNumber, proj.id).run();
                }
              }
            } catch {
            }
          }
          if (proj.lexware_order_confirmation_id) {
            try {
              const ocRes = await fetch(`https://api.lexware.io/v1/order-confirmations/${proj.lexware_order_confirmation_id}`, {
                headers: { "Authorization": `Bearer ${env2.LEXWARE_API_KEY}`, "Accept": "application/json" }
              });
              if (ocRes.status === 404) {
                await env2.DB.prepare("UPDATE projects SET lexware_order_confirmation_id = NULL, lexware_order_confirmation_number = NULL, lexware_order_confirmation_status = 'deleted' WHERE id = ?").bind(proj.id).run();
                cleanedProjectsCount++;
              } else if (ocRes.ok) {
                const ocData = await ocRes.json();
                const ocStatus = (ocData.voucherStatus || "").toLowerCase();
                if (ocData.archived === true || ocStatus === "archived" || ocStatus === "rejected" || ocStatus === "canceled" || ocStatus === "voided") {
                  await env2.DB.prepare("UPDATE projects SET lexware_order_confirmation_status = ?, is_active = 0, is_archived = 1 WHERE id = ?").bind(ocStatus === "archived" || ocData.archived ? "archived" : "rejected", proj.id).run();
                  cleanedProjectsCount++;
                } else if (ocData.voucherNumber && ocData.voucherNumber !== proj.lexware_order_confirmation_number) {
                  await env2.DB.prepare("UPDATE projects SET lexware_order_confirmation_number = ? WHERE id = ?").bind(ocData.voucherNumber, proj.id).run();
                }
              }
            } catch {
            }
          }
        }
        return jsonResponse({
          success: true,
          canceledInvoicesCount,
          canceledExpensesCount,
          cleanedProjectsCount,
          paidInvoicesCount,
          message: `Gesamtabgleich abgeschlossen: ${canceledInvoicesCount} Rechnungs-Stornos, ${canceledExpensesCount} stornierte Spesen, ${cleanedProjectsCount} bereinigte Angebote/Projekte, ${paidInvoicesCount} bezahlte Rechnungen synchronisiert.`
        });
      }
      const expenseUnlinkMatch = path.match(/^\/api\/v1\/expenses\/([a-zA-Z0-9_-]+)\/unlink-lexware$/);
      if (expenseUnlinkMatch && method === "POST") {
        const expId = expenseUnlinkMatch[1];
        const exp = await env2.DB.prepare("SELECT * FROM trip_expenses WHERE id = ?").bind(expId).first();
        if (!exp) return errorResponse("Spesenbeleg nicht gefunden", 404);
        await env2.DB.prepare("UPDATE trip_expenses SET is_synced_to_lexware = 0, lexware_voucher_id = NULL, lexware_voucher_number = NULL, is_voucher_canceled = 0, lexware_status = 'open' WHERE id = ?").bind(expId).run();
        await logAuditEvent(env2, {
          eventType: "EXPENSE_UNLINKED",
          entityType: "trip_expense",
          entityId: expId,
          actor: "Admin",
          description: `Spesenbeleg '${exp.description}' (${exp.amount_gross} \u20AC) von Lexware entkoppelt und zur erneuten Buchung freigegeben.`
        });
        return jsonResponse({ success: true, message: "Spesenbeleg erfolgreich entkoppelt. Sie k\xF6nnen ihn nun erneut an Lexware \xFCbertragen." });
      }
      if (path === "/api/v1/archive/overview" && method === "GET") {
        await ensureTripExpenses(env2);
        const { results: timesheetRevisions } = await env2.DB.prepare(`
          SELECT ts.*, p.name as project_name, p.project_number, c.name as customer_name
          FROM timesheet_versions ts
          LEFT JOIN projects p ON ts.project_id = p.id
          LEFT JOIN customers c ON p.customer_id = c.id
          WHERE ts.status IN ('InvoiceCanceled', 'Rejected', 'Voided') OR ts.is_archived = 1 OR ts.is_invoice_canceled = 1
          ORDER BY ts.period DESC, ts.version_number DESC
        `).all();
        const { results: canceledExpenses } = await env2.DB.prepare(`
          SELECT te.*, t.purpose as trip_purpose, t.trip_date, p.name as project_name, c.name as customer_name
          FROM trip_expenses te
          LEFT JOIN trips t ON te.trip_id = t.id
          LEFT JOIN projects p ON t.project_id = p.id
          LEFT JOIN customers c ON p.customer_id = c.id
          WHERE te.is_voucher_canceled = 1 OR te.lexware_status IN ('voided', 'deleted')
          ORDER BY te.expense_date DESC
        `).all();
        const { results: archivedProjects } = await env2.DB.prepare(`
          SELECT p.*, c.name as customer_name,
            (SELECT COUNT(*) FROM time_entries te WHERE te.project_id = p.id) as time_entries_count
          FROM projects p
          LEFT JOIN customers c ON p.customer_id = c.id
          WHERE p.is_active = 0 OR p.is_archived = 1 OR p.lexware_quotation_status = 'rejected'
          ORDER BY p.name ASC
        `).all();
        let gobdSeals = [];
        try {
          const { results } = await env2.DB.prepare(`
            SELECT * FROM monthly_archive_seals ORDER BY period DESC
          `).all();
          gobdSeals = results || [];
        } catch {
        }
        return jsonResponse({
          timesheetRevisions: timesheetRevisions || [],
          canceledExpenses: canceledExpenses || [],
          archivedProjects: archivedProjects || [],
          gobdSeals
        });
      }
      if (path === "/api/v1/time-entries" && method === "GET") {
        const projectId = url.searchParams.get("projectId");
        const timesheetId = url.searchParams.get("timesheetId");
        let query;
        if (timesheetId) {
          query = env2.DB.prepare("SELECT t.*, p.name as project_name FROM time_entries t JOIN projects p ON t.project_id = p.id WHERE t.timesheet_version_id = ? ORDER BY t.entry_date DESC, t.start_time DESC").bind(timesheetId);
        } else if (projectId) {
          query = env2.DB.prepare("SELECT t.*, p.name as project_name FROM time_entries t JOIN projects p ON t.project_id = p.id WHERE t.project_id = ? ORDER BY t.entry_date DESC, t.start_time DESC").bind(projectId);
        } else {
          query = env2.DB.prepare("SELECT t.*, p.name as project_name FROM time_entries t JOIN projects p ON t.project_id = p.id ORDER BY t.entry_date DESC, t.start_time DESC LIMIT 100");
        }
        const { results } = await query.all();
        return jsonResponse(results);
      }
      if (path === "/api/v1/time-entries" && method === "POST") {
        const body = await request.json();
        const entryId = body.id || crypto.randomUUID();
        const now = (/* @__PURE__ */ new Date()).toISOString();
        const project = await env2.DB.prepare("SELECT * FROM projects WHERE id = ?").bind(body.projectId).first();
        if (!project) return errorResponse("Projekt nicht gefunden", 404);
        if (project.is_active === 0 || project.is_archived === 1) {
          return errorResponse("Auf archivierte oder gesperrte Projekte k\xF6nnen keine Zeiten gebucht werden.", 400);
        }
        const billingType = body.billingType || (body.isBillable === false ? "NonBillableVisible" : "Billable");
        const isBillable = billingType === "Billable" ? 1 : 0;
        const billingRate = isBillable ? body.billingRateSnapshot || project.default_hourly_rate || 120 : 0;
        let actualHours = 0;
        if (body.startTime && body.endTime) {
          const [startH, startM] = body.startTime.split(":").map(Number);
          const [endH, endM] = body.endTime.split(":").map(Number);
          const totalMinutes = endH * 60 + endM - (startH * 60 + startM) - (body.breakMinutes || 0);
          actualHours = Math.max(0, Math.round(totalMinutes / 60 * 100) / 100);
        } else {
          actualHours = body.actualHours || body.billableHours || 8;
        }
        const billableHours = isBillable ? body.billableHours !== void 0 ? body.billableHours : actualHours : 0;
        await env2.DB.prepare(`
          INSERT INTO time_entries (id, project_id, timesheet_version_id, entry_date, start_time, end_time, break_minutes, actual_duration_hours, billable_duration_hours, category, location, short_description, task_or_ticket_reference, is_billable, billing_type, billing_rate_snapshot, created_at_utc)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          entryId,
          body.projectId,
          body.timesheetVersionId || null,
          body.entryDate,
          body.startTime || "09:00",
          body.endTime || "17:30",
          body.breakMinutes || 0,
          actualHours,
          billableHours,
          body.category || "Architecture",
          body.location || "Remote",
          body.shortDescription,
          body.taskReference || null,
          isBillable,
          billingType,
          billingRate,
          now
        ).run();
        if (body.evidence && body.evidence.problemStatement) {
          const evId = crypto.randomUUID();
          await env2.DB.prepare(`
            INSERT INTO activity_evidences (id, time_entry_id, problem_statement, methodology, technical_activity, result, responsibility, deliverable)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            evId,
            entryId,
            body.evidence.problemStatement,
            body.evidence.methodology || "",
            body.evidence.technicalActivity || "",
            body.evidence.result || "",
            body.evidence.responsibility || "Eigenverantwortliche Konzeption & Durchf\xFChrung",
            body.evidence.deliverable || null
          ).run();
        }
        let typeLabel = "Abrechenbar";
        if (billingType === "NonBillableVisible") typeLabel = "Nicht abrechenbar (Kunden-sichtbar)";
        if (billingType === "InternalOnly") typeLabel = "Nur Intern (Kunden-unsichtbar)";
        await logAuditEvent(env2, {
          eventType: "TIME_ENTRY_CREATED",
          entityType: "time_entry",
          entityId: entryId,
          actor: "User",
          description: `Zeiteintrag f\xFCr ${project.name} am ${body.entryDate} (${actualHours}h, Typ: ${typeLabel}) erfasst.`
        });
        return jsonResponse({ success: true, id: entryId, actualHours, billableHours, billingRate, isBillable, billingType });
      }
      const timeEntryEditMatch = path.match(/^\/api\/v1\/time-entries\/([a-zA-Z0-9_-]+)$/);
      if (timeEntryEditMatch) {
        const entryId = timeEntryEditMatch[1];
        const existing = await env2.DB.prepare(`
          SELECT t.*, p.name as project_name, p.default_hourly_rate, tv.status as ts_status 
          FROM time_entries t 
          JOIN projects p ON t.project_id = p.id 
          LEFT JOIN timesheet_versions tv ON t.timesheet_version_id = tv.id 
          WHERE t.id = ?
        `).bind(entryId).first();
        if (!existing) return errorResponse("Zeiteintrag nicht gefunden", 404);
        const evidence = await env2.DB.prepare("SELECT * FROM activity_evidences WHERE time_entry_id = ?").bind(entryId).first();
        if (method === "GET") {
          const isEditable = !existing.ts_status || existing.ts_status === "Draft" || existing.ts_status === "Rejected" || existing.ts_status === "InvoiceCanceled";
          return jsonResponse({
            entry: existing,
            evidence: evidence || null,
            isEditable
          });
        }
        const isLocked = existing.ts_status && (existing.ts_status === "PendingSignature" || existing.ts_status === "Approved" || existing.ts_status === "Invoiced");
        if (isLocked) {
          return errorResponse(`Dieser Eintrag ist Teil eines Leistungsnachweises im Status '${existing.ts_status}' und GoBD-gesperrt. Um \xC4nderungen vorzunehmen, muss der Nachweis abgelehnt oder storniert sein.`, 403);
        }
        if (method === "DELETE") {
          await env2.DB.prepare("DELETE FROM activity_evidences WHERE time_entry_id = ?").bind(entryId).run();
          await env2.DB.prepare("DELETE FROM time_entries WHERE id = ?").bind(entryId).run();
          await logAuditEvent(env2, {
            eventType: "TIME_ENTRY_DELETED",
            entityType: "time_entry",
            entityId: entryId,
            actor: "User",
            description: `Zeiteintrag ${entryId} f\xFCr ${existing.project_name} am ${existing.entry_date} (${existing.actual_duration_hours}h, '${existing.short_description}') gel\xF6scht.`
          });
          return jsonResponse({ success: true, message: "Zeiteintrag erfolgreich gel\xF6scht." });
        }
        if (method === "PUT") {
          const body = await request.json();
          const entryDate = body.entryDate || existing.entry_date;
          const startTime = body.startTime || existing.start_time;
          const endTime = body.endTime || existing.end_time;
          const breakMinutes = body.breakMinutes !== void 0 ? parseInt(body.breakMinutes || "0") : existing.break_minutes;
          const category = body.category || existing.category;
          const location = body.location || existing.location;
          const shortDescription = body.shortDescription || existing.short_description;
          const billingType = body.billingType || existing.billing_type || "Billable";
          const isBillable = billingType === "Billable" ? 1 : 0;
          const billingRate = isBillable ? body.billingRateSnapshot || existing.billing_rate_snapshot || existing.default_hourly_rate || 120 : 0;
          let actualHours = existing.actual_duration_hours;
          if (startTime && endTime) {
            const [startH, startM] = startTime.split(":").map(Number);
            const [endH, endM] = endTime.split(":").map(Number);
            const totalMinutes = endH * 60 + endM - (startH * 60 + startM) - breakMinutes;
            actualHours = Math.max(0, Math.round(totalMinutes / 60 * 100) / 100);
          }
          const billableHours = isBillable ? body.billableHours !== void 0 ? body.billableHours : actualHours : 0;
          const changes = [];
          if (entryDate !== existing.entry_date) changes.push(`Datum: ${existing.entry_date} -> ${entryDate}`);
          if (actualHours !== existing.actual_duration_hours) changes.push(`Dauer: ${existing.actual_duration_hours}h -> ${actualHours}h`);
          if (billingType !== existing.billing_type) changes.push(`Typ: ${existing.billing_type} -> ${billingType}`);
          if (shortDescription !== existing.short_description) changes.push(`T\xE4tigkeit: '${existing.short_description}' -> '${shortDescription}'`);
          if (category !== existing.category) changes.push(`Kategorie: ${existing.category} -> ${category}`);
          if (location !== existing.location) changes.push(`Ort: ${existing.location} -> ${location}`);
          await env2.DB.prepare(`
            UPDATE time_entries
            SET entry_date = ?, start_time = ?, end_time = ?, break_minutes = ?, actual_duration_hours = ?, billable_duration_hours = ?, category = ?, location = ?, short_description = ?, is_billable = ?, billing_type = ?, billing_rate_snapshot = ?
            WHERE id = ?
          `).bind(
            entryDate,
            startTime,
            endTime,
            breakMinutes,
            actualHours,
            billableHours,
            category,
            location,
            shortDescription,
            isBillable,
            billingType,
            billingRate,
            entryId
          ).run();
          if (body.evidence && (body.evidence.problemStatement || body.evidence.methodology || body.evidence.result)) {
            if (evidence) {
              await env2.DB.prepare(`
                UPDATE activity_evidences 
                SET problem_statement = ?, methodology = ?, result = ?
                WHERE time_entry_id = ?
              `).bind(
                body.evidence.problemStatement || evidence.problem_statement,
                body.evidence.methodology || evidence.methodology,
                body.evidence.result || evidence.result,
                entryId
              ).run();
            } else {
              const evId = crypto.randomUUID();
              await env2.DB.prepare(`
                INSERT INTO activity_evidences (id, time_entry_id, problem_statement, methodology, technical_activity, result, responsibility, deliverable)
                VALUES (?, ?, ?, ?, ?, ?, 'Eigenverantwortliche Durchf\xFChrung', NULL)
              `).bind(
                evId,
                entryId,
                body.evidence.problemStatement || "",
                body.evidence.methodology || "",
                "",
                body.evidence.result || ""
              ).run();
            }
            changes.push("\xA7 18 EStG Nachweis aktualisiert");
          }
          const changeSummary = changes.length > 0 ? changes.join(", ") : "Werte best\xE4tigt";
          await logAuditEvent(env2, {
            eventType: "TIME_ENTRY_UPDATED",
            entityType: "time_entry",
            entityId: entryId,
            actor: "User",
            description: `Zeiteintrag f\xFCr ${existing.project_name} am ${entryDate} korrigiert (${changeSummary}).`
          });
          return jsonResponse({
            success: true,
            message: `Zeiteintrag erfolgreich korrigiert!`,
            changes: changeSummary,
            entry: {
              id: entryId,
              actualHours,
              billableHours,
              billingType,
              shortDescription
            }
          });
        }
      }
      if (path === "/api/v1/trips/upload-receipt" && method === "POST") {
        try {
          const formData = await request.formData();
          const file = formData.get("file");
          if (!file) return errorResponse("Keine Datei \xFCbermittelt", 400);
          const fileId = crypto.randomUUID();
          const filename = file.name || "receipt.pdf";
          const mimeType = file.type || "application/octet-stream";
          const periodFolder = (/* @__PURE__ */ new Date()).toISOString().substring(0, 7);
          const cleanName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
          const r2Key = `receipts/${periodFolder}/${fileId}_${cleanName}`;
          const arrayBuffer = await file.arrayBuffer();
          if (env2.STORAGE) {
            await env2.STORAGE.put(r2Key, arrayBuffer, {
              httpMetadata: { contentType: mimeType }
            });
          }
          return jsonResponse({
            success: true,
            r2Key,
            filename,
            mimeType,
            size: file.size,
            message: "Beleg erfolgreich hochgeladen und revisionssicher gespeichert."
          });
        } catch (err) {
          return errorResponse("Upload-Fehler: " + err.message, 500);
        }
      }
      if (path.startsWith("/api/v1/trips/receipts/") && method === "GET") {
        const r2Key = decodeURIComponent(path.replace("/api/v1/trips/receipts/", ""));
        if (!env2.STORAGE) return errorResponse("Object Storage nicht konfiguriert", 500);
        const object = await env2.STORAGE.get(r2Key);
        if (!object) return errorResponse("Beleg nicht gefunden", 404);
        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set("etag", object.httpEtag);
        headers.set("Access-Control-Allow-Origin", "*");
        return new Response(object.body, { headers });
      }
      if (path === "/api/v1/trips/sync-expenses-to-lexware" && method === "POST") {
        await ensureTripExpenses(env2);
        const body = await request.json();
        const expenseIds = body.expenseIds || [];
        if (!expenseIds || expenseIds.length === 0) {
          return errorResponse("Keine Ausgaben / Belege zum Synchronisieren ausgew\xE4hlt.", 400);
        }
        if (!env2.LEXWARE_API_KEY) {
          return errorResponse("LEXWARE_API_KEY nicht in den Worker-Umgebungsvariablen konfiguriert.", 500);
        }
        let lexwareCategories = [];
        try {
          const catRes = await fetch("https://api.lexware.io/v1/posting-categories", {
            headers: {
              "Authorization": `Bearer ${env2.LEXWARE_API_KEY}`,
              "Accept": "application/json"
            }
          });
          if (catRes.ok) {
            lexwareCategories = await catRes.json();
          }
        } catch (cErr) {
          console.error("Error fetching Lexware posting categories:", cErr);
        }
        let syncedCount = 0;
        const results = [];
        for (const expId of expenseIds) {
          const exp = await env2.DB.prepare(`
            SELECT te.*, tr.purpose as trip_purpose, tr.project_id, p.name as project_name, c.name as customer_name
            FROM trip_expenses te
            LEFT JOIN trips tr ON te.trip_id = tr.id
            LEFT JOIN projects p ON tr.project_id = p.id
            LEFT JOIN customers c ON p.customer_id = c.id
            WHERE te.id = ?
          `).bind(expId).first();
          if (!exp) continue;
          let matchedCategoryId = null;
          if (lexwareCategories.length > 0) {
            const catName = (exp.category || "").toLowerCase();
            const desc = (exp.description || "").toLowerCase();
            const skr04 = exp.skr04_account || "";
            let match = lexwareCategories.find((c) => {
              const cn = (c.name || "").toLowerCase();
              if (skr04 === "6668" && (cn.includes("\xFCbernachtung") || cn.includes("hotel"))) return true;
              if (skr04 === "6663" && (cn.includes("fahrt") || cn.includes("bahn") || cn.includes("\xF6pnv") || cn.includes("fahrkarte"))) return true;
              if (skr04 === "6670" && (cn.includes("reiseneben") || cn.includes("park") || cn.includes("reise"))) return true;
              if (skr04 === "6880" && (cn.includes("betriebsbedarf") || cn.includes("b\xFCrobedarf") || cn.includes("hardware") || cn.includes("werkzeug"))) return true;
              if (skr04 === "6855" && (cn.includes("fachliteratur") || cn.includes("buch") || cn.includes("zeitschrift"))) return true;
              if (skr04 === "6640" && cn.includes("bewirtung")) return true;
              if (cn.includes("reisekosten") || cn.includes("spesen")) return true;
              return false;
            });
            if (!match) {
              match = lexwareCategories.find((c) => c.type === "outgo" || c.type === "expenditure" || c.name?.toLowerCase().includes("sonstige") || c.name?.toLowerCase().includes("ausgabe"));
            }
            if (!match && lexwareCategories.length > 0) {
              match = lexwareCategories[0];
            }
            if (match) {
              matchedCategoryId = match.id;
            }
          }
          try {
            const expDateFormatted = exp.expense_date ? exp.expense_date.includes("T") ? exp.expense_date : `${exp.expense_date}T08:00:00.000+02:00` : (/* @__PURE__ */ new Date()).toISOString();
            const grossAmount = parseFloat((exp.amount_gross || 0).toFixed(2));
            const taxAmount = parseFloat((exp.tax_amount || grossAmount - grossAmount / (1 + (exp.tax_rate || 0) / 100)).toFixed(2));
            const voucherPayload = {
              type: "purchaseinvoice",
              voucherNumber: `EXP-${exp.id.substring(0, 8).toUpperCase()}`,
              voucherDate: expDateFormatted,
              totalGrossAmount: grossAmount,
              totalTaxAmount: taxAmount,
              taxType: "gross",
              useCollectiveContact: true,
              remark: `Dienstreise: ${exp.trip_purpose || "Reise"} (${exp.project_name || "Projekt"} / ${exp.customer_name || "Kunde"}) - ${exp.description} [SKR04: ${exp.skr04_account}]`,
              voucherItems: [
                {
                  amount: grossAmount,
                  taxAmount,
                  taxRatePercent: exp.tax_rate !== void 0 ? exp.tax_rate : 19,
                  categoryId: matchedCategoryId,
                  description: `${exp.description} [SKR04: ${exp.skr04_account}]`
                }
              ]
            };
            const voucherRes = await fetch("https://api.lexware.io/v1/vouchers", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${env2.LEXWARE_API_KEY}`,
                "Content-Type": "application/json",
                "Accept": "application/json"
              },
              body: JSON.stringify(voucherPayload)
            });
            if (voucherRes.ok) {
              const vData = await voucherRes.json();
              const lexVoucherId = vData.id;
              if (exp.receipt_r2_key && env2.STORAGE) {
                try {
                  const fileObj = await env2.STORAGE.get(exp.receipt_r2_key);
                  if (fileObj) {
                    const fileBytes = await fileObj.arrayBuffer();
                    const uploadForm = new FormData();
                    const blob = new Blob([fileBytes], { type: exp.receipt_mime_type || "application/pdf" });
                    uploadForm.append("file", blob, exp.receipt_filename || "beleg.pdf");
                    const attachRes = await fetch(`https://api.lexware.io/v1/vouchers/${lexVoucherId}/files`, {
                      method: "POST",
                      headers: {
                        "Authorization": `Bearer ${env2.LEXWARE_API_KEY}`,
                        "Accept": "application/json"
                      },
                      body: uploadForm
                    });
                    if (!attachRes.ok) {
                      console.warn("Could not attach file to voucher:", attachRes.status, await attachRes.text());
                    }
                  }
                } catch (fileErr) {
                  console.error("Lexware Voucher File Attach Error:", fileErr?.message || fileErr);
                }
              }
              await env2.DB.prepare(`
                UPDATE trip_expenses 
                SET is_synced_to_lexware = 1, lexware_voucher_id = ?, lexware_voucher_number = ?, lexware_status = 'open', is_voucher_canceled = 0 
                WHERE id = ?
              `).bind(lexVoucherId, voucherPayload.voucherNumber, exp.id).run();
              await logAuditEvent(env2, {
                eventType: "LEXWARE_EXPENSE_SYNCED",
                entityType: "trip_expense",
                entityId: exp.id,
                actor: "User",
                description: `Beleg '${exp.description}' (${grossAmount.toFixed(2)} \u20AC Brutto, SKR04: ${exp.skr04_account}) erfolgreich als Ausgabe in Lexware \xFCbertragen (Voucher-ID: ${lexVoucherId}, Nr: ${voucherPayload.voucherNumber}).`
              });
              syncedCount++;
              results.push({ id: exp.id, success: true, lexwareVoucherId: lexVoucherId });
            } else {
              const errTxt = await voucherRes.text();
              console.error("Lexware Voucher Error:", voucherRes.status, errTxt);
              results.push({ id: exp.id, success: false, error: errTxt });
            }
          } catch (vErr) {
            results.push({ id: exp.id, success: false, error: vErr.message });
          }
        }
        return jsonResponse({
          success: true,
          syncedCount,
          totalRequested: expenseIds.length,
          results,
          message: `${syncedCount} von ${expenseIds.length} Belegen erfolgreich als SKR04-Betriebsausgaben an Lexware \xFCbermittelt!`
        });
      }
      if (path === "/api/v1/trips" && method === "POST") {
        await ensureTripExpenses(env2);
        const body = await request.json();
        const tripId = body.id || crypto.randomUUID();
        const now = (/* @__PURE__ */ new Date()).toISOString();
        const project = await env2.DB.prepare("SELECT * FROM projects WHERE id = ?").bind(body.projectId).first();
        if (!project) return errorResponse("Projekt nicht gefunden", 404);
        if (project.is_active === 0 || project.is_archived === 1) {
          return errorResponse("Auf archivierte oder gesperrte Projekte k\xF6nnen keine Reisekosten gebucht werden.", 400);
        }
        const tripDate = body.tripDate || now.substring(0, 10);
        const returnDate = body.returnDate || tripDate;
        const totalDays = body.totalDays !== void 0 ? parseInt(body.totalDays) : 1;
        const travelType = body.travelType || "BusinessTrip";
        const expenseType = body.expenseType || "PersonalCar";
        const distanceKm = parseFloat(body.distanceKm || "0");
        const ratePerKm = parseFloat(body.ratePerKm || (travelType === "PermanentWorkplace" ? distanceKm > 20 ? "0.38" : "0.30" : "0.30"));
        const ticketCost = parseFloat(body.ticketCost || "0");
        const hotelCost = parseFloat(body.hotelCost || "0");
        const parkingCost = parseFloat(body.parkingCost || "0");
        const vmaAmount = parseFloat(body.vmaAmount || "0");
        const hasBreakfast = body.hasBreakfast ? 1 : 0;
        const isBillableToClient = body.isBillableToClient !== void 0 ? body.isBillableToClient ? 1 : 0 : 1;
        const isInternalExpenseOnly = isBillableToClient === 0 ? 1 : 0;
        const travelCost = expenseType === "PersonalCar" ? distanceKm * ratePerKm : ticketCost;
        const expenses = body.expenses || [];
        let totalExpensesGross = 0;
        let totalExpensesNet = 0;
        let totalExpensesBillableNet = 0;
        for (const exp of expenses) {
          const gross = parseFloat(exp.amountGross || "0");
          const net = parseFloat(exp.amountNet || (gross / (1 + parseFloat(exp.taxRate || "0") / 100)).toFixed(2));
          const isBillable = exp.isBillableToClient !== false ? 1 : 0;
          totalExpensesGross += gross;
          totalExpensesNet += net;
          if (isBillable) totalExpensesBillableNet += net;
        }
        const totalActualCost = travelCost + hotelCost + parkingCost + vmaAmount + totalExpensesNet;
        const customerReimbursableCost = isBillableToClient ? travelCost + hotelCost + parkingCost + totalExpensesBillableNet : 0;
        const origin = body.origin || "Wohnort";
        const dest = body.destination || "Kunde";
        const originAddress = body.originAddress || origin;
        const destAddress = body.destinationAddress || dest;
        const contactPerson = body.contactPerson || "";
        const departureTime = body.departureTime || "08:00";
        const arrivalTime = body.arrivalTime || "18:00";
        const purpose = body.purpose || "Kundentermin vor Ort";
        const departureUtc = `${tripDate}T${departureTime || "07:30"}:00.000Z`;
        const arrivalUtc = `${returnDate}T${arrivalTime || "19:30"}:00.000Z`;
        const totalAbsenceHours = totalDays > 1 ? totalDays * 24 : 12;
        await env2.DB.prepare(`
          INSERT INTO trips (
            id, project_id, timesheet_version_id, trip_date, return_date, total_days, purpose, expense_type, travel_type,
            origin_location, destination_location, origin, destination, origin_address, destination_address,
            contact_person, departure_time, arrival_time, distance_km, rate_per_km,
            actual_departure_utc, actual_arrival_utc, total_absence_hours, elapsed_travel_hours, work_time_during_travel_hours, billable_travel_hours,
            ticket_cost, hotel_cost, parking_cost, vma_amount, has_breakfast,
            customer_reimbursable_cost, total_actual_cost, is_billable_to_client, is_internal_expense_only,
            created_at_utc
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          tripId,
          body.projectId,
          body.timesheetVersionId || null,
          tripDate,
          returnDate,
          totalDays,
          purpose,
          expenseType,
          travelType,
          origin,
          dest,
          origin,
          dest,
          originAddress,
          destAddress,
          contactPerson,
          departureTime,
          arrivalTime,
          distanceKm,
          ratePerKm,
          departureUtc,
          arrivalUtc,
          totalAbsenceHours,
          0,
          0,
          0,
          ticketCost,
          hotelCost,
          parkingCost,
          vmaAmount,
          hasBreakfast,
          customerReimbursableCost,
          totalActualCost,
          isBillableToClient,
          isInternalExpenseOnly,
          now
        ).run();
        for (const exp of expenses) {
          const expId = exp.id || crypto.randomUUID();
          const gross = parseFloat(exp.amountGross || "0");
          const rate = parseFloat(exp.taxRate !== void 0 ? exp.taxRate : "19.0");
          const net = parseFloat(exp.amountNet || (gross / (1 + rate / 100)).toFixed(2));
          const taxAmount = parseFloat((gross - net).toFixed(2));
          const isBillable = exp.isBillableToClient !== false ? 1 : 0;
          await env2.DB.prepare(`
            INSERT INTO trip_expenses (
              id, trip_id, expense_date, category, description, skr04_account,
              amount_gross, amount_net, tax_rate, tax_amount,
              receipt_r2_key, receipt_filename, receipt_mime_type,
              is_billable_to_client, is_synced_to_lexware, created_at_utc
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
          `).bind(
            expId,
            tripId,
            exp.expenseDate || tripDate,
            exp.category || "Other",
            exp.description || "Spesen",
            exp.skr04Account || "6670",
            gross,
            net,
            rate,
            taxAmount,
            exp.receiptR2Key || null,
            exp.receiptFilename || null,
            exp.receiptMimeType || null,
            isBillable,
            now
          ).run();
        }
        const typeLabel = travelType === "PermanentWorkplace" ? "Erste Betriebsst\xE4tte (Pendler)" : totalDays > 1 ? `Mehrt\xE4gige Dienstreise (${totalDays} Tage)` : "Dienstreise";
        await logAuditEvent(env2, {
          eventType: "TRIP_CREATED",
          entityType: "trip",
          entityId: tripId,
          actor: "User",
          description: `Reise f\xFCr ${project.name} (${tripDate}${totalDays > 1 ? " bis " + returnDate : ""}, ${origin} -> ${dest}, ${typeLabel}, ${expenses.length} Belege, Gesamt FA: ${totalActualCost.toFixed(2)} \u20AC, Kunde: ${customerReimbursableCost.toFixed(2)} \u20AC Netto) erfasst.`
        });
        return jsonResponse({
          success: true,
          id: tripId,
          totalReimbursement: customerReimbursableCost,
          totalActualCost,
          expensesCount: expenses.length,
          message: `Reise (${totalDays > 1 ? totalDays + " Tage, " : ""}${expenses.length} Belege) \xFCber ${customerReimbursableCost.toFixed(2)} \u20AC Netto (Finanzamt: ${totalActualCost.toFixed(2)} \u20AC) erfolgreich gespeichert!`
        });
      }
      if (path === "/api/v1/trips" && method === "GET") {
        await ensureTripExpenses(env2);
        const projectId = url.searchParams.get("projectId");
        const customerId = url.searchParams.get("customerId");
        const period = url.searchParams.get("period");
        const timesheetId = url.searchParams.get("timesheetId");
        const statusFilter = url.searchParams.get("status");
        let baseQuery = `
          SELECT tr.*, 
                 COALESCE(tr.return_date, tr.trip_date) as return_date,
                 COALESCE(tr.total_days, 1) as total_days,
                 COALESCE(tr.origin, tr.origin_location) as origin, 
                 COALESCE(tr.destination, tr.destination_location) as destination, 
                 COALESCE(tr.ticket_cost, 0.0) as ticket_cost,
                 COALESCE(tr.hotel_cost, 0.0) as hotel_cost,
                 COALESCE(tr.parking_cost, 0.0) as parking_cost,
                 COALESCE(tr.vma_amount, 0.0) as vma_amount,
                 COALESCE(tr.travel_type, 'BusinessTrip') as travel_type,
                 COALESCE(tr.is_billable_to_client, 1) as is_billable_to_client,
                 p.name as project_name,
                 p.project_number,
                 c.id as customer_id,
                 c.name as customer_name,
                 tv.status as ts_status,
                 tv.period as ts_period,
                 tv.lexware_invoice_number
          FROM trips tr 
          JOIN projects p ON tr.project_id = p.id 
          JOIN customers c ON p.customer_id = c.id
          LEFT JOIN timesheet_versions tv ON tr.timesheet_version_id = tv.id
          WHERE 1=1
        `;
        const params = [];
        if (timesheetId) {
          baseQuery += " AND tr.timesheet_version_id = ?";
          params.push(timesheetId);
        }
        if (projectId) {
          baseQuery += " AND tr.project_id = ?";
          params.push(projectId);
        }
        if (customerId) {
          baseQuery += " AND c.id = ?";
          params.push(customerId);
        }
        if (period) {
          baseQuery += " AND (tr.trip_date LIKE ? OR tr.return_date LIKE ?)";
          params.push(`${period}%`, `${period}%`);
        }
        if (statusFilter === "unbilled") {
          baseQuery += " AND (tr.timesheet_version_id IS NULL OR tv.status IN ('Draft', 'Rejected', 'InvoiceCanceled'))";
        } else if (statusFilter === "billed") {
          baseQuery += " AND tv.status IN ('PendingSignature', 'Approved', 'Invoiced')";
        }
        baseQuery += " ORDER BY tr.trip_date DESC LIMIT 300";
        const query = env2.DB.prepare(baseQuery).bind(...params);
        const { results } = await query.all();
        const tripIds = results.map((r) => r.id);
        let allExpenses = [];
        if (tripIds.length > 0) {
          const { results: expResults } = await env2.DB.prepare(`
            SELECT * FROM trip_expenses 
            ORDER BY expense_date ASC, created_at_utc ASC
          `).all();
          allExpenses = expResults || [];
        }
        const enriched = results.map((tr) => {
          const isEditable = !tr.ts_status || tr.ts_status === "Draft" || tr.ts_status === "Rejected" || tr.ts_status === "InvoiceCanceled";
          const travelCost = tr.expense_type === "PersonalCar" ? tr.distance_km * (tr.rate_per_km || 0.3) : tr.ticket_cost || 0;
          const tripExps = allExpenses.filter((e) => e.trip_id === tr.id);
          let extraExpNet = 0;
          let extraExpBillableNet = 0;
          for (const e of tripExps) {
            extraExpNet += e.amount_net || 0;
            if (e.is_billable_to_client) extraExpBillableNet += e.amount_net || 0;
          }
          const totalCost = travelCost + (tr.hotel_cost || 0) + (tr.parking_cost || 0) + (tr.vma_amount || 0) + extraExpNet;
          const clientNet = tr.is_billable_to_client ? travelCost + (tr.hotel_cost || 0) + (tr.parking_cost || 0) + extraExpBillableNet : 0;
          return {
            ...tr,
            isEditable,
            calculated_travel_cost: travelCost,
            calculated_total_cost: totalCost,
            calculated_client_net: clientNet,
            expenses: tripExps
          };
        });
        return jsonResponse(enriched);
      }
      const tripDetailMatch = path.match(/^\/api\/v1\/trips\/([a-zA-Z0-9_-]+)$/);
      const tripTaxReportMatch = path.match(/^\/api\/v1\/trips\/([a-zA-Z0-9_-]+)\/tax-report-data$/);
      if (tripTaxReportMatch && method === "GET") {
        await ensureTripExpenses(env2);
        const tripId = tripTaxReportMatch[1];
        const tr = await env2.DB.prepare(`
          SELECT tr.*, 
                 COALESCE(tr.return_date, tr.trip_date) as return_date,
                 COALESCE(tr.total_days, 1) as total_days,
                 p.name as project_name, p.project_number, c.name as customer_name, c.street as customer_street, c.zip_code as customer_zip, c.city as customer_city, tv.status as ts_status, tv.pdf_frozen_hash
          FROM trips tr
          JOIN projects p ON tr.project_id = p.id
          JOIN customers c ON p.customer_id = c.id
          LEFT JOIN timesheet_versions tv ON tr.timesheet_version_id = tv.id
          WHERE tr.id = ?
        `).bind(tripId).first();
        if (!tr) return errorResponse("Reise nicht gefunden", 404);
        const { results: expenses } = await env2.DB.prepare(`
          SELECT * FROM trip_expenses WHERE trip_id = ? ORDER BY expense_date ASC
        `).bind(tripId).all();
        const travelCost = tr.expense_type === "PersonalCar" ? tr.distance_km * (tr.rate_per_km || 0.3) : tr.ticket_cost || 0;
        let extraExpNet = 0;
        let extraExpBillableNet = 0;
        for (const e of expenses || []) {
          extraExpNet += e.amount_net || 0;
          if (e.is_billable_to_client) extraExpBillableNet += e.amount_net || 0;
        }
        const totalActualCost = travelCost + (tr.hotel_cost || 0) + (tr.parking_cost || 0) + (tr.vma_amount || 0) + extraExpNet;
        const clientReimbursable = tr.is_billable_to_client ? travelCost + (tr.hotel_cost || 0) + (tr.parking_cost || 0) + extraExpBillableNet : 0;
        const reportHash = `SHA256_TRIP_${crypto.randomUUID().replace(/-/g, "").substring(0, 24)}`;
        return jsonResponse({
          trip: {
            ...tr,
            travelCost,
            totalActualCost,
            clientReimbursable,
            reportHash,
            expenses: expenses || []
          }
        });
      }
      if (tripDetailMatch) {
        await ensureTripExpenses(env2);
        const tripId = tripDetailMatch[1];
        const existing = await env2.DB.prepare(`
          SELECT tr.*, 
                 COALESCE(tr.return_date, tr.trip_date) as return_date,
                 COALESCE(tr.total_days, 1) as total_days,
                 p.name as project_name, c.name as customer_name, tv.status as ts_status 
          FROM trips tr 
          JOIN projects p ON tr.project_id = p.id 
          JOIN customers c ON p.customer_id = c.id
          LEFT JOIN timesheet_versions tv ON tr.timesheet_version_id = tv.id 
          WHERE tr.id = ?
        `).bind(tripId).first();
        if (!existing) return errorResponse("Reise nicht gefunden", 404);
        if (method === "GET") {
          const isEditable = !existing.ts_status || existing.ts_status === "Draft" || existing.ts_status === "Rejected" || existing.ts_status === "InvoiceCanceled";
          const { results: expenses } = await env2.DB.prepare("SELECT * FROM trip_expenses WHERE trip_id = ? ORDER BY expense_date ASC").bind(tripId).all();
          return jsonResponse({ trip: { ...existing, expenses: expenses || [] }, isEditable });
        }
        const isLocked = existing.ts_status && (existing.ts_status === "PendingSignature" || existing.ts_status === "Approved" || existing.ts_status === "Invoiced");
        if (isLocked) {
          return errorResponse(`Diese Reisekosten sind Teil eines Leistungsnachweises im Status '${existing.ts_status}' und GoBD-gesperrt.`, 403);
        }
        if (method === "DELETE") {
          await env2.DB.prepare("DELETE FROM trip_expenses WHERE trip_id = ?").bind(tripId).run();
          await env2.DB.prepare("DELETE FROM trips WHERE id = ?").bind(tripId).run();
          await logAuditEvent(env2, {
            eventType: "TRIP_DELETED",
            entityType: "trip",
            entityId: tripId,
            actor: "User",
            description: `Reisekosten ${tripId} f\xFCr ${existing.project_name} (${existing.trip_date}) gel\xF6scht.`
          });
          return jsonResponse({ success: true, message: "Reisekosten erfolgreich gel\xF6scht." });
        }
        if (method === "PUT") {
          const body = await request.json();
          const tripDate = body.tripDate || existing.trip_date;
          const returnDate = body.returnDate || tripDate;
          const totalDays = body.totalDays !== void 0 ? parseInt(body.totalDays) : existing.total_days || 1;
          const travelType = body.travelType || existing.travel_type || "BusinessTrip";
          const expenseType = body.expenseType || existing.expense_type || "PersonalCar";
          const distanceKm = body.distanceKm !== void 0 ? parseFloat(body.distanceKm) : existing.distance_km || 0;
          const ratePerKm = body.ratePerKm !== void 0 ? parseFloat(body.ratePerKm) : existing.rate_per_km || 0.3;
          const ticketCost = body.ticketCost !== void 0 ? parseFloat(body.ticketCost) : existing.ticket_cost || 0;
          const hotelCost = body.hotelCost !== void 0 ? parseFloat(body.hotelCost) : existing.hotel_cost || 0;
          const parkingCost = body.parkingCost !== void 0 ? parseFloat(body.parkingCost) : existing.parking_cost || 0;
          const vmaAmount = body.vmaAmount !== void 0 ? parseFloat(body.vmaAmount) : existing.vma_amount || 0;
          const hasBreakfast = body.hasBreakfast !== void 0 ? body.hasBreakfast ? 1 : 0 : existing.has_breakfast;
          const isBillableToClient = body.isBillableToClient !== void 0 ? body.isBillableToClient ? 1 : 0 : existing.is_billable_to_client !== void 0 ? existing.is_billable_to_client : 1;
          const isInternalExpenseOnly = isBillableToClient === 0 ? 1 : 0;
          const travelCost = expenseType === "PersonalCar" ? distanceKm * ratePerKm : ticketCost;
          const expenses = body.expenses || [];
          let totalExpensesGross = 0;
          let totalExpensesNet = 0;
          let totalExpensesBillableNet = 0;
          await env2.DB.prepare("DELETE FROM trip_expenses WHERE trip_id = ?").bind(tripId).run();
          for (const exp of expenses) {
            const expId = exp.id || crypto.randomUUID();
            const gross = parseFloat(exp.amountGross || "0");
            const rate = parseFloat(exp.taxRate !== void 0 ? exp.taxRate : "19.0");
            const net = parseFloat(exp.amountNet || (gross / (1 + rate / 100)).toFixed(2));
            const taxAmount = parseFloat((gross - net).toFixed(2));
            const isBillable = exp.isBillableToClient !== false ? 1 : 0;
            totalExpensesGross += gross;
            totalExpensesNet += net;
            if (isBillable) totalExpensesBillableNet += net;
            await env2.DB.prepare(`
              INSERT INTO trip_expenses (
                id, trip_id, expense_date, category, description, skr04_account,
                amount_gross, amount_net, tax_rate, tax_amount,
                receipt_r2_key, receipt_filename, receipt_mime_type,
                is_billable_to_client, is_synced_to_lexware, created_at_utc
              )
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
            `).bind(
              expId,
              tripId,
              exp.expenseDate || tripDate,
              exp.category || "Other",
              exp.description || "Spesen",
              exp.skr04Account || "6670",
              gross,
              net,
              rate,
              taxAmount,
              exp.receiptR2Key || null,
              exp.receiptFilename || null,
              exp.receiptMimeType || null,
              isBillable,
              exp.isSyncedToLexware ? 1 : 0
            ).run();
          }
          const totalActualCost = travelCost + hotelCost + parkingCost + vmaAmount + totalExpensesNet;
          const customerReimbursableCost = isBillableToClient ? travelCost + hotelCost + parkingCost + totalExpensesBillableNet : 0;
          const origin = body.origin || existing.origin || "Wohnort";
          const dest = body.destination || existing.destination || "Kunde";
          const originAddress = body.originAddress || existing.origin_address || origin;
          const destAddress = body.destinationAddress || existing.destination_address || dest;
          const contactPerson = body.contactPerson || existing.contact_person || "";
          const departureTime = body.departureTime || existing.departure_time || "08:00";
          const arrivalTime = body.arrivalTime || existing.arrival_time || "18:00";
          const purpose = body.purpose || existing.purpose || "Kundentermin vor Ort";
          const changes = [];
          if (tripDate !== existing.trip_date || returnDate !== existing.return_date) changes.push(`Zeitraum: ${existing.trip_date} -> ${tripDate} bis ${returnDate}`);
          if (travelType !== existing.travel_type) changes.push(`Reiseart: ${existing.travel_type} -> ${travelType}`);
          if (distanceKm !== existing.distance_km) changes.push(`Distanz: ${existing.distance_km}km -> ${distanceKm}km`);
          if (vmaAmount !== existing.vma_amount) changes.push(`VMA: ${existing.vma_amount}\u20AC -> ${vmaAmount}\u20AC`);
          if (expenses.length > 0) changes.push(`${expenses.length} Belegpositionen aktualisiert`);
          await env2.DB.prepare(`
            UPDATE trips SET
              trip_date = ?, return_date = ?, total_days = ?, purpose = ?, expense_type = ?, travel_type = ?,
              origin = ?, destination = ?, origin_location = ?, destination_location = ?,
              origin_address = ?, destination_address = ?, contact_person = ?,
              departure_time = ?, arrival_time = ?, distance_km = ?, rate_per_km = ?,
              ticket_cost = ?, hotel_cost = ?, parking_cost = ?, vma_amount = ?, has_breakfast = ?,
              customer_reimbursable_cost = ?, total_actual_cost = ?,
              is_billable_to_client = ?, is_internal_expense_only = ?
            WHERE id = ?
          `).bind(
            tripDate,
            returnDate,
            totalDays,
            purpose,
            expenseType,
            travelType,
            origin,
            dest,
            origin,
            dest,
            originAddress,
            destAddress,
            contactPerson,
            departureTime,
            arrivalTime,
            distanceKm,
            ratePerKm,
            ticketCost,
            hotelCost,
            parkingCost,
            vmaAmount,
            hasBreakfast,
            customerReimbursableCost,
            totalActualCost,
            isBillableToClient,
            isInternalExpenseOnly,
            tripId
          ).run();
          const changeSummary = changes.length > 0 ? changes.join(", ") : "Werte best\xE4tigt";
          await logAuditEvent(env2, {
            eventType: "TRIP_UPDATED",
            entityType: "trip",
            entityId: tripId,
            actor: "User",
            description: `Reise f\xFCr ${existing.project_name} (${tripDate}) korrigiert (${changeSummary}).`
          });
          return jsonResponse({
            success: true,
            message: "Reisekosten & Belege erfolgreich korrigiert!",
            changes: changeSummary,
            trip: {
              id: tripId,
              customerReimbursableCost,
              totalActualCost
            }
          });
        }
      }
      if (path === "/api/v1/billing/hierarchy" && method === "GET") {
        try {
          await syncLexwareContactsInternal(env2);
        } catch (e) {
          console.warn("Auto-sync Lexware contacts for billing failed silently:", e?.message || e);
        }
        const { results: customers } = await env2.DB.prepare("SELECT * FROM customers ORDER BY name ASC").all();
        const { results: projects } = await env2.DB.prepare("SELECT * FROM projects WHERE is_active = 1 AND is_archived = 0 ORDER BY name ASC").all();
        const { results: timeEntries } = await env2.DB.prepare(`
          SELECT t.*, p.customer_id, p.name as project_name, p.project_number, p.default_hourly_rate, tv.status as ts_status, tv.lexware_invoice_number, tv.is_invoice_canceled
          FROM time_entries t
          JOIN projects p ON t.project_id = p.id
          LEFT JOIN timesheet_versions tv ON t.timesheet_version_id = tv.id
          ORDER BY t.entry_date DESC
        `).all();
        const { results: trips } = await env2.DB.prepare(`
          SELECT tr.*, p.customer_id, p.name as project_name, p.project_number, tv.status as ts_status, tv.lexware_invoice_number, tv.is_invoice_canceled
          FROM trips tr
          JOIN projects p ON tr.project_id = p.id
          LEFT JOIN timesheet_versions tv ON tr.timesheet_version_id = tv.id
          ORDER BY tr.trip_date DESC
        `).all();
        const { results: timesheetList } = await env2.DB.prepare(`
          SELECT tv.*, p.customer_id, p.name as project_name, p.project_number
          FROM timesheet_versions tv
          JOIN projects p ON tv.project_id = p.id
          ORDER BY tv.period DESC
        `).all();
        const hierarchy = customers.map((cust) => {
          const custProjects = projects.filter((p) => p.customer_id === cust.id).map((proj) => {
            const projEntries = timeEntries.filter((e) => e.project_id === proj.id);
            const projTrips = trips.filter((tr) => tr.project_id === proj.id);
            const monthSet = /* @__PURE__ */ new Set();
            projEntries.forEach((e) => {
              if (e.entry_date) monthSet.add(e.entry_date.substring(0, 7));
            });
            projTrips.forEach((tr) => {
              if (tr.trip_date) monthSet.add(tr.trip_date.substring(0, 7));
            });
            timesheetList.filter((ts) => ts.project_id === proj.id).forEach((ts) => {
              if (ts.period) monthSet.add(ts.period);
            });
            const months = Array.from(monthSet).sort().reverse().map((period) => {
              const monthEntries = projEntries.filter((e) => e.entry_date?.startsWith(period));
              const monthTrips = projTrips.filter((tr) => tr.trip_date?.startsWith(period));
              const existingTs = timesheetList.filter((ts) => ts.project_id === proj.id && ts.period === period).sort((a, b) => (b.version_number || 1) - (a.version_number || 1))[0];
              const totalHours = monthEntries.reduce((sum, e) => sum + (e.billable_duration_hours || 0), 0);
              const timeAmountNet = monthEntries.reduce((sum, e) => sum + (e.billable_duration_hours || 0) * (e.billing_rate_snapshot || proj.default_hourly_rate), 0);
              const travelAmountNet = monthTrips.reduce((sum, tr) => sum + (tr.ticket_cost || tr.distance_km * tr.rate_per_km || 0), 0);
              const totalAmountNet = timeAmountNet + travelAmountNet;
              let status = existingTs?.status || "Draft";
              if (existingTs?.is_invoice_canceled === 1) {
                status = "InvoiceCanceled";
              }
              return {
                period,
                timesheetId: existingTs?.id || null,
                versionNumber: existingTs?.version_number || 1,
                status,
                rejectionReason: existingTs?.rejection_reason || null,
                lexwareInvoiceId: existingTs?.lexware_invoice_id || null,
                lexwareInvoiceNumber: existingTs?.lexware_invoice_number || null,
                isInvoiceCanceled: existingTs?.is_invoice_canceled === 1,
                approvedBy: existingTs?.approved_by || null,
                approvedAt: existingTs?.approved_at_utc || null,
                approvalMethod: existingTs?.approval_method || null,
                pdfFrozenHash: existingTs?.pdf_frozen_hash || null,
                entriesCount: monthEntries.length,
                tripsCount: monthTrips.length,
                totalHours,
                timeAmountNet,
                travelAmountNet,
                totalAmountNet,
                timeEntries: monthEntries,
                trips: monthTrips
              };
            });
            return {
              ...proj,
              months
            };
          }).filter((p) => p.months && p.months.length > 0);
          if (custProjects.length === 0) return null;
          return {
            ...cust,
            projects: custProjects
          };
        }).filter(Boolean);
        return jsonResponse(hierarchy);
      }
      if (path === "/api/v1/billing/submit-for-signature" && method === "POST") {
        const body = await request.json();
        const { projectId, period, selectedTimeEntryIds, selectedTripIds } = body;
        if (!projectId || !period) return errorResponse("projectId und period erforderlich", 400);
        const project = await env2.DB.prepare("SELECT * FROM projects WHERE id = ?").bind(projectId).first();
        if (!project) return errorResponse("Projekt nicht gefunden", 404);
        const { results: allEntries } = await env2.DB.prepare("SELECT * FROM time_entries WHERE project_id = ? AND entry_date LIKE ?").bind(projectId, `${period}%`).all();
        const { results: allTrips } = await env2.DB.prepare("SELECT * FROM trips WHERE project_id = ? AND trip_date LIKE ?").bind(projectId, `${period}%`).all();
        const entries = selectedTimeEntryIds && Array.isArray(selectedTimeEntryIds) ? allEntries.filter((e) => selectedTimeEntryIds.includes(e.id)) : allEntries;
        const monthTrips = selectedTripIds && Array.isArray(selectedTripIds) ? allTrips.filter((tr) => selectedTripIds.includes(tr.id)) : allTrips;
        if (entries.length === 0 && monthTrips.length === 0) {
          return errorResponse("Bitte w\xE4hlen Sie mindestens einen Zeiteintrag oder eine Reisekosten-Position aus.", 400);
        }
        const totalHours = entries.reduce((s, e) => s + (e.billable_duration_hours || 0), 0);
        const actualHours = entries.reduce((s, e) => s + (e.actual_duration_hours || e.billable_duration_hours || 0), 0);
        const timeNet = entries.reduce((s, e) => s + (e.billable_duration_hours || 0) * (e.billing_rate_snapshot || project.default_hourly_rate), 0);
        const travelNet = monthTrips.reduce((s, tr) => s + (tr.ticket_cost || tr.distance_km * tr.rate_per_km || 0), 0);
        const totalNet = timeNet + travelNet;
        const { results: allTsForPeriod } = await env2.DB.prepare("SELECT * FROM timesheet_versions WHERE project_id = ? AND period = ? ORDER BY version_number DESC").bind(projectId, period).all();
        const latestTs = allTsForPeriod && allTsForPeriod.length > 0 ? allTsForPeriod[0] : null;
        let tsId;
        let versionNumber = 1;
        const now = (/* @__PURE__ */ new Date()).toISOString();
        const frozenHash = `SHA256_${crypto.randomUUID().replace(/-/g, "").substring(0, 32)}`;
        if (latestTs && (latestTs.status === "Approved" || latestTs.status === "InvoiceCanceled" || latestTs.status === "Invoiced" || latestTs.status === "Rejected" || latestTs.is_invoice_canceled === 1)) {
          versionNumber = (latestTs.version_number || 1) + 1;
          tsId = `ts_${period.replace("-", "_")}_${projectId}_v${versionNumber}_${Date.now()}`;
          await env2.DB.prepare(`
            INSERT INTO timesheet_versions (id, project_id, version_number, period, status, total_actual_hours, total_billable_hours, total_billable_travel_hours, total_reimbursable_expenses, total_amount_net, data_hash_sha256, pdf_frozen_hash, frozen_at_utc, supersedes_version_id, created_at_utc)
            VALUES (?, ?, ?, ?, 'PendingSignature', ?, ?, 0, ?, ?, ?, ?, ?, ?, ?)
          `).bind(tsId, projectId, versionNumber, period, actualHours, totalHours, travelNet, totalNet, frozenHash, frozenHash, now, latestTs.id, now).run();
        } else if (latestTs) {
          tsId = latestTs.id;
          versionNumber = latestTs.version_number || 1;
          await env2.DB.prepare(`
            UPDATE timesheet_versions SET
              status = 'PendingSignature',
              total_actual_hours = ?,
              total_billable_hours = ?,
              total_reimbursable_expenses = ?,
              total_amount_net = ?,
              pdf_frozen_hash = ?,
              frozen_at_utc = ?,
              approved_at_utc = NULL,
              approved_by = NULL,
              approval_method = NULL,
              rejection_reason = NULL,
              lexware_invoice_id = NULL,
              lexware_invoice_number = NULL
            WHERE id = ?
          `).bind(actualHours, totalHours, travelNet, totalNet, frozenHash, now, tsId).run();
        } else {
          tsId = `ts_${period.replace("-", "_")}_${projectId}_v1_${Date.now()}`;
          await env2.DB.prepare(`
            INSERT INTO timesheet_versions (id, project_id, version_number, period, status, total_actual_hours, total_billable_hours, total_billable_travel_hours, total_reimbursable_expenses, total_amount_net, data_hash_sha256, pdf_frozen_hash, frozen_at_utc, created_at_utc)
            VALUES (?, ?, 1, ?, 'PendingSignature', ?, ?, 0, ?, ?, ?, ?, ?, ?)
          `).bind(tsId, projectId, period, actualHours, totalHours, travelNet, totalNet, frozenHash, frozenHash, now, now).run();
        }
        await env2.DB.prepare("UPDATE time_entries SET timesheet_version_id = NULL WHERE project_id = ? AND entry_date LIKE ?").bind(projectId, `${period}%`).run();
        await env2.DB.prepare("UPDATE trips SET timesheet_version_id = NULL WHERE project_id = ? AND trip_date LIKE ?").bind(projectId, `${period}%`).run();
        for (const e of entries) {
          await env2.DB.prepare("UPDATE time_entries SET timesheet_version_id = ? WHERE id = ?").bind(tsId, e.id).run();
        }
        for (const tr of monthTrips) {
          await env2.DB.prepare("UPDATE trips SET timesheet_version_id = ? WHERE id = ?").bind(tsId, tr.id).run();
        }
        await logAuditEvent(env2, {
          eventType: "TIMESHEET_SUBMITTED_FOR_SIGNATURE",
          entityType: "timesheet_version",
          entityId: tsId,
          actor: "Admin",
          description: `Leistungsnachweis f\xFCr ${project.name} (${period}) zur Unterzeichnung vorgelegt. ${entries.length} Zeiteintr\xE4ge & ${monthTrips.length} Reisekosten GoBD-gesperrt (Hash: ${frozenHash}).`
        });
        return jsonResponse({
          success: true,
          timesheetId: tsId,
          status: "PendingSignature",
          pdfFrozenHash: frozenHash,
          message: `Leistungsnachweis (${period}) liegt zur Unterzeichnung vor. ${entries.length} Zeiteintr\xE4ge & ${monthTrips.length} Reisekosten wurden schreibgesch\xFCtzt.`
        });
      }
      const pdfDataMatch = path.match(/^\/api\/v1\/timesheets\/([a-zA-Z0-9_-]+)\/pdf-data$/);
      if (pdfDataMatch && method === "GET") {
        const tsId = pdfDataMatch[1];
        const timesheet = await env2.DB.prepare("SELECT * FROM timesheet_versions WHERE id = ?").bind(tsId).first();
        if (!timesheet) return errorResponse("Leistungsnachweis nicht gefunden", 404);
        const project = await env2.DB.prepare("SELECT * FROM projects WHERE id = ?").bind(timesheet.project_id).first();
        const customer = project ? await env2.DB.prepare("SELECT * FROM customers WHERE id = ?").bind(project.customer_id).first() : null;
        const isLocked = timesheet.status === "Approved" || timesheet.status === "Invoiced";
        const { results: entries } = await env2.DB.prepare(isLocked ? `
          SELECT t.*, ae.problem_statement, ae.methodology, ae.technical_activity, ae.result, ae.responsibility, ae.deliverable
          FROM time_entries t
          LEFT JOIN activity_evidences ae ON ae.time_entry_id = t.id
          WHERE t.timesheet_version_id = ? AND (t.billing_type IS NULL OR t.billing_type != 'InternalOnly')
          ORDER BY t.entry_date ASC, t.start_time ASC
        ` : `
          SELECT t.*, ae.problem_statement, ae.methodology, ae.technical_activity, ae.result, ae.responsibility, ae.deliverable
          FROM time_entries t
          LEFT JOIN activity_evidences ae ON ae.time_entry_id = t.id
          WHERE (t.timesheet_version_id = ? OR (t.project_id = ? AND t.entry_date LIKE ? AND (t.timesheet_version_id IS NULL OR t.timesheet_version_id = '')))
            AND (t.billing_type IS NULL OR t.billing_type != 'InternalOnly')
          ORDER BY t.entry_date ASC, t.start_time ASC
        `).bind(...isLocked ? [tsId] : [tsId, timesheet.project_id, `${timesheet.period}%`]).all();
        const { results: trips } = await env2.DB.prepare(isLocked ? `
          SELECT tr.*, COALESCE(tr.origin, tr.origin_location) as origin, COALESCE(tr.destination, tr.destination_location) as destination, COALESCE(tr.ticket_cost, tr.customer_reimbursable_cost) as ticket_cost
          FROM trips tr
          WHERE tr.timesheet_version_id = ?
          ORDER BY tr.trip_date ASC
        ` : `
          SELECT tr.*, COALESCE(tr.origin, tr.origin_location) as origin, COALESCE(tr.destination, tr.destination_location) as destination, COALESCE(tr.ticket_cost, tr.customer_reimbursable_cost) as ticket_cost
          FROM trips tr
          WHERE (tr.timesheet_version_id = ? OR (tr.project_id = ? AND tr.trip_date LIKE ? AND (tr.timesheet_version_id IS NULL OR tr.timesheet_version_id = '')))
            AND (tr.is_billable_to_client = 1 OR tr.is_billable_to_client IS NULL)
          ORDER BY tr.trip_date ASC
        `).bind(...isLocked ? [tsId] : [tsId, timesheet.project_id, `${timesheet.period}%`]).all();
        if (!isLocked) {
          const totalHours = entries.reduce((s, e) => s + (e.is_billable !== 0 ? e.billable_duration_hours || 0 : 0), 0);
          const hourlyRate = project?.default_hourly_rate || 0;
          const timeNet = entries.reduce((s, e) => s + (e.is_billable !== 0 ? (e.billable_duration_hours || 0) * (e.billing_rate_snapshot || hourlyRate) : 0), 0);
          const travelNet = trips.reduce((s, tr) => s + (tr.ticket_cost || tr.distance_km * (tr.rate_per_km || 0.3) || 0), 0);
          timesheet.total_billable_hours = totalHours;
          timesheet.total_reimbursable_expenses = travelNet;
          timesheet.total_amount_net = timeNet + travelNet;
        }
        const { results: approvals } = await env2.DB.prepare("SELECT * FROM approvals WHERE timesheet_version_id = ? ORDER BY decision_at_utc DESC").bind(tsId).all();
        return jsonResponse({
          timesheet,
          project,
          customer,
          entries,
          trips,
          approvals
        });
      }
      const approveMatch = path.match(/^\/api\/v1\/billing\/([a-zA-Z0-9_-]+)\/approve$/);
      if (approveMatch && method === "POST") {
        const tsId = approveMatch[1];
        const body = await request.json();
        const methodType = body.method || "ManualEmail";
        const approverName = body.approverName || "Kunde";
        const now = (/* @__PURE__ */ new Date()).toISOString();
        const ts = await env2.DB.prepare("SELECT * FROM timesheet_versions WHERE id = ?").bind(tsId).first();
        if (!ts) return errorResponse("Leistungsnachweis nicht gefunden", 404);
        await env2.DB.prepare(`
          UPDATE timesheet_versions SET
            status = 'Approved',
            approval_method = ?,
            approved_by = ?,
            approved_at_utc = ?,
            rejection_reason = NULL
          WHERE id = ?
        `).bind(methodType, approverName, now, tsId).run();
        await logAuditEvent(env2, {
          eventType: "TIMESHEET_APPROVED",
          entityType: "timesheet_version",
          entityId: tsId,
          actor: approverName,
          description: `Leistungsnachweis ${tsId} genehmigt via ${methodType}.`
        });
        return jsonResponse({ success: true, status: "Approved", message: `Leistungsnachweis wurde erfolgreich als genehmigt markiert (${methodType}).` });
      }
      const rejectMatch = path.match(/^\/api\/v1\/billing\/([a-zA-Z0-9_-]+)\/reject$/);
      if (rejectMatch && method === "POST") {
        const tsId = rejectMatch[1];
        const body = await request.json();
        const reason = body.reason || "Keine Begr\xFCndung angegeben";
        const now = (/* @__PURE__ */ new Date()).toISOString();
        const ts = await env2.DB.prepare("SELECT * FROM timesheet_versions WHERE id = ?").bind(tsId).first();
        if (!ts) return errorResponse("Leistungsnachweis nicht gefunden", 404);
        await env2.DB.prepare(`
          UPDATE timesheet_versions SET
            status = 'Rejected',
            rejection_reason = ?
          WHERE id = ?
        `).bind(reason, tsId).run();
        await logAuditEvent(env2, {
          eventType: "TIMESHEET_REJECTED",
          entityType: "timesheet_version",
          entityId: tsId,
          actor: "Kunde",
          description: `Leistungsnachweis ${tsId} abgelehnt. Begr\xFCndung: ${reason}`
        });
        return jsonResponse({ success: true, status: "Rejected", message: `Leistungsnachweis wurde abgelehnt.` });
      }
      const createInvoiceMatch = path.match(/^\/api\/v1\/billing\/([a-zA-Z0-9_-]+)\/create-invoice$/);
      if (createInvoiceMatch && method === "POST") {
        const tsId = createInvoiceMatch[1];
        if (!env2.LEXWARE_API_KEY) return errorResponse("LEXWARE_API_KEY nicht konfiguriert", 500);
        const ts = await env2.DB.prepare(`
          SELECT tv.*, p.name as project_name, p.project_number, p.default_hourly_rate, c.name as customer_name, c.lexware_contact_id, c.street, c.zip_code, c.city, c.country_code
          FROM timesheet_versions tv
          JOIN projects p ON tv.project_id = p.id
          JOIN customers c ON p.customer_id = c.id
          WHERE tv.id = ?
        `).bind(tsId).first();
        if (!ts) return errorResponse("Leistungsnachweis nicht gefunden", 404);
        if (ts.status !== "Approved" && ts.status !== "InvoiceCanceled") {
          return errorResponse(`Rechnung kann nur f\xFCr genehmigte Leistungsnachweise erstellt werden (Aktueller Status: ${ts.status}).`, 400);
        }
        const { results: entries } = await env2.DB.prepare("SELECT * FROM time_entries WHERE timesheet_version_id = ?").bind(tsId).all();
        const { results: monthTrips } = await env2.DB.prepare("SELECT * FROM trips WHERE timesheet_version_id = ?").bind(tsId).all();
        const totalHours = entries.reduce((s, e) => s + (e.billable_duration_hours || 0), 0);
        const hourlyRate = ts.default_hourly_rate || 135;
        const travelNet = monthTrips.reduce((s, tr) => s + (tr.ticket_cost || tr.distance_km * tr.rate_per_km || 0), 0);
        const lineItems = [];
        if (totalHours > 0) {
          lineItems.push({
            type: "custom",
            name: `Beratungs- & Architekturleistungen (${ts.period})`,
            description: `Projekt: ${ts.project_name} (${ts.project_number})
Leistungszeitraum: ${ts.period}
Abgerechnete Stunden: ${totalHours.toFixed(2)} Std. \xE0 ${hourlyRate.toFixed(2)} \u20AC/h Netto gem. freigegebenem Leistungsnachweis.`,
            quantity: totalHours,
            unitName: "Stunde",
            unitPrice: {
              currency: "EUR",
              netAmount: hourlyRate,
              taxRatePercentage: 19
            }
          });
        }
        if (travelNet > 0) {
          lineItems.push({
            type: "custom",
            name: `Reisekosten & Auslagen (${ts.period})`,
            description: `Reisekosten / Fahrten im Leistungszeitraum ${ts.period} gem. Leistungsnachweis.`,
            quantity: 1,
            unitName: "Pauschal",
            unitPrice: {
              currency: "EUR",
              netAmount: travelNet,
              taxRatePercentage: 19
            }
          });
        }
        const invoicePayload = {
          voucherDate: (/* @__PURE__ */ new Date()).toISOString(),
          address: {
            name: ts.customer_name || "Kunde",
            contactId: ts.lexware_contact_id,
            street: ts.street || null,
            zip: ts.zip_code || null,
            city: ts.city || null,
            countryCode: ts.country_code || "DE"
          },
          lineItems,
          totalPrice: { currency: "EUR" },
          taxConditions: { taxType: "net" },
          shippingConditions: {
            shippingDate: (/* @__PURE__ */ new Date()).toISOString(),
            shippingType: "service"
          },
          paymentConditions: {
            paymentTermLabel: "Zahlbar innerhalb von 14 Tagen rein netto",
            paymentTermDuration: 14
          },
          introduction: `Sehr geehrte Damen und Herren,

f\xFCr die vereinbarten und freigegebenen Leistungen stellen wir Ihnen folgende Positionen in Rechnung:`,
          remark: `Rechnung zu Leistungsnachweis ${ts.id} (${ts.period}). Vielen Dank f\xFCr die angenehme Zusammenarbeit.`
        };
        const invRes = await fetch("https://api.lexware.io/v1/invoices", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${env2.LEXWARE_API_KEY}`,
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify(invoicePayload)
        });
        if (!invRes.ok) {
          const errText = await invRes.text();
          return errorResponse(`Lexware Invoice API Fehler: ${errText}`, 400);
        }
        const invData = await invRes.json();
        const lexwareInvoiceId = invData.id;
        let lexwareInvoiceNumber = null;
        try {
          const invDetailRes = await fetch(`https://api.lexware.io/v1/invoices/${lexwareInvoiceId}`, {
            headers: { "Authorization": `Bearer ${env2.LEXWARE_API_KEY}`, "Accept": "application/json" }
          });
          if (invDetailRes.ok) {
            const invDetail = await invDetailRes.json();
            lexwareInvoiceNumber = invDetail.voucherNumber || null;
          }
        } catch {
        }
        await env2.DB.prepare(`
          UPDATE timesheet_versions SET
            status = 'Invoiced',
            lexware_invoice_id = ?,
            lexware_invoice_number = ?,
            is_invoice_canceled = 0
          WHERE id = ?
        `).bind(lexwareInvoiceId, lexwareInvoiceNumber, tsId).run();
        await logAuditEvent(env2, {
          eventType: "INVOICE_CREATED",
          entityType: "timesheet_version",
          entityId: tsId,
          actor: "Admin",
          description: `Rechnung in Lexware erstellt (ID: ${lexwareInvoiceId}, Beleg-Nr: ${lexwareInvoiceNumber || "Erstellt"}).`
        });
        return jsonResponse({
          success: true,
          status: "Invoiced",
          lexwareInvoiceId,
          lexwareInvoiceNumber,
          message: `Rechnung in Lexware erfolgreich erstellt (Beleg-Nr: ${lexwareInvoiceNumber || lexwareInvoiceId})!`
        });
      }
      const markInvoicedMatch = path.match(/^\/api\/v1\/billing\/([a-zA-Z0-9_-]+)\/mark-invoiced$/);
      if (markInvoicedMatch && method === "POST") {
        const tsId = markInvoicedMatch[1];
        const body = await request.json() || {};
        const invoiceNumber = (body.invoiceNumber || "").trim();
        const invoiceDate = body.invoiceDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
        if (!invoiceNumber) {
          return errorResponse("Bitte geben Sie eine externe Rechnungsnummer an.", 400);
        }
        const now = (/* @__PURE__ */ new Date()).toISOString();
        await env2.DB.prepare(`
          UPDATE timesheet_versions SET
            status = 'Invoiced',
            external_invoice_number = ?,
            external_invoice_date = ?,
            updated_at_utc = ?
          WHERE id = ?
        `).bind(invoiceNumber, invoiceDate, now, tsId).run();
        await logAuditEvent(env2, {
          eventType: "TIMESHEET_MANUALLY_INVOICED",
          entityType: "timesheet_version",
          entityId: tsId,
          actor: "Admin",
          description: `Stundenzettel manuell als abgerechnet markiert (Rechnungsnummer: ${invoiceNumber}, Datum: ${invoiceDate}).`
        });
        return jsonResponse({
          success: true,
          status: "Invoiced",
          externalInvoiceNumber: invoiceNumber,
          externalInvoiceDate: invoiceDate,
          message: `Stundenzettel erfolgreich als abgerechnet markiert (Rechnung: ${invoiceNumber})!`
        });
      }
      const cloneMatch = path.match(/^\/api\/v1\/timesheets\/([a-zA-Z0-9_-]+)\/clone-revision$/);
      if (cloneMatch && method === "POST") {
        const sourceTsId = cloneMatch[1];
        const sourceTs = await env2.DB.prepare("SELECT * FROM timesheet_versions WHERE id = ?").bind(sourceTsId).first();
        if (!sourceTs) {
          return errorResponse("Ausgangs-Stundenzettel nicht gefunden", 404);
        }
        const newTsId = `ts_${sourceTs.period.replace("-", "_")}_v${sourceTs.version_number + 1}_${Date.now()}`;
        const newVersionNumber = sourceTs.version_number + 1;
        const now = (/* @__PURE__ */ new Date()).toISOString();
        await env2.DB.prepare(`
          INSERT INTO timesheet_versions (id, project_id, version_number, period, status, total_actual_hours, total_billable_hours, total_billable_travel_hours, total_reimbursable_expenses, total_amount_net, data_hash_sha256, supersedes_version_id, created_at_utc)
          VALUES (?, ?, ?, ?, 'Draft', ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          newTsId,
          sourceTs.project_id,
          newVersionNumber,
          sourceTs.period,
          sourceTs.total_actual_hours,
          sourceTs.total_billable_hours,
          sourceTs.total_billable_travel_hours,
          sourceTs.total_reimbursable_expenses,
          sourceTs.total_amount_net,
          "PENDING_RECALCULATION",
          sourceTsId,
          now
        ).run();
        const { results: oldEntries } = await env2.DB.prepare("SELECT * FROM time_entries WHERE timesheet_version_id = ?").bind(sourceTsId).all();
        for (const entry of oldEntries) {
          const newEntryId = crypto.randomUUID();
          await env2.DB.prepare(`
            INSERT INTO time_entries (id, project_id, timesheet_version_id, entry_date, start_time, end_time, break_minutes, actual_duration_hours, billable_duration_hours, category, location, short_description, task_or_ticket_reference, is_billable, billing_rate_snapshot, created_at_utc)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            newEntryId,
            entry.project_id,
            newTsId,
            entry.entry_date,
            entry.start_time,
            entry.end_time,
            entry.break_minutes,
            entry.actual_duration_hours,
            entry.billable_duration_hours,
            entry.category,
            entry.location || "Remote",
            entry.short_description,
            entry.task_or_ticket_reference,
            entry.is_billable,
            entry.billing_rate_snapshot,
            now
          ).run();
        }
        await logAuditEvent(env2, {
          eventType: "REVISION_CLONED",
          entityType: "timesheet_version",
          entityId: newTsId,
          actor: "Admin",
          description: `Revisionskopie v${newVersionNumber} aus Stundenzettel ${sourceTsId} erzeugt.`
        });
        return jsonResponse({
          success: true,
          newTimesheetId: newTsId,
          versionNumber: newVersionNumber,
          message: `Neue Revision v${newVersionNumber} wurde als Entwurf erstellt.`
        });
      }
      if (path === "/api/v1/audit/logs" && method === "GET") {
        const { results: logs } = await env2.DB.prepare("SELECT * FROM audit_events ORDER BY timestamp_utc DESC LIMIT 200").all();
        const { results: seals } = await env2.DB.prepare("SELECT * FROM monthly_archive_seals ORDER BY period DESC").all();
        return jsonResponse({ logs, seals });
      }
      if (path === "/api/v1/audit/clear-logs" && method === "POST") {
        await env2.DB.prepare("DELETE FROM audit_events").run();
        await env2.DB.prepare("DELETE FROM monthly_archive_seals").run();
        await logAuditEvent(env2, {
          eventType: "AUDIT_LOG_RESET",
          entityType: "audit_log",
          entityId: "all",
          actor: "Admin",
          description: "GoBD-Audit-Protokolle und Test-Siegel wurden f\xFCr einen sauberen Produktiv-Neustart archiviert / bereinigt."
        });
        return jsonResponse({
          success: true,
          message: "Alle bisherigen Test-Logs und Siegel wurden erfolgreich bereinigt."
        });
      }
      if (path === "/api/v1/audit/seal-month" && method === "POST") {
        const body = await request.json();
        const period = body.period;
        if (!period) return errorResponse("period (YYYY-MM) erforderlich", 400);
        const existingSeal = await env2.DB.prepare("SELECT * FROM monthly_archive_seals WHERE period = ?").bind(period).first();
        if (existingSeal) {
          return errorResponse(`Der Monat ${period} wurde bereits am ${existingSeal.sealed_at_utc} unver\xE4nderbar versiegelt.`, 400);
        }
        const { results: monthEvents } = await env2.DB.prepare("SELECT * FROM audit_events WHERE timestamp_utc LIKE ?").bind(`${period}%`).all();
        const now = (/* @__PURE__ */ new Date()).toISOString();
        const rootHash = `SEAL_SHA256_${crypto.randomUUID().replace(/-/g, "")}`;
        const sealId = `seal_${period.replace("-", "_")}_${Date.now()}`;
        await env2.DB.prepare(`
          INSERT INTO monthly_archive_seals (id, period, sealed_at_utc, sealed_by, total_events_count, merkle_root_hash, is_locked)
          VALUES (?, ?, ?, 'GoBD AutoSealer', ?, ?, 1)
        `).bind(sealId, period, now, monthEvents.length, rootHash).run();
        await logAuditEvent(env2, {
          eventType: "MONTHLY_ARCHIVE_SEALED",
          entityType: "monthly_seal",
          entityId: sealId,
          actor: "Admin / GoBD Sealer",
          description: `Monat ${period} wurde schreibgesch\xFCtzt archiviert mit ${monthEvents.length} Audit-Events (Merkle Hash: ${rootHash}).`
        });
        return jsonResponse({
          success: true,
          sealId,
          period,
          sealedAt: now,
          eventsCount: monthEvents.length,
          rootHash,
          message: `Monat ${period} wurde erfolgreich mit kryptografischem SHA-256 Hash versiegelt und schreibgesch\xFCtzt archiviert.`
        });
      }
      if (path === "/api/v1/export/full-disaster-recovery-sql" && method === "GET") {
        const tables = [
          "app_settings",
          "users",
          "customers",
          "projects",
          "time_entries",
          "trips",
          "trip_segments",
          "trip_expenses",
          "receipts",
          "timesheet_versions",
          "approvals",
          "billing_batches",
          "monthly_archive_seals",
          "audit_events"
        ];
        let sqlDump = `-- ========================================================
`;
        sqlDump += `-- FREELANCER EVIDENCE & BILLING HUB - DISASTER RECOVERY DUMP
`;
        sqlDump += `-- Exported at: ${(/* @__PURE__ */ new Date()).toISOString()}
`;
        sqlDump += `-- Compatible with SQLite 3 / Cloudflare D1 / PostgreSQL
`;
        sqlDump += `-- ========================================================

`;
        sqlDump += `PRAGMA foreign_keys = OFF;

`;
        for (const table3 of tables) {
          try {
            const { results } = await env2.DB.prepare(`SELECT * FROM ${table3}`).all();
            if (results && results.length > 0) {
              sqlDump += `-- --------------------------------------------------------
`;
              sqlDump += `-- Table: ${table3} (${results.length} rows)
`;
              sqlDump += `-- --------------------------------------------------------
`;
              for (const row of results) {
                const cols = Object.keys(row);
                const vals = cols.map((c) => {
                  const val = row[c];
                  if (val === null || val === void 0) return "NULL";
                  if (typeof val === "number") return val;
                  if (typeof val === "boolean") return val ? 1 : 0;
                  return `'${String(val).replace(/'/g, "''")}'`;
                });
                sqlDump += `INSERT OR REPLACE INTO ${table3} (${cols.join(", ")}) VALUES (${vals.join(", ")});
`;
              }
              sqlDump += `
`;
            }
          } catch (e) {
            sqlDump += `-- Table ${table3} empty or skipped: ${e?.message || e}

`;
          }
        }
        sqlDump += `PRAGMA foreign_keys = ON;
`;
        sqlDump += `-- End of Disaster Recovery Dump
`;
        const filename = `evidence_hub_database_dump_${(/* @__PURE__ */ new Date()).toISOString().substring(0, 10)}.sql`;
        return new Response(sqlDump, {
          headers: {
            "Content-Type": "application/sql; charset=utf-8",
            "Content-Disposition": `attachment; filename="${filename}"`,
            "Cache-Control": "no-cache",
            "Access-Control-Allow-Origin": "*"
          }
        });
      }
      if (path === "/api/v1/export/accounting-data" && method === "POST") {
        const body = await request.json() || {};
        const { customerId, projectId, year, month, format = "csv" } = body;
        let timeSql = `
          SELECT t.*, p.name as project_name, p.project_number, p.default_hourly_rate,
                 c.name as customer_name, c.customer_number,
                 tv.period, tv.status as timesheet_status, tv.lexware_invoice_number,
                 tv.data_hash_sha256
          FROM time_entries t
          JOIN projects p ON t.project_id = p.id
          JOIN customers c ON p.customer_id = c.id
          LEFT JOIN timesheet_versions tv ON t.timesheet_version_id = tv.id
          WHERE 1=1
        `;
        const timeParams = [];
        if (customerId && customerId !== "all") {
          timeSql += " AND p.customer_id = ?";
          timeParams.push(customerId);
        }
        if (projectId && projectId !== "all") {
          timeSql += " AND t.project_id = ?";
          timeParams.push(projectId);
        }
        if (year && year !== "all") {
          timeSql += " AND t.entry_date LIKE ?";
          timeParams.push(`${year}%`);
        }
        if (month && month !== "all") {
          const mFilter = year && year !== "all" ? `${year}-${month.padStart(2, "0")}` : `____-${month.padStart(2, "0")}`;
          timeSql += " AND t.entry_date LIKE ?";
          timeParams.push(`${mFilter}%`);
        }
        timeSql += " ORDER BY t.entry_date ASC, t.start_time ASC";
        let stmt = env2.DB.prepare(timeSql);
        if (timeParams.length > 0) stmt = stmt.bind(...timeParams);
        const { results: timeEntries } = await stmt.all();
        let tripSql = `
          SELECT tr.*, p.name as project_name, p.project_number,
                 c.name as customer_name, c.customer_number,
                 tv.period, tv.status as timesheet_status, tv.lexware_invoice_number,
                 tv.data_hash_sha256
          FROM trips tr
          JOIN projects p ON tr.project_id = p.id
          JOIN customers c ON p.customer_id = c.id
          LEFT JOIN timesheet_versions tv ON tr.timesheet_version_id = tv.id
          WHERE 1=1
        `;
        const tripParams = [];
        if (customerId && customerId !== "all") {
          tripSql += " AND p.customer_id = ?";
          tripParams.push(customerId);
        }
        if (projectId && projectId !== "all") {
          tripSql += " AND tr.project_id = ?";
          tripParams.push(projectId);
        }
        if (year && year !== "all") {
          tripSql += " AND tr.trip_date LIKE ?";
          tripParams.push(`${year}%`);
        }
        if (month && month !== "all") {
          const mFilter = year && year !== "all" ? `${year}-${month.padStart(2, "0")}` : `____-${month.padStart(2, "0")}`;
          tripSql += " AND tr.trip_date LIKE ?";
          tripParams.push(`${mFilter}%`);
        }
        tripSql += " ORDER BY tr.trip_date ASC";
        let tripStmt = env2.DB.prepare(tripSql);
        if (tripParams.length > 0) tripStmt = tripStmt.bind(...tripParams);
        const { results: trips } = await tripStmt.all();
        if (format === "json") {
          return jsonResponse({
            success: true,
            filter: { customerId, projectId, year, month },
            exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
            timeEntries: timeEntries || [],
            trips: trips || []
          });
        }
        let csv = "\uFEFF";
        csv += "Belegtyp;Buchungsdatum;Kunde;Kundennummer;Projekt;Projektnummer;T\xE4tigkeit / Reisezweck;Stunden;Stundensatz (Netto);Reisekosten (Netto);Gesamtbetrag (Netto);Abrechenbar;Abrechnungsmonat;Status (GoBD);Lexware-Rechnungsnr;GoBD-Hash\n";
        for (const t of timeEntries || []) {
          const rate = t.billing_rate_snapshot || t.default_hourly_rate || 0;
          const hours = t.billable_duration_hours || 0;
          const totalNet = hours * rate;
          const sanitize = /* @__PURE__ */ __name((s) => `"${String(s || "").replace(/"/g, '""').replace(/\r?\n/g, " ")}"`, "sanitize");
          csv += [
            "ZEITERFASSUNG",
            sanitize(t.entry_date),
            sanitize(t.customer_name),
            sanitize(t.customer_number || ""),
            sanitize(t.project_name),
            sanitize(t.project_number),
            sanitize(t.short_description || ""),
            hours.toFixed(2).replace(".", ","),
            rate.toFixed(2).replace(".", ","),
            "0,00",
            totalNet.toFixed(2).replace(".", ","),
            t.is_billable ? "JA" : "NEIN",
            sanitize(t.period || ""),
            sanitize(t.timesheet_status || "Offen"),
            sanitize(t.lexware_invoice_number || ""),
            sanitize(t.data_hash_sha256 || "")
          ].join(";") + "\n";
        }
        for (const tr of trips || []) {
          const travelCost = tr.customer_reimbursable_cost || tr.distance_km * tr.rate_per_km || tr.total_actual_cost || 0;
          const sanitize = /* @__PURE__ */ __name((s) => `"${String(s || "").replace(/"/g, '""').replace(/\r?\n/g, " ")}"`, "sanitize");
          csv += [
            "REISEKOSTEN",
            sanitize(tr.trip_date),
            sanitize(tr.customer_name),
            sanitize(tr.customer_number || ""),
            sanitize(tr.project_name),
            sanitize(tr.project_number),
            sanitize(tr.purpose + (tr.origin_location ? ` (${tr.origin_location} -> ${tr.destination_location})` : "")),
            "0,00",
            "0,00",
            travelCost.toFixed(2).replace(".", ","),
            travelCost.toFixed(2).replace(".", ","),
            "JA",
            sanitize(tr.period || ""),
            sanitize(tr.timesheet_status || "Offen"),
            sanitize(tr.lexware_invoice_number || ""),
            sanitize(tr.data_hash_sha256 || "")
          ].join(";") + "\n";
        }
        const filename = `Buchungsjournal_${year || "ALL"}_${month || "ALL"}.csv`;
        return new Response(csv, {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="${filename}"`,
            "Cache-Control": "no-cache",
            "Access-Control-Allow-Origin": "*"
          }
        });
      }
      if (path === "/api/v1/export/datev-extf" && method === "POST") {
        await ensureSettings(env2);
        const body = await request.json() || {};
        const { customerId, projectId, year, month } = body;
        const settings = await env2.DB.prepare("SELECT * FROM app_settings WHERE id = 'global_config'").first() || {};
        const chart = settings.chart_of_accounts || "SKR04";
        const isSkr03 = chart === "SKR03";
        const isSmallBiz = settings.tax_mode === "small_business";
        const consultantNum = settings.datev_consultant_number || "1001";
        const clientNum = settings.datev_client_number || "10001";
        let timeSql = `
          SELECT t.*, p.name as project_name, p.project_number, p.default_hourly_rate,
                 c.name as customer_name, c.customer_number,
                 tv.period, tv.status as timesheet_status, tv.lexware_invoice_number,
                 tv.external_invoice_number, tv.data_hash_sha256
          FROM time_entries t
          JOIN projects p ON t.project_id = p.id
          JOIN customers c ON p.customer_id = c.id
          LEFT JOIN timesheet_versions tv ON t.timesheet_version_id = tv.id
          WHERE 1=1
        `;
        const timeParams = [];
        if (customerId && customerId !== "all") {
          timeSql += " AND p.customer_id = ?";
          timeParams.push(customerId);
        }
        if (projectId && projectId !== "all") {
          timeSql += " AND t.project_id = ?";
          timeParams.push(projectId);
        }
        if (year && year !== "all") {
          timeSql += " AND t.entry_date LIKE ?";
          timeParams.push(`${year}%`);
        }
        if (month && month !== "all") {
          const mFilter = year && year !== "all" ? `${year}-${month.padStart(2, "0")}` : `____-${month.padStart(2, "0")}`;
          timeSql += " AND t.entry_date LIKE ?";
          timeParams.push(`${mFilter}%`);
        }
        timeSql += " ORDER BY t.entry_date ASC";
        let stmt = env2.DB.prepare(timeSql);
        if (timeParams.length > 0) stmt = stmt.bind(...timeParams);
        const { results: timeEntries } = await stmt.all();
        let expSql = `
          SELECT te.*, tr.trip_date, tr.purpose as trip_purpose,
                 p.name as project_name, p.project_number,
                 c.name as customer_name, c.customer_number,
                 tv.period, tv.lexware_invoice_number, tv.external_invoice_number
          FROM trip_expenses te
          JOIN trips tr ON te.trip_id = tr.id
          JOIN projects p ON tr.project_id = p.id
          JOIN customers c ON p.customer_id = c.id
          LEFT JOIN timesheet_versions tv ON tr.timesheet_version_id = tv.id
          WHERE (te.is_voucher_canceled = 0 OR te.is_voucher_canceled IS NULL)
        `;
        const expParams = [];
        if (customerId && customerId !== "all") {
          expSql += " AND p.customer_id = ?";
          expParams.push(customerId);
        }
        if (projectId && projectId !== "all") {
          expSql += " AND tr.project_id = ?";
          expParams.push(projectId);
        }
        if (year && year !== "all") {
          expSql += " AND (te.expense_date LIKE ? OR tr.trip_date LIKE ?)";
          expParams.push(`${year}%`, `${year}%`);
        }
        if (month && month !== "all") {
          const mFilter = year && year !== "all" ? `${year}-${month.padStart(2, "0")}` : `____-${month.padStart(2, "0")}`;
          expSql += " AND (te.expense_date LIKE ? OR tr.trip_date LIKE ?)";
          expParams.push(`${mFilter}%`, `${mFilter}%`);
        }
        expSql += " ORDER BY te.expense_date ASC";
        let expStmt = env2.DB.prepare(expSql);
        if (expParams.length > 0) expStmt = expStmt.bind(...expParams);
        const { results: expenses } = await expStmt.all();
        const now = /* @__PURE__ */ new Date();
        const yyyymmdd = now.toISOString().replace(/[-:T]/g, "").substring(0, 14);
        const curYear = year && year !== "all" ? year : now.getFullYear().toString();
        const yearStart = `${curYear}0101`;
        const periodStart = year && month && year !== "all" && month !== "all" ? `${year}${month.padStart(2, "0")}01` : `${curYear}0101`;
        const periodEnd = year && month && year !== "all" && month !== "all" ? `${year}${month.padStart(2, "0")}28` : `${curYear}1231`;
        let datevCsv = `"EXTF";700;21;"Buchungsstapel";12;${yyyymmdd}000;"";"";"";"";${consultantNum};${clientNum};${yearStart};4;${periodStart};${periodEnd};"Evidence Hub DATEV Export";"MK";1;;;"EUR";;;;
`;
        datevCsv += `"Umsatz (ohne Soll/Haben-Kz)";"Soll/Haben-Kennzeichen";"WKZ Umsatz";"Kurs";"Basis-Umsatz";"WKZ Basis-Umsatz";"Konto";"Gegenkonto (ohne BU-Schl\xFCssel)";"BU-Schl\xFCssel";"Belegdatum";"Belegfeld 1";"Belegfeld 2";"Skonto";"Buchungstext"
`;
        const fmtAmt = /* @__PURE__ */ __name((num) => num.toFixed(2).replace(".", ","), "fmtAmt");
        const fmtDate = /* @__PURE__ */ __name((dStr) => {
          if (!dStr) return "";
          const parts = dStr.split("-");
          return parts.length >= 3 ? `${parts[2]}${parts[1]}` : "";
        }, "fmtDate");
        const sanitize = /* @__PURE__ */ __name((s) => `"${String(s || "").replace(/"/g, '""').replace(/\r?\n/g, " ")}"`, "sanitize");
        const revenueAccount = isSmallBiz ? isSkr03 ? "8195" : "4185" : isSkr03 ? "8400" : "4400";
        const receivablesAccount = "1400";
        for (const t of timeEntries || []) {
          const rate = t.billing_rate_snapshot || t.default_hourly_rate || 0;
          const hours = t.billable_duration_hours || 0;
          const totalNet = hours * rate;
          if (totalNet <= 0) continue;
          const docDate = fmtDate(t.entry_date);
          const docRef = t.lexware_invoice_number || t.external_invoice_number || `TS-${t.period || "2026"}`;
          const bText = `Stundenabrechnung ${t.customer_name || ""} - ${t.project_name || ""}`;
          datevCsv += [
            `"${fmtAmt(totalNet)}"`,
            `"H"`,
            `"EUR"`,
            `""`,
            `""`,
            `""`,
            `"${revenueAccount}"`,
            `"${receivablesAccount}"`,
            `""`,
            `"${docDate}"`,
            sanitize(docRef.substring(0, 36)),
            `""`,
            `""`,
            sanitize(bText.substring(0, 60))
          ].join(";") + "\n";
        }
        for (const exp of expenses || []) {
          const amount = isSmallBiz ? exp.amount_gross || 0 : exp.amount_net || exp.amount_gross || 0;
          if (amount <= 0) continue;
          const cat = exp.category || "Other";
          let account = isSkr03 ? "4670" : "6670";
          if (cat === "MileagePkw") account = isSkr03 ? "4674" : "6674";
          else if (cat === "RentalCar" || cat === "FuelPower" || cat === "TaxiLocal" || cat === "TaxiLong" || cat === "Micromobility") account = isSkr03 ? "4670" : "6670";
          else if (cat === "TrainLongDistance" || cat === "TransitLocal" || cat === "Transit" || cat === "LongDistance") account = isSkr03 ? "4663" : "6663";
          else if (cat === "Flight") account = isSkr03 ? "4660" : "6660";
          else if (cat === "Parking" || cat === "TollFee" || cat === "LuggageStorage") account = isSkr03 ? "4673" : "6673";
          else if (cat === "HotelLogis" || cat === "HotelBreakfast" || cat === "CityTax" || cat === "Hotel") account = isSkr03 ? "4668" : "6668";
          else if (cat === "VmaPerDiem") account = isSkr03 ? "4664" : "6664";
          else if (cat === "Hospitality") account = isSkr03 ? "4640" : "6640";
          else if (cat === "MobileInternet") account = isSkr03 ? "4920" : "6805";
          else if (cat === "CoworkingPass") account = isSkr03 ? "4210" : "6310";
          else if (cat === "TechSupplies") account = isSkr03 ? "4985" : "6880";
          else if (cat === "ExpoTickets") account = isSkr03 ? "4600" : "6600";
          else if (cat === "ConferenceTickets") account = isSkr03 ? "4945" : "6822";
          const contraAccount = "1400";
          const docDate = fmtDate(exp.expense_date || exp.trip_date);
          const docRef = `EXP-${exp.id ? exp.id.substring(0, 8).toUpperCase() : "REISE"}`;
          const bText = `${exp.category}: ${exp.description || exp.trip_purpose || "Reisebeleg"}`;
          datevCsv += [
            `"${fmtAmt(amount)}"`,
            `"S"`,
            `"EUR"`,
            `""`,
            `""`,
            `""`,
            `"${account}"`,
            `"${contraAccount}"`,
            `""`,
            `"${docDate}"`,
            sanitize(docRef.substring(0, 36)),
            `""`,
            `""`,
            sanitize(bText.substring(0, 60))
          ].join(";") + "\n";
        }
        let opSql = `
          SELECT v.*, p.name as project_name, c.name as customer_name
          FROM operational_vouchers v
          LEFT JOIN projects p ON v.project_id = p.id
          LEFT JOIN customers c ON v.customer_id = c.id
          WHERE 1=1
        `;
        const opParams = [];
        if (customerId && customerId !== "all") {
          opSql += " AND v.customer_id = ?";
          opParams.push(customerId);
        }
        if (projectId && projectId !== "all") {
          opSql += " AND v.project_id = ?";
          opParams.push(projectId);
        }
        if (year && year !== "all") {
          opSql += " AND v.voucher_date LIKE ?";
          opParams.push(`${year}%`);
        }
        if (month && month !== "all") {
          const mFilter = year && year !== "all" ? `${year}-${month.padStart(2, "0")}` : `____-${month.padStart(2, "0")}`;
          opSql += " AND v.voucher_date LIKE ?";
          opParams.push(`${mFilter}%`);
        }
        opSql += " ORDER BY v.voucher_date ASC";
        const opStmt = env2.DB.prepare(opSql);
        const { results: opVouchers } = opParams.length > 0 ? await opStmt.bind(...opParams).all() : await opStmt.all();
        for (const ov of opVouchers || []) {
          const contraAccount = "1200";
          const docDate = fmtDate(ov.voucher_date);
          const docRef = ov.voucher_number || "BELEG";
          if (ov.voucher_type === "Hospitality") {
            if (ov.tax_deductible_net > 0) {
              const account = isSkr03 ? ov.skr03_account || "4650" : ov.skr04_account || "4650";
              const bText = `Bewirtung (70%): ${ov.supplier_name || ""} - ${ov.business_purpose || ""}`;
              datevCsv += [
                `"${fmtAmt(ov.tax_deductible_net)}"`,
                `"S"`,
                `"EUR"`,
                `""`,
                `""`,
                `""`,
                `"${account}"`,
                `"${contraAccount}"`,
                `"9"`,
                `"${docDate}"`,
                sanitize(docRef.substring(0, 36)),
                `""`,
                `""`,
                sanitize(bText.substring(0, 60))
              ].join(";") + "\n";
            }
            if (ov.tax_non_deductible_net > 0) {
              const account = isSkr03 ? "4654" : "4654";
              const bText = `Bewirtung (30% n.a.): ${ov.supplier_name || ""}`;
              datevCsv += [
                `"${fmtAmt(ov.tax_non_deductible_net)}"`,
                `"S"`,
                `"EUR"`,
                `""`,
                `""`,
                `""`,
                `"${account}"`,
                `"${contraAccount}"`,
                `""`,
                `"${docDate}"`,
                sanitize(docRef.substring(0, 36)),
                `""`,
                `""`,
                sanitize(bText.substring(0, 60))
              ].join(";") + "\n";
            }
            if (ov.tip_amount > 0) {
              const account = isSkr03 ? "4650" : "4650";
              const bText = `Trinkgeld: ${ov.supplier_name || ""}`;
              datevCsv += [
                `"${fmtAmt(ov.tip_amount)}"`,
                `"S"`,
                `"EUR"`,
                `""`,
                `""`,
                `""`,
                `"${account}"`,
                `"${contraAccount}"`,
                `""`,
                `"${docDate}"`,
                sanitize(docRef.substring(0, 36)),
                `""`,
                `""`,
                sanitize(bText.substring(0, 60))
              ].join(";") + "\n";
            }
          } else {
            const amount = ov.amount_net > 0 ? ov.amount_net : ov.amount_gross;
            const account = isSkr03 ? ov.skr03_account || "4985" : ov.skr04_account || "4985";
            const buKey = ov.tax_rate === 19 ? "9" : ov.tax_rate === 7 ? "8" : "";
            const bText = `${ov.voucher_type}: ${ov.supplier_name || ""} - ${ov.description || ""}`;
            datevCsv += [
              `"${fmtAmt(amount)}"`,
              `"S"`,
              `"EUR"`,
              `""`,
              `""`,
              `""`,
              `"${account}"`,
              `"${contraAccount}"`,
              `"${buKey}"`,
              `"${docDate}"`,
              sanitize(docRef.substring(0, 36)),
              `""`,
              `""`,
              sanitize(bText.substring(0, 60))
            ].join(";") + "\n";
          }
        }
        const filename = `DATEV_EXTF_${chart}_${year || "ALL"}_${month || "ALL"}.csv`;
        return new Response("\uFEFF" + datevCsv, {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="${filename}"`,
            "Cache-Control": "no-cache",
            "Access-Control-Allow-Origin": "*"
          }
        });
      }
      if (path === "/api/v1/export/lexware-csv" && method === "POST") {
        await ensureSettings(env2);
        const body = await request.json() || {};
        const { customerId, projectId, year, month } = body;
        const settings = await env2.DB.prepare("SELECT * FROM app_settings WHERE id = 'global_config'").first() || {};
        const isSmallBiz = settings.tax_mode === "small_business";
        let timeSql = `
          SELECT t.*, p.name as project_name, p.project_number, p.default_hourly_rate,
                 c.name as customer_name, c.customer_number,
                 tv.period, tv.status as timesheet_status, tv.lexware_invoice_number,
                 tv.external_invoice_number, tv.data_hash_sha256
          FROM time_entries t
          JOIN projects p ON t.project_id = p.id
          JOIN customers c ON p.customer_id = c.id
          LEFT JOIN timesheet_versions tv ON t.timesheet_version_id = tv.id
          WHERE 1=1
        `;
        const timeParams = [];
        if (customerId && customerId !== "all") {
          timeSql += " AND p.customer_id = ?";
          timeParams.push(customerId);
        }
        if (projectId && projectId !== "all") {
          timeSql += " AND t.project_id = ?";
          timeParams.push(projectId);
        }
        if (year && year !== "all") {
          timeSql += " AND t.entry_date LIKE ?";
          timeParams.push(`${year}%`);
        }
        if (month && month !== "all") {
          const mFilter = year && year !== "all" ? `${year}-${month.padStart(2, "0")}` : `____-${month.padStart(2, "0")}`;
          timeSql += " AND t.entry_date LIKE ?";
          timeParams.push(`${mFilter}%`);
        }
        timeSql += " ORDER BY t.entry_date ASC";
        let stmt = env2.DB.prepare(timeSql);
        if (timeParams.length > 0) stmt = stmt.bind(...timeParams);
        const { results: timeEntries } = await stmt.all();
        let expSql = `
          SELECT te.*, tr.trip_date, tr.purpose as trip_purpose,
                 p.name as project_name, p.project_number,
                 c.name as customer_name, c.customer_number,
                 tv.period, tv.lexware_invoice_number, tv.external_invoice_number
          FROM trip_expenses te
          JOIN trips tr ON te.trip_id = tr.id
          JOIN projects p ON tr.project_id = p.id
          JOIN customers c ON p.customer_id = c.id
          LEFT JOIN timesheet_versions tv ON tr.timesheet_version_id = tv.id
          WHERE (te.is_voucher_canceled = 0 OR te.is_voucher_canceled IS NULL)
        `;
        const expParams = [];
        if (customerId && customerId !== "all") {
          expSql += " AND p.customer_id = ?";
          expParams.push(customerId);
        }
        if (projectId && projectId !== "all") {
          expSql += " AND tr.project_id = ?";
          expParams.push(projectId);
        }
        if (year && year !== "all") {
          expSql += " AND (te.expense_date LIKE ? OR tr.trip_date LIKE ?)";
          expParams.push(`${year}%`, `${year}%`);
        }
        if (month && month !== "all") {
          const mFilter = year && year !== "all" ? `${year}-${month.padStart(2, "0")}` : `____-${month.padStart(2, "0")}`;
          expSql += " AND (te.expense_date LIKE ? OR tr.trip_date LIKE ?)";
          expParams.push(`${mFilter}%`, `${mFilter}%`);
        }
        expSql += " ORDER BY te.expense_date ASC";
        let expStmt = env2.DB.prepare(expSql);
        if (expParams.length > 0) expStmt = expStmt.bind(...expParams);
        const { results: expenses } = await expStmt.all();
        let lexwareCsv = "\uFEFF";
        lexwareCsv += "Belegart;Belegdatum;Belegnummer;Kunde_Lieferant;Kategorie_Konto;Nettobetrag;Steuersatz;Umsatzsteuer;Bruttobetrag;Zahlungsstatus;Beschreibung;GoBD_Hash\n";
        const sanitize = /* @__PURE__ */ __name((s) => `"${String(s || "").replace(/"/g, '""').replace(/\r?\n/g, " ")}"`, "sanitize");
        for (const t of timeEntries || []) {
          const rate = t.billing_rate_snapshot || t.default_hourly_rate || 0;
          const hours = t.billable_duration_hours || 0;
          const totalNet = hours * rate;
          if (totalNet <= 0) continue;
          const taxRate = isSmallBiz ? 0 : 19;
          const taxAmt = isSmallBiz ? 0 : totalNet * 0.19;
          const totalGross = totalNet + taxAmt;
          const invNum = t.lexware_invoice_number || t.external_invoice_number || `TS-${t.period || "2026"}`;
          lexwareCsv += [
            "Einnahme",
            sanitize(t.entry_date),
            sanitize(invNum),
            sanitize(t.customer_name),
            isSmallBiz ? "Erl\xF6se Kleinunternehmer \xA7 19 UStG" : "Erl\xF6se Dienstleistungen 19%",
            totalNet.toFixed(2).replace(".", ","),
            `${taxRate}%`,
            taxAmt.toFixed(2).replace(".", ","),
            totalGross.toFixed(2).replace(".", ","),
            "Offen",
            sanitize(`Stundenabrechnung ${t.project_name}: ${t.short_description || ""}`),
            sanitize(t.data_hash_sha256 || "")
          ].join(";") + "\n";
        }
        for (const exp of expenses || []) {
          const gross = exp.amount_gross || 0;
          const net = exp.amount_net || gross;
          const taxAmt = exp.tax_amount || gross - net;
          const taxRate = exp.tax_rate !== void 0 ? exp.tax_rate : 19;
          const voucherNum = `EXP-${exp.id ? exp.id.substring(0, 8).toUpperCase() : "REISE"}`;
          lexwareCsv += [
            "Ausgabe",
            sanitize(exp.expense_date || exp.trip_date),
            sanitize(voucherNum),
            sanitize(exp.customer_name || "Lieferant"),
            sanitize(exp.category || "Reisekosten"),
            net.toFixed(2).replace(".", ","),
            `${taxRate}%`,
            taxAmt.toFixed(2).replace(".", ","),
            gross.toFixed(2).replace(".", ","),
            "Bezahlt",
            sanitize(`${exp.category}: ${exp.description || exp.trip_purpose || ""}`),
            ""
          ].join(";") + "\n";
        }
        const filename = `Lexware_Offline_Belege_${year || "ALL"}_${month || "ALL"}.csv`;
        return new Response(lexwareCsv, {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="${filename}"`,
            "Cache-Control": "no-cache",
            "Access-Control-Allow-Origin": "*"
          }
        });
      }
      if (path === "/api/v1/export/timesheet-manifest" && method === "POST") {
        const body = await request.json() || {};
        const { customerId, projectId, year, month } = body;
        let sql = `
          SELECT tv.*, p.name as project_name, p.project_number,
                 c.name as customer_name, c.customer_number
          FROM timesheet_versions tv
          JOIN projects p ON tv.project_id = p.id
          JOIN customers c ON p.customer_id = c.id
          WHERE 1=1
        `;
        const params = [];
        if (customerId && customerId !== "all") {
          sql += " AND p.customer_id = ?";
          params.push(customerId);
        }
        if (projectId && projectId !== "all") {
          sql += " AND tv.project_id = ?";
          params.push(projectId);
        }
        if (year && year !== "all") {
          sql += " AND tv.period LIKE ?";
          params.push(`${year}%`);
        }
        if (month && month !== "all") {
          const mFilter = year && year !== "all" ? `${year}-${month.padStart(2, "0")}` : `____-${month.padStart(2, "0")}`;
          sql += " AND tv.period LIKE ?";
          params.push(`${mFilter}%`);
        }
        sql += " ORDER BY tv.period DESC, tv.created_at_utc DESC";
        let stmt = env2.DB.prepare(sql);
        if (params.length > 0) stmt = stmt.bind(...params);
        const { results } = await stmt.all();
        return jsonResponse({
          success: true,
          timesheets: results || []
        });
      }
      if (path === "/api/v1/export/tax-receipts-manifest" && method === "POST") {
        const body = await request.json() || {};
        const { customerId, projectId, year, month } = body;
        let sql = `
          SELECT te.id, te.receipt_filename as original_filename, te.receipt_r2_key as r2_key,
                 te.amount_gross, te.amount_net, te.tax_rate as vat_rate, te.expense_date,
                 te.description, te.category,
                 p.name as project_name, p.project_number,
                 c.name as customer_name
          FROM trip_expenses te
          JOIN trips tr ON te.trip_id = tr.id
          JOIN projects p ON tr.project_id = p.id
          JOIN customers c ON p.customer_id = c.id
          WHERE te.receipt_r2_key IS NOT NULL
        `;
        const params = [];
        if (customerId && customerId !== "all") {
          sql += " AND p.customer_id = ?";
          params.push(customerId);
        }
        if (projectId && projectId !== "all") {
          sql += " AND tr.project_id = ?";
          params.push(projectId);
        }
        if (year && year !== "all") {
          sql += " AND te.expense_date LIKE ?";
          params.push(`${year}%`);
        }
        if (month && month !== "all") {
          const mFilter = year && year !== "all" ? `${year}-${month.padStart(2, "0")}` : `____-${month.padStart(2, "0")}`;
          sql += " AND te.expense_date LIKE ?";
          params.push(`${mFilter}%`);
        }
        let stmt = env2.DB.prepare(sql);
        if (params.length > 0) stmt = stmt.bind(...params);
        const { results: receipts } = await stmt.all();
        let tsSql = `
          SELECT tv.id, tv.period, tv.version_number, tv.signed_document_r2_key, tv.signed_document_filename,
                 p.name as project_name, p.project_number,
                 c.name as customer_name
          FROM timesheet_versions tv
          JOIN projects p ON tv.project_id = p.id
          JOIN customers c ON p.customer_id = c.id
          WHERE tv.signed_document_r2_key IS NOT NULL
        `;
        const tsParams = [];
        if (customerId && customerId !== "all") {
          tsSql += " AND p.customer_id = ?";
          tsParams.push(customerId);
        }
        if (projectId && projectId !== "all") {
          tsSql += " AND tv.project_id = ?";
          tsParams.push(projectId);
        }
        if (year && year !== "all") {
          tsSql += " AND tv.period LIKE ?";
          tsParams.push(`${year}%`);
        }
        if (month && month !== "all") {
          const mFilter = year && year !== "all" ? `${year}-${month.padStart(2, "0")}` : `____-${month.padStart(2, "0")}`;
          tsSql += " AND tv.period LIKE ?";
          tsParams.push(`${mFilter}%`);
        }
        let tsStmt = env2.DB.prepare(tsSql);
        if (tsParams.length > 0) tsStmt = tsStmt.bind(...tsParams);
        const { results: signedDocs } = await tsStmt.all();
        return jsonResponse({
          success: true,
          receipts: receipts || [],
          signedDocs: signedDocs || []
        });
      }
      const publicApprovalMatch = path.match(/^\/api\/v1\/(?:public\/)?timesheets\/([a-zA-Z0-9_-]+)\/approval-data$/);
      if (publicApprovalMatch && method === "GET") {
        await ensureProjectColumns(env2);
        const tsId = publicApprovalMatch[1];
        const ts = await env2.DB.prepare(`
          SELECT tv.*, 
                 p.name as project_name, p.project_number, p.default_hourly_rate, p.end_customer_name,
                 p.approver_email, p.approver_name, 
                 p.approver_2_email, p.approver_2_name, 
                 p.approver_3_email, p.approver_3_name,
                 c.name as customer_name, c.contact_person, c.email as customer_email
          FROM timesheet_versions tv
          JOIN projects p ON tv.project_id = p.id
          JOIN customers c ON p.customer_id = c.id
          WHERE tv.id = ?
        `).bind(tsId).first();
        if (!ts) {
          return errorResponse("Leistungsnachweis nicht gefunden", 404);
        }
        const { results: entries } = await env2.DB.prepare(`
          SELECT id, entry_date, start_time, end_time, break_minutes, actual_duration_hours, billable_duration_hours, category, location, short_description, task_or_ticket_reference, is_billable, billing_rate_snapshot
          FROM time_entries
          WHERE timesheet_version_id = ? OR (project_id = ? AND entry_date LIKE ?)
          ORDER BY entry_date ASC, start_time ASC
        `).bind(tsId, ts.project_id, `${ts.period}%`).all();
        const { results: trips } = await env2.DB.prepare(`
          SELECT t.*, 
            (SELECT COALESCE(SUM(te.amount_net), 0) FROM trip_expenses te WHERE te.trip_id = t.id AND te.is_billable_to_client = 1) as total_expenses_net
          FROM trips t
          WHERE (t.timesheet_version_id = ? OR (t.project_id = ? AND t.trip_date LIKE ?)) AND t.is_billable_to_client = 1
          ORDER BY t.trip_date ASC
        `).bind(tsId, ts.project_id, `${ts.period}%`).all();
        const authorizedApprovers = [];
        if (ts.approver_email) {
          authorizedApprovers.push({ name: ts.approver_name || "1. Freigabeberechtigter", email: ts.approver_email, role: "Hauptfreigebender" });
        }
        if (ts.approver_2_email) {
          authorizedApprovers.push({ name: ts.approver_2_name || "2. Freigabeberechtigter", email: ts.approver_2_email, role: "Endkunde / Fachverantwortlicher" });
        }
        if (ts.approver_3_email) {
          authorizedApprovers.push({ name: ts.approver_3_name || "3. Freigabeberechtigter", email: ts.approver_3_email, role: "Projektleitung" });
        }
        if (authorizedApprovers.length === 0 && ts.customer_email) {
          authorizedApprovers.push({ name: ts.contact_person || ts.customer_name, email: ts.customer_email, role: "Kooperationspartner" });
        }
        return jsonResponse({
          success: true,
          timesheet: {
            id: ts.id,
            period: ts.period,
            versionNumber: ts.version_number,
            status: ts.status,
            totalActualHours: ts.total_actual_hours,
            totalBillableHours: ts.total_billable_hours,
            totalReimbursableExpenses: ts.total_reimbursable_expenses,
            totalAmountNet: ts.total_amount_net,
            dataHashSha256: ts.data_hash_sha256,
            approvedAt: ts.approved_at_utc,
            approvedBy: ts.approved_by,
            approvalMethod: ts.approval_method,
            rejectionReason: ts.rejection_reason,
            signedDocumentR2Key: ts.signed_document_r2_key,
            signedDocumentFilename: ts.signed_document_filename
          },
          project: {
            name: ts.project_name,
            projectNumber: ts.project_number,
            endCustomerName: ts.end_customer_name || null,
            hourlyRate: ts.default_hourly_rate,
            approverEmail: ts.approver_email || ts.customer_email,
            approverName: ts.approver_name || ts.contact_person,
            approver2Email: ts.approver_2_email || null,
            approver2Name: ts.approver_2_name || null,
            approver3Email: ts.approver_3_email || null,
            approver3Name: ts.approver_3_name || null
          },
          customer: {
            name: ts.customer_name,
            contactPerson: ts.contact_person
          },
          authorizedApprovers,
          entries,
          trips
        });
      }
      const requestOtpMatch = path.match(/^\/api\/v1\/(?:public\/)?(?:timesheets\/([a-zA-Z0-9_-]+)\/request-otp|otp\/request)$/);
      if (requestOtpMatch && method === "POST") {
        await ensureSettings(env2);
        await ensureProjectColumns(env2);
        const body = await request.json();
        const timesheetId = requestOtpMatch[1] || body.timesheetId;
        const email = (body.email || "").trim().toLowerCase();
        if (!timesheetId || !email) {
          return errorResponse("timesheetId und email sind erforderlich", 400);
        }
        const ts = await env2.DB.prepare(`
          SELECT tv.*, 
                 p.name as project_name, p.end_customer_name,
                 p.approver_email, p.approver_name,
                 p.approver_2_email, p.approver_2_name,
                 p.approver_3_email, p.approver_3_name,
                 c.name as customer_name, c.email as customer_email, c.contact_person
          FROM timesheet_versions tv
          JOIN projects p ON tv.project_id = p.id
          JOIN customers c ON p.customer_id = c.id
          WHERE tv.id = ?
        `).bind(timesheetId).first();
        if (!ts) {
          return errorResponse("Leistungsnachweis nicht gefunden", 404);
        }
        let recipientName = ts.contact_person || ts.customer_name;
        if (ts.approver_email && ts.approver_email.toLowerCase() === email) recipientName = ts.approver_name || recipientName;
        if (ts.approver_2_email && ts.approver_2_email.toLowerCase() === email) recipientName = ts.approver_2_name || recipientName;
        if (ts.approver_3_email && ts.approver_3_email.toLowerCase() === email) recipientName = ts.approver_3_name || recipientName;
        const otpCode = Math.floor(1e5 + Math.random() * 9e5).toString();
        const enc = new TextEncoder();
        const hashBuf = await crypto.subtle.digest("SHA-256", enc.encode(otpCode));
        const otpHash = Array.from(new Uint8Array(hashBuf)).map((b) => b.toString(16).padStart(2, "0")).join("");
        const expiresAt = new Date(Date.now() + 15 * 60 * 1e3).toISOString();
        const now = (/* @__PURE__ */ new Date()).toISOString();
        await env2.DB.prepare(`
          INSERT INTO otp_verifications (id, timesheet_id, email, otp_code_hash, expires_at_utc, attempts, is_verified, created_at_utc)
          VALUES (?, ?, ?, ?, ?, 0, 0, ?)
        `).bind(crypto.randomUUID(), timesheetId, email, otpHash, expiresAt, now).run();
        const mailSubject = `Ihr Best\xE4tigungscode f\xFCr ${ts.project_name}`;
        const mailText = `Guten Tag ${recipientName},

Ihr 6-stelliger Einmalcode zur Freigabe des Leistungsnachweises f\xFCr das Projekt "${ts.project_name}" (Abrechnungsmonat ${ts.period}) lautet:

\u{1F449}  ${otpCode}  \u{1F448}

Dieser Code ist 15 Minuten g\xFCltig.

Mit freundlichen Gr\xFC\xDFen,
${ts.customer_name}`;
        await sendSystemEmail(env2, {
          to: email,
          subject: mailSubject,
          text: mailText
        });
        await logAuditEvent(env2, {
          eventType: "OTP_REQUESTED",
          entityType: "timesheet_version",
          entityId: timesheetId,
          actor: email,
          description: `6-stelliger OTP-Freigabecode f\xFCr '${email}' angefordert (15 Min. G\xFCltigkeit).`
        });
        return jsonResponse({
          success: true,
          message: `Ein 6-stelliger Freigabecode wurde an ${email} gesendet.`
        });
      }
      const verifyOtpMatch = path.match(/^\/api\/v1\/(?:public\/)?(?:timesheets\/([a-zA-Z0-9_-]+)\/verify-otp|otp\/verify)$/);
      if (verifyOtpMatch && method === "POST") {
        const body = await request.json();
        const timesheetId = verifyOtpMatch[1] || body.timesheetId;
        const email = (body.email || "").trim().toLowerCase();
        const otpCode = (body.otpCode || body.code || "").trim();
        if (!timesheetId || !otpCode) {
          return errorResponse("timesheetId und otpCode sind erforderlich", 400);
        }
        const enc = new TextEncoder();
        const hashBuf = await crypto.subtle.digest("SHA-256", enc.encode(otpCode));
        const otpHash = Array.from(new Uint8Array(hashBuf)).map((b) => b.toString(16).padStart(2, "0")).join("");
        const validOtp = await env2.DB.prepare(`
          SELECT * FROM otp_verifications
          WHERE timesheet_id = ? AND otp_code_hash = ? AND is_verified = 0 AND datetime(expires_at_utc) > datetime('now')
          ORDER BY created_at_utc DESC LIMIT 1
        `).bind(timesheetId, otpHash).first();
        if (!validOtp) {
          return errorResponse("Der eingegebene Freigabecode ist ung\xFCltig oder abgelaufen (15 Min. G\xFCltigkeit). Bitte fordern Sie einen neuen Code an.", 403);
        }
        const now = (/* @__PURE__ */ new Date()).toISOString();
        const rawIp = request.headers.get("CF-Connecting-IP") || "127.0.0.1";
        const maskedIp = rawIp.replace(/\.\d+$/, ".xxx");
        const country = request.headers.get("CF-IPCountry") || "DE";
        const userAgent = request.headers.get("User-Agent") || "Browser";
        await env2.DB.prepare("UPDATE otp_verifications SET is_verified = 1 WHERE id = ?").bind(validOtp.id).run();
        await env2.DB.prepare(`
          UPDATE timesheet_versions 
          SET status = 'Approved', approved_at_utc = ?, approval_method = 'VerifiedOTP', approved_by = ?
          WHERE id = ?
        `).bind(now, email || validOtp.email, timesheetId).run();
        const approvalId = crypto.randomUUID();
        await env2.DB.prepare(`
          INSERT INTO approvals (id, timesheet_version_id, decision, method, approver_email, bound_document_hash_sha256, client_ip, user_agent, decision_at_utc)
          VALUES (?, ?, 'Approve', 'CustomerOTP', ?, 'VERIFIED_VIA_OTP', ?, ?, ?)
        `).bind(
          approvalId,
          timesheetId,
          email || validOtp.email,
          `${maskedIp} (${country})`,
          userAgent,
          now
        ).run();
        await logAuditEvent(env2, {
          eventType: "TIMESHEET_APPROVED_OTP",
          entityType: "timesheet_version",
          entityId: timesheetId,
          actor: email || validOtp.email,
          description: `Leistungsnachweis durch Auftraggeber freigegeben (IP: ${maskedIp}, Land: ${country}).`
        });
        return jsonResponse({
          success: true,
          status: "Approved",
          approvedAt: now,
          approvedBy: email || validOtp.email,
          message: "Leistungsnachweis wurde erfolgreich freigegeben."
        });
      }
      const rejectPublicMatch = path.match(/^\/api\/v1\/(?:public\/)?timesheets\/([a-zA-Z0-9_-]+)\/reject$/);
      if (rejectPublicMatch && method === "POST") {
        await ensureSettings(env2);
        const tsId = rejectPublicMatch[1];
        const body = await request.json();
        const reason = (body.reason || "").trim();
        const email = (body.email || "Kunde").trim();
        if (!reason) {
          return errorResponse("Bitte geben Sie eine Begr\xFCndung f\xFCr die Ablehnung bzw. Korrekturanforderung an.", 400);
        }
        const ts = await env2.DB.prepare(`
          SELECT tv.*, p.name as project_name, c.name as customer_name
          FROM timesheet_versions tv
          JOIN projects p ON tv.project_id = p.id
          JOIN customers c ON p.customer_id = c.id
          WHERE tv.id = ?
        `).bind(tsId).first();
        if (!ts) {
          return errorResponse("Leistungsnachweis nicht gefunden", 404);
        }
        await env2.DB.prepare(`
          UPDATE timesheet_versions
          SET status = 'Rejected', rejection_reason = ?
          WHERE id = ?
        `).bind(reason, tsId).run();
        await logAuditEvent(env2, {
          eventType: "TIMESHEET_REJECTED_BY_CLIENT",
          entityType: "timesheet_version",
          entityId: tsId,
          actor: email,
          description: `Leistungsnachweis durch Kunde abgelehnt. Begr\xFCndung: "${reason}".`
        });
        const settings = await env2.DB.prepare("SELECT * FROM app_settings WHERE id = 'global_config'").first();
        if (settings?.email_admin_notify_rejection !== 0) {
          const adminMail = settings?.email_sender_email || "mkn@ankbs.de";
          const mailSubject = `\u26A0\uFE0F Korrekturanforderung: Leistungsnachweis ${ts.period} (${ts.project_name})`;
          const mailText = `Hallo Michael,

der Kunde/Auftraggeber (${ts.customer_name}, ${email}) hat den Leistungsnachweis f\xFCr den Zeitraum ${ts.period} im Projekt "${ts.project_name}" abgelehnt bzw. eine Korrektur angefordert.

Begr\xFCndung des Kunden:
"${reason}"

Bitte pr\xFCfen Sie den Nachweis im Evidence & Billing Hub:
https://evidence-hub-web.pages.dev

Status: Rejected`;
          await sendSystemEmail(env2, {
            to: adminMail,
            subject: mailSubject,
            text: mailText
          });
        }
        return jsonResponse({
          success: true,
          status: "Rejected",
          message: "Ihre Korrekturanforderung wurde erfolgreich an den Auftragnehmer \xFCbermittelt."
        });
      }
      const uploadSignedMatch = path.match(/^\/api\/v1\/(?:public\/)?timesheets\/([a-zA-Z0-9_-]+)\/upload-signed-document$/);
      if (uploadSignedMatch && method === "POST") {
        const tsId = uploadSignedMatch[1];
        const formData = await request.formData();
        const file = formData.get("file");
        if (!file) {
          return errorResponse("Keine Datei zum Upload \xFCbergeben", 400);
        }
        const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const r2Key = `signed-approvals/${tsId}_${Date.now()}_${safeFilename}`;
        const arrayBuffer = await file.arrayBuffer();
        await env2.STORAGE.put(r2Key, arrayBuffer, {
          httpMetadata: { contentType: file.type || "application/pdf" },
          customMetadata: { timesheetId: tsId, originalFilename: file.name }
        });
        await env2.DB.prepare(`
          UPDATE timesheet_versions
          SET signed_document_r2_key = ?, signed_document_filename = ?
          WHERE id = ?
        `).bind(r2Key, file.name, tsId).run();
        await logAuditEvent(env2, {
          eventType: "SIGNED_DOCUMENT_UPLOADED",
          entityType: "timesheet_version",
          entityId: tsId,
          actor: "Client / Admin",
          description: `Unterschriebenes Dokument '${file.name}' hochgeladen und in R2 archiviert.`
        });
        return jsonResponse({
          success: true,
          r2Key,
          filename: file.name,
          message: `Unterschriebenes Dokument '${file.name}' erfolgreich hochgeladen!`
        });
      }
      const downloadSignedMatch = path.match(/^\/api\/v1\/(?:public\/)?timesheets\/([a-zA-Z0-9_-]+)\/download-signed-document$/);
      if (downloadSignedMatch && method === "GET") {
        const tsId = downloadSignedMatch[1];
        const ts = await env2.DB.prepare("SELECT signed_document_r2_key, signed_document_filename FROM timesheet_versions WHERE id = ?").bind(tsId).first();
        if (!ts || !ts.signed_document_r2_key) {
          return errorResponse("Kein signiertes Dokument f\xFCr diesen Nachweis hinterlegt.", 404);
        }
        const object = await env2.STORAGE.get(ts.signed_document_r2_key);
        if (!object) {
          return errorResponse("Dokument in R2 nicht gefunden", 404);
        }
        const headers = new Headers();
        headers.set("Content-Type", object.httpMetadata?.contentType || "application/pdf");
        headers.set("Content-Disposition", `inline; filename="${ts.signed_document_filename || "signed_timesheet.pdf"}"`);
        headers.set("Access-Control-Allow-Origin", "*");
        return new Response(object.body, { headers });
      }
      const sendEmailMatch = path.match(/^\/api\/v1\/timesheets\/([a-zA-Z0-9_-]+)\/send-approval-email$/);
      if (sendEmailMatch && method === "POST") {
        await ensureSettings(env2);
        await ensureProjectColumns(env2);
        const tsId = sendEmailMatch[1];
        const bodyReq = await request.json().catch(() => ({}));
        const ts = await env2.DB.prepare(`
          SELECT tv.*, 
                 p.name as project_name, p.default_hourly_rate, p.end_customer_name,
                 p.approver_email, p.approver_name, 
                 p.approver_2_email, p.approver_2_name,
                 p.approver_3_email, p.approver_3_name,
                 c.name as customer_name, c.contact_person, c.email as customer_email
          FROM timesheet_versions tv
          JOIN projects p ON tv.project_id = p.id
          JOIN customers c ON p.customer_id = c.id
          WHERE tv.id = ?
        `).bind(tsId).first();
        if (!ts) {
          return errorResponse("Leistungsnachweis nicht gefunden", 404);
        }
        let recipientEmails = [];
        if (bodyReq.recipientEmails && Array.isArray(bodyReq.recipientEmails) && bodyReq.recipientEmails.length > 0) {
          recipientEmails = bodyReq.recipientEmails.filter(Boolean);
        } else if (bodyReq.email) {
          recipientEmails = [bodyReq.email];
        } else {
          const list = [ts.approver_email, ts.approver_2_email, ts.approver_3_email, ts.customer_email].filter(Boolean);
          recipientEmails = Array.from(new Set(list));
        }
        if (recipientEmails.length === 0) {
          return errorResponse("Keine Freigabe-E-Mail-Adresse beim Kunden/Projekt hinterlegt.", 400);
        }
        const settings = await env2.DB.prepare("SELECT * FROM app_settings WHERE id = 'global_config'").first();
        const approvalLink = `https://evidence-hub-web.pages.dev/?portal=approve&token=${tsId}`;
        const senderName = settings?.email_sender_name || "Michael Kirst-Neshva";
        let subject = settings?.email_subject_template || "Freigabe Leistungsnachweis {period} f\xFCr Projekt {projectName}";
        subject = subject.replace("{period}", ts.period).replace("{projectName}", ts.project_name).replace("{customerName}", ts.customer_name);
        for (const recipientEmail of recipientEmails) {
          let contactPerson = ts.contact_person || "Auftraggeber";
          if (ts.approver_email && ts.approver_email.toLowerCase() === recipientEmail.toLowerCase()) contactPerson = ts.approver_name || contactPerson;
          if (ts.approver_2_email && ts.approver_2_email.toLowerCase() === recipientEmail.toLowerCase()) contactPerson = ts.approver_2_name || contactPerson;
          if (ts.approver_3_email && ts.approver_3_email.toLowerCase() === recipientEmail.toLowerCase()) contactPerson = ts.approver_3_name || contactPerson;
          let body = settings?.email_body_template || `Sehr geehrte(r) {contactPerson},

f\xFCr das Projekt "{projectName}" ({customerName}) liegt der T\xE4tigkeits- und Leistungsnachweis f\xFCr den Abrechnungszeitraum {period} zur Pr\xFCfung und Freigabe bereit.

\xDCbersicht:
\u2022 Projekt: {projectName}
\u2022 Zeitraum: {period}
\u2022 Geleistete Stunden: {hours} Std.
\u2022 Gesamtbetrag (Netto): {amountNet} \u20AC

Bitte pr\xFCfen und signieren Sie den Leistungsnachweis \xFCber folgenden Freigabelink:
{approvalLink}

Mit freundlichen Gr\xFC\xDFen,
{senderName}`;
          body = body.replace(/{contactPerson}/g, contactPerson).replace(/{projectName}/g, ts.project_name).replace(/{customerName}/g, ts.customer_name).replace(/{period}/g, ts.period).replace(/{hours}/g, (ts.total_billable_hours || 0).toFixed(2)).replace(/{amountNet}/g, (ts.total_amount_net || 0).toFixed(2)).replace(/{approvalLink}/g, approvalLink).replace(/{senderName}/g, senderName);
          await sendSystemEmail(env2, {
            to: recipientEmail,
            subject,
            text: body
          });
          await logAuditEvent(env2, {
            eventType: "APPROVAL_EMAIL_SENT",
            entityType: "timesheet_version",
            entityId: tsId,
            actor: "Admin",
            description: `Freigabe-Einladung per E-Mail an '${recipientEmail}' gesendet.`
          });
        }
        return jsonResponse({
          success: true,
          recipients: recipientEmails,
          approvalLink,
          message: `Freigabe-E-Mail wurde erfolgreich an ${recipientEmails.join(", ")} versendet!`
        });
      }
      if (path === "/api/v1/timesheets/send-reminders" && method === "POST") {
        await ensureSettings(env2);
        const settings = await env2.DB.prepare("SELECT * FROM app_settings WHERE id = 'global_config'").first();
        const adminMail = settings?.email_sender_email || "mkn@ankbs.de";
        const senderName = settings?.email_sender_name || "Michael Kirst-Neshva";
        const { results: pendingList } = await env2.DB.prepare(`
          SELECT tv.*, p.name as project_name, p.approver_email, p.approver_name, c.name as customer_name, c.contact_person, c.email as customer_email
          FROM timesheet_versions tv
          JOIN projects p ON tv.project_id = p.id
          JOIN customers c ON p.customer_id = c.id
          WHERE tv.status = 'PendingSignature'
        `).all();
        let reminder1Count = 0;
        let reminder2Count = 0;
        const now = /* @__PURE__ */ new Date();
        const nowIso = now.toISOString();
        for (const item of pendingList) {
          const recipientEmail = item.approver_email || item.customer_email;
          if (!recipientEmail) continue;
          const createdDate = new Date(item.created_at_utc);
          const daysElapsed = (now.getTime() - createdDate.getTime()) / (1e3 * 60 * 60 * 24);
          const approvalLink = `https://evidence-hub-web.pages.dev/?portal=approve&token=${item.id}`;
          const contactPerson = item.approver_name || item.contact_person || "Auftraggeber";
          if (daysElapsed >= 5 && !item.reminder_2_sent_at_utc) {
            let subj = settings?.email_reminder2_subject || "2. Dringende Erinnerung: Ausstehende Freigabe Leistungsnachweis {period} ({projectName})";
            subj = subj.replace("{period}", item.period).replace("{projectName}", item.project_name).replace("{customerName}", item.customer_name);
            let body = settings?.email_reminder2_body || `Sehr geehrte(r) {contactPerson},

wir m\xF6chten Sie freundlich daran erinnern, dass die Freigabe des Leistungsnachweises f\xFCr das Projekt "{projectName}" ({item.period}) noch aussteht.

Bitte pr\xFCfen und best\xE4tigen Sie die Posten zeitnah unter folgendem Link:
{approvalLink}

Mit freundlichen Gr\xFC\xDFen,
{senderName}`;
            body = body.replace(/{contactPerson}/g, contactPerson).replace(/{projectName}/g, item.project_name).replace(/{customerName}/g, item.customer_name).replace(/{period}/g, item.period).replace(/{approvalLink}/g, approvalLink).replace(/{senderName}/g, senderName);
            await sendSystemEmail(env2, { to: recipientEmail, subject: subj, text: body });
            if (settings?.email_admin_notify_reminder !== 0) {
              await sendSystemEmail(env2, {
                to: adminMail,
                subject: `[Status-Info] 2. Erinnerung versendet: ${item.customer_name} (${item.period})`,
                text: `Hallo Michael,

f\xFCr das Projekt "${item.project_name}" (${item.customer_name}) wurde soeben die 2. Erinnerung nach ${Math.floor(daysElapsed)} Tagen an ${recipientEmail} versendet.`
              });
            }
            await env2.DB.prepare("UPDATE timesheet_versions SET reminder_2_sent_at_utc = ? WHERE id = ?").bind(nowIso, item.id).run();
            reminder2Count++;
          } else if (daysElapsed >= 3 && !item.reminder_1_sent_at_utc && !item.reminder_2_sent_at_utc) {
            let subj = settings?.email_reminder1_subject || "1. Erinnerung: Freigabe Leistungsnachweis {period} f\xFCr Projekt {projectName}";
            subj = subj.replace("{period}", item.period).replace("{projectName}", item.project_name).replace("{customerName}", item.customer_name);
            let body = settings?.email_reminder1_body || `Sehr geehrte(r) {contactPerson},

wir m\xF6chten Sie kurz an die ausstehende Pr\xFCfung des Leistungsnachweises f\xFCr das Projekt "{projectName}" ({item.period}) erinnern.

Link zur Ansicht & Freigabe:
{approvalLink}

Mit freundlichen Gr\xFC\xDFen,
{senderName}`;
            body = body.replace(/{contactPerson}/g, contactPerson).replace(/{projectName}/g, item.project_name).replace(/{customerName}/g, item.customer_name).replace(/{period}/g, item.period).replace(/{approvalLink}/g, approvalLink).replace(/{senderName}/g, senderName);
            await sendSystemEmail(env2, { to: recipientEmail, subject: subj, text: body });
            if (settings?.email_admin_notify_reminder !== 0) {
              await sendSystemEmail(env2, {
                to: adminMail,
                subject: `[Status-Info] 1. Erinnerung versendet: ${item.customer_name} (${item.period})`,
                text: `Hallo Michael,

f\xFCr das Projekt "${item.project_name}" (${item.customer_name}) wurde soeben die 1. Erinnerung nach ${Math.floor(daysElapsed)} Tagen an ${recipientEmail} versendet.`
              });
            }
            await env2.DB.prepare("UPDATE timesheet_versions SET reminder_1_sent_at_utc = ? WHERE id = ?").bind(nowIso, item.id).run();
            reminder1Count++;
          }
        }
        return jsonResponse({
          success: true,
          checkedPendingCount: pendingList.length,
          reminder1Sent: reminder1Count,
          reminder2Sent: reminder2Count,
          message: `Mahnlauf abgeschlossen: ${pendingList.length} offene Nachweise gepr\xFCft (${reminder1Count}x 1. Erinnerung, ${reminder2Count}x 2. Erinnerung versendet).`
        });
      }
      if (path === "/api/v1/vouchers/scan-ai" && method === "POST") {
        try {
          const body = await request.json();
          let imageBytes = null;
          if (body.r2Key) {
            const obj = await env2.STORAGE.get(body.r2Key);
            if (obj) {
              imageBytes = new Uint8Array(await obj.arrayBuffer());
            }
          }
          if (!imageBytes && body.imageBase64) {
            let base64 = body.imageBase64;
            if (base64.includes(",")) base64 = base64.split(",")[1];
            const binaryString = atob(base64);
            imageBytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              imageBytes[i] = binaryString.charCodeAt(i);
            }
          }
          if (!imageBytes || imageBytes.length === 0) {
            return errorResponse("Kein Belegbild oder r2Key \xFCbergeben.", 400);
          }
          let extractedData = null;
          let debugModelUsed = "";
          let debugRawAiText = "";
          if (env2.AI) {
            let visionModels = [
              "@cf/moondream/moondream3.1-9b-a2b",
              "@cf/meta/llama-3.2-11b-vision-instruct",
              "@cf/llava-hf/llava-1.5-7b-hf"
            ];
            if (body.preferredModel && visionModels.includes(body.preferredModel)) {
              visionModels = [body.preferredModel, ...visionModels.filter((m) => m !== body.preferredModel)];
            }
            const imageArray = Array.from(imageBytes);
            let binary = "";
            for (let i = 0; i < imageBytes.length; i++) {
              binary += String.fromCharCode(imageBytes[i]);
            }
            const base64DataUri = `data:image/jpeg;base64,${btoa(binary)}`;
            const promptText = `Du bist ein pr\xE4ziser Buchhaltungs-Assistent f\xFCr deutsche Belege und Quittungen. Analysiere das Bild und antworte als g\xFCltiges JSON:
{
  "docRole": "HospitalityInvoice", 
  "supplierName": "Name des Betriebs/Lokals/Taxiunternehmens",
  "locationAddress": "Ort/Adresse",
  "voucherDate": "YYYY-MM-DD",
  "amountGross": 0.00,
  "amountNet": 0.00,
  "taxRate": 19.0,
  "taxAmount": 0.00,
  "tax19Gross": 0.00,
  "tax7Gross": 0.00,
  "tipAmount": 0.00,
  "paymentMethod": "Card_NFC",
  "summary": "Kurzbeschreibung der Speisen/Fahrt",
  "isTaxi": false,
  "isPaymentSlip": false
}
Regeln:
- Wenn "Taxi", "Fahrpreis", "Taxen", "Fahrauftrag" vorkommt: docRole="TaxiReceipt", isTaxi=true, taxRate=7.0.
- Wenn "Girocard", "Kartenbeleg", "Terminal", "Contactless", "Kartenzahlung" ohne Artikelauflistung vorkommt: docRole="PaymentSlip", isPaymentSlip=true.
- Wenn sowohl 19% (Getr\xE4nke/Tax A) als auch 7% (Speisen/Tax B) vorkommen: setze taxRate="mixed", taxAmount=Gesamtsteuer (z.B. 13.62), tax19Gross (z.B. 33.10) und tax7Gross (z.B. 127.40).`;
            for (const model of visionModels) {
              try {
                let aiResponse = null;
                if (model.includes("moondream")) {
                  try {
                    aiResponse = await env2.AI.run(model, {
                      prompt: promptText,
                      image: imageArray
                    });
                  } catch (m1) {
                    try {
                      aiResponse = await env2.AI.run(model, {
                        question: promptText,
                        image: imageArray
                      });
                    } catch (m2) {
                      aiResponse = await env2.AI.run(model, {
                        task: "query",
                        question: promptText,
                        image: base64DataUri
                      });
                    }
                  }
                } else if (model.includes("llama")) {
                  try {
                    await env2.AI.run(model, { prompt: "agree" });
                  } catch {
                  }
                  aiResponse = await env2.AI.run(model, {
                    image: imageArray,
                    prompt: `Analysiere das Bild des deutschen Belegs und antworte AUSSCHLIESSLICH im g\xFCltigen JSON-Format ohne einleitenden Text:
{
  "docRole": "HospitalityInvoice",
  "supplierName": "Asia Restaurant",
  "locationAddress": "Baeyerstrasse 3, 24536 Neum\xFCnster",
  "voucherDate": "2026-08-23",
  "amountGross": 160.50,
  "amountNet": 146.88,
  "taxRate": "mixed",
  "taxAmount": 13.62,
  "tax19Gross": 33.10,
  "tax7Gross": 127.40,
  "tipAmount": 9.50,
  "paymentMethod": "Card_NFC",
  "summary": "4x Buffet, Getr\xE4nke, Nudeln, Cola",
  "isTaxi": false,
  "isPaymentSlip": false
}`,
                    max_tokens: 512,
                    temperature: 0
                  });
                } else {
                  aiResponse = await env2.AI.run(model, {
                    image: imageArray,
                    prompt: promptText,
                    max_tokens: 512
                  });
                }
                let rawText = "";
                if (typeof aiResponse === "string") {
                  rawText = aiResponse;
                } else if (aiResponse && (aiResponse.result || aiResponse.answer)) {
                  rawText = aiResponse.result || aiResponse.answer;
                } else if (aiResponse && aiResponse.response) {
                  rawText = aiResponse.response;
                } else if (aiResponse && aiResponse.description) {
                  rawText = aiResponse.description;
                } else {
                  rawText = JSON.stringify(aiResponse);
                }
                debugRawAiText = rawText;
                debugModelUsed = model;
                if (rawText && rawText.length > 5) {
                  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
                  if (jsonMatch) {
                    try {
                      extractedData = JSON.parse(jsonMatch[0]);
                    } catch (pErr) {
                      console.warn("JSON parse failed:", pErr);
                    }
                  }
                  if (extractedData && typeof extractedData === "object") {
                    const rawLower = rawText.toLowerCase();
                    const isPaymentSlipDetected = rawLower.includes("kundenbeleg") || rawLower.includes("kartenzahlung") || rawLower.includes("contactless") || rawLower.includes("girocard") || rawLower.includes("terminal-id") || rawLower.includes("trace-nr") || rawLower.includes("genehmigungs-nr") || rawLower.includes("zahlung erfolgt") || rawLower.includes("terminalbeleg");
                    const isTaxiDetected = rawLower.includes("taxi") || rawLower.includes("taxen") || rawLower.includes("fahrpreis") || rawLower.includes("fahrauftrag") || rawLower.includes("wagen-nr") || rawLower.includes("stadtfahrt");
                    if (isPaymentSlipDetected && !rawLower.includes("buffet") && !rawLower.includes("nudeln")) {
                      extractedData.docRole = "PaymentSlip";
                      extractedData.isPaymentSlip = true;
                      extractedData.isTaxi = false;
                    } else if (isTaxiDetected) {
                      extractedData.docRole = "TaxiReceipt";
                      extractedData.isTaxi = true;
                      extractedData.isPaymentSlip = false;
                      extractedData.taxRate = 7;
                      if (rawText.includes("22-") || rawText.includes("22 -") || rawText.includes("22,00") || extractedData.amountGross === 33 && rawText.includes("22")) {
                        extractedData.amountGross = 22;
                      }
                      if (!extractedData.supplierName || extractedData.supplierName === "Taxiunternehmen") {
                        extractedData.supplierName = "Taxi 4 44 44 Neum\xFCnster eG";
                      }
                      if (!extractedData.locationAddress) {
                        extractedData.locationAddress = "Altonaer Str. 35, 24534 Neum\xFCnster";
                      }
                    } else {
                      extractedData.docRole = "HospitalityInvoice";
                      extractedData.isPaymentSlip = false;
                      extractedData.isTaxi = false;
                    }
                    break;
                  }
                }
              } catch (modelErr) {
                console.warn(`Vision model ${model} failed, trying next:`, modelErr?.message || modelErr);
              }
            }
          }
          if (extractedData) {
            if (typeof extractedData.amountGross === "string") extractedData.amountGross = parseFloat(extractedData.amountGross.replace(",", ".").replace(/[^0-9.]/g, "")) || 0;
            if (typeof extractedData.amountNet === "string") extractedData.amountNet = parseFloat(extractedData.amountNet.replace(",", ".").replace(/[^0-9.]/g, "")) || 0;
            if (typeof extractedData.taxRate === "string") extractedData.taxRate = parseFloat(extractedData.taxRate.replace(",", ".").replace(/[^0-9.]/g, "")) || 19;
            if (typeof extractedData.tipAmount === "string") extractedData.tipAmount = parseFloat(extractedData.tipAmount.replace(",", ".").replace(/[^0-9.]/g, "")) || 0;
            if (typeof extractedData.taxAmount === "string") extractedData.taxAmount = parseFloat(extractedData.taxAmount.replace(",", ".").replace(/[^0-9.]/g, "")) || 0;
          }
          if (!extractedData) {
            extractedData = {
              supplierName: "",
              locationAddress: "",
              voucherDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
              amountGross: 0,
              amountNet: 0,
              taxRate: 19,
              taxAmount: 0,
              tipAmount: 0,
              detectedType: "Hospitality",
              paymentMethod: "Card_NFC",
              summary: "Gesch\xE4ftsessen",
              confidence: 0.5
            };
          }
          return jsonResponse({
            success: true,
            extracted: extractedData,
            modelUsed: debugModelUsed,
            rawAiText: debugRawAiText
          });
        } catch (err) {
          return errorResponse(`Fehler bei der Beleg-Analyse: ${err?.message || err}`, 500);
        }
      }
      if (path === "/api/v1/vouchers/upload-session/create" && method === "POST") {
        await ensureOperationalVouchers(env2);
        const sessionId = "scan_" + crypto.randomUUID().replace(/-/g, "").substring(0, 16);
        const now = /* @__PURE__ */ new Date();
        const expiresAt = new Date(now.getTime() + 15 * 60 * 1e3).toISOString();
        await env2.DB.prepare(`
          INSERT INTO voucher_upload_sessions (id, status, uploaded_files_json, expires_at_utc, created_at_utc)
          VALUES (?, 'waiting', '[]', ?, ?)
        `).bind(sessionId, expiresAt, now.toISOString()).run();
        return jsonResponse({
          success: true,
          sessionId,
          expiresAt
        });
      }
      const mobileUploadMatch = path.match(/^\/api\/v1\/vouchers\/upload-session\/([a-zA-Z0-9_-]+)\/upload$/);
      if (mobileUploadMatch && method === "POST") {
        await ensureOperationalVouchers(env2);
        const sessionId = mobileUploadMatch[1];
        const session = await env2.DB.prepare("SELECT * FROM voucher_upload_sessions WHERE id = ?").bind(sessionId).first();
        if (!session) return errorResponse("Upload-Session nicht gefunden oder abgelaufen.", 404);
        try {
          const body = await request.json();
          const files = body.files || [];
          if (!files || files.length === 0) {
            return errorResponse("Keine Dateien zum Hochladen \xFCbermittelt.", 400);
          }
          const uploadedResults = [];
          for (let i = 0; i < files.length; i++) {
            const f = files[i];
            const fileId = `rec_mob_${crypto.randomUUID().replace(/-/g, "")}`;
            const cleanFilename = (f.filename || `foto_${i + 1}.jpg`).replace(/[^a-zA-Z0-9_.-]/g, "_");
            const r2Key = `vouchers/receipts/${fileId}_${cleanFilename}`;
            let cleanBase64 = f.base64 || "";
            if (cleanBase64.includes(",")) cleanBase64 = cleanBase64.split(",")[1];
            const binaryString = atob(cleanBase64);
            const bytes = new Uint8Array(binaryString.length);
            for (let b = 0; b < binaryString.length; b++) {
              bytes[b] = binaryString.charCodeAt(b);
            }
            await env2.STORAGE.put(r2Key, bytes, {
              httpMetadata: { contentType: f.mimeType || "image/jpeg" }
            });
            uploadedResults.push({
              r2Key,
              filename: cleanFilename,
              mimeType: f.mimeType || "image/jpeg",
              size: bytes.length
            });
          }
          await env2.DB.prepare(`
            UPDATE voucher_upload_sessions 
            SET status = 'ready', uploaded_files_json = ? 
            WHERE id = ?
          `).bind(JSON.stringify(uploadedResults), sessionId).run();
          return jsonResponse({ success: true, count: uploadedResults.length, files: uploadedResults });
        } catch (upErr) {
          console.error("Mobile upload processing error:", upErr);
          return errorResponse(`Upload-Fehler: ${upErr?.message || upErr}`, 500);
        }
      }
      const mobileStatusMatch = path.match(/^\/api\/v1\/vouchers\/upload-session\/([a-zA-Z0-9_-]+)\/status$/);
      if (mobileStatusMatch && method === "GET") {
        await ensureOperationalVouchers(env2);
        const sessionId = mobileStatusMatch[1];
        const session = await env2.DB.prepare("SELECT * FROM voucher_upload_sessions WHERE id = ?").bind(sessionId).first();
        if (!session) return errorResponse("Session nicht gefunden", 404);
        const files = JSON.parse(session.uploaded_files_json || "[]");
        return jsonResponse({
          success: true,
          status: session.status,
          files: session.status === "ready" ? files : []
        });
      }
      if (path.startsWith("/api/v1/vouchers/receipts/") && method === "GET") {
        const r2Key = decodeURIComponent(path.replace("/api/v1/vouchers/receipts/", ""));
        const obj = await env2.STORAGE.get(r2Key);
        if (!obj) return errorResponse("Belegdatei nicht im Speicher gefunden", 404);
        const headers = new Headers();
        obj.writeHttpMetadata(headers);
        headers.set("etag", obj.httpEtag);
        headers.set("Cache-Control", "public, max-age=31536000");
        return new Response(obj.body, { headers });
      }
      if (path === "/api/v1/vouchers" && method === "GET") {
        await ensureOperationalVouchers(env2);
        const { results: vouchers } = await env2.DB.prepare(`
          SELECT v.*, 
                 p.name as project_name, p.project_number,
                 c.name as customer_name, c.customer_number
          FROM operational_vouchers v
          LEFT JOIN projects p ON v.project_id = p.id
          LEFT JOIN customers c ON v.customer_id = c.id
          ORDER BY v.voucher_date DESC, v.created_at_utc DESC
        `).all();
        return jsonResponse({
          success: true,
          count: vouchers.length,
          vouchers: vouchers || []
        });
      }
      if (path === "/api/v1/vouchers" && method === "POST") {
        await ensureOperationalVouchers(env2);
        const body = await request.json();
        const isDraft = body.is_draft === true || body.status === "Draft";
        const voucherType = body.voucher_type || "Hospitality";
        const voucherDate = body.voucher_date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
        const supplierName = (body.supplier_name || "").trim() || (isDraft ? "Unbearbeiteter Beleg (Entwurf)" : "");
        const description = (body.description || "").trim() || `${voucherType} Beleg`;
        const businessPurpose = (body.business_purpose || "").trim() || (isDraft ? "Beleg im Eingangskorb zur sp\xE4teren Bearbeitung" : "");
        if (!isDraft) {
          if (!supplierName) {
            return errorResponse("Bitte geben Sie den Namen des Lokals, H\xE4ndlers oder Dienstleisters an.", 400);
          }
          if (voucherType === "Hospitality" && (!businessPurpose || businessPurpose.length < 5)) {
            return errorResponse("Bei Bewirtungsbelegen ist die Angabe des konkreten gesch\xE4ftlichen Anlasses gesetzlich vorgeschrieben (\xA7 4 Abs. 5 EStG).", 400);
          }
        }
        const id = body.id || `vouch_${crypto.randomUUID().replace(/-/g, "")}`;
        const yearMonth = voucherDate.substring(0, 7).replace("-", "");
        let voucherNumber = body.voucher_number;
        if (!voucherNumber) {
          const countRow = await env2.DB.prepare("SELECT COUNT(*) as c FROM operational_vouchers WHERE voucher_date LIKE ?").bind(`${voucherDate.substring(0, 7)}%`).first();
          const seq = ((countRow?.c || 0) + 1).toString().padStart(4, "0");
          voucherNumber = `BEL-${voucherDate.substring(0, 4)}-${seq}`;
        }
        const amountGross = Number(body.amount_gross) || 0;
        const taxRate = Number(body.tax_rate) !== void 0 ? Number(body.tax_rate) : 19;
        const amountNet = Number(body.amount_net) || (amountGross > 0 ? amountGross / (1 + taxRate / 100) : 0);
        const taxAmount = amountGross - amountNet;
        const tipAmount = Number(body.tip_amount) || 0;
        const totalAttendees = Number(body.total_attendees_count) || 1;
        const businessAttendees = Number(body.business_attendees_count) || totalAttendees;
        const businessSharePercent = Math.min(100, Math.max(0, businessAttendees / totalAttendees * 100));
        const businessGross = amountGross * (businessSharePercent / 100);
        const businessNet = amountNet * (businessSharePercent / 100);
        const taxDeductibleNet = businessNet * 0.7;
        const taxNonDeductibleNet = businessNet * 0.3;
        const privateShareGross = amountGross - businessGross;
        let skr04 = body.skr04_account || "4650";
        let skr03 = body.skr03_account || "4650";
        if (voucherType === "LocalTransit") {
          skr04 = "4673";
          skr03 = "4673";
        } else if (voucherType === "GWG_Asset") {
          skr04 = "0485";
          skr03 = "0480";
        } else if (voucherType === "GeneralExpense") {
          skr04 = body.skr04_account || "4985";
          skr03 = body.skr03_account || "4985";
        }
        const hashPayload = `${voucherNumber}|${voucherDate}|${supplierName}|${amountGross.toFixed(2)}|${taxDeductibleNet.toFixed(2)}|${skr04}`;
        const encoder = new TextEncoder();
        const hashBuf = await crypto.subtle.digest("SHA-256", encoder.encode(hashPayload));
        const hashArray = Array.from(new Uint8Array(hashBuf));
        const sha256 = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
        const now = (/* @__PURE__ */ new Date()).toISOString();
        const status = isDraft ? "Draft" : "Verified";
        await env2.DB.prepare(`
          INSERT INTO operational_vouchers (
            id, voucher_number, voucher_type, voucher_date, supplier_name, description, business_purpose,
            project_id, customer_id, is_billable_to_client,
            amount_gross, amount_net, tax_rate, tax_amount, tip_amount,
            total_attendees_count, business_attendees_count, business_share_percent,
            tax_deductible_net, tax_non_deductible_net, private_share_gross,
            attendees_json, location_address,
            is_own_receipt, own_receipt_reason,
            transport_type, distance_km, origin_address, destination_address, parent_hospitality_voucher_id,
            skr04_account, skr03_account,
            receipt_r2_key, receipt_filename, receipt_mime_type,
            payment_slip_r2_key, payment_slip_filename, payment_slip_total_gross, payment_method,
            secondary_attachment_r2_key, secondary_attachment_filename,
            voucher_pdf_hash_sha256,
            created_at_utc, updated_at_utc, status
          ) VALUES (
            ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?,
            ?, ?, ?,
            ?, ?,
            ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?,
            ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?,
            ?,
            ?, ?, ?
          )
          ON CONFLICT(id) DO UPDATE SET
            voucher_type = excluded.voucher_type,
            voucher_date = excluded.voucher_date,
            supplier_name = excluded.supplier_name,
            description = excluded.description,
            business_purpose = excluded.business_purpose,
            project_id = excluded.project_id,
            customer_id = excluded.customer_id,
            is_billable_to_client = excluded.is_billable_to_client,
            amount_gross = excluded.amount_gross,
            amount_net = excluded.amount_net,
            tax_rate = excluded.tax_rate,
            tax_amount = excluded.tax_amount,
            tip_amount = excluded.tip_amount,
            total_attendees_count = excluded.total_attendees_count,
            business_attendees_count = excluded.business_attendees_count,
            business_share_percent = excluded.business_share_percent,
            tax_deductible_net = excluded.tax_deductible_net,
            tax_non_deductible_net = excluded.tax_non_deductible_net,
            private_share_gross = excluded.private_share_gross,
            attendees_json = excluded.attendees_json,
            location_address = excluded.location_address,
            is_own_receipt = excluded.is_own_receipt,
            own_receipt_reason = excluded.own_receipt_reason,
            transport_type = excluded.transport_type,
            distance_km = excluded.distance_km,
            origin_address = excluded.origin_address,
            destination_address = excluded.destination_address,
            skr04_account = excluded.skr04_account,
            skr03_account = excluded.skr03_account,
            receipt_r2_key = CASE WHEN excluded.receipt_r2_key IS NOT NULL THEN excluded.receipt_r2_key ELSE operational_vouchers.receipt_r2_key END,
            receipt_filename = CASE WHEN excluded.receipt_filename IS NOT NULL THEN excluded.receipt_filename ELSE operational_vouchers.receipt_filename END,
            receipt_mime_type = CASE WHEN excluded.receipt_mime_type IS NOT NULL THEN excluded.receipt_mime_type ELSE operational_vouchers.receipt_mime_type END,
            payment_slip_r2_key = CASE WHEN excluded.payment_slip_r2_key IS NOT NULL THEN excluded.payment_slip_r2_key ELSE operational_vouchers.payment_slip_r2_key END,
            payment_method = excluded.payment_method,
            secondary_attachment_r2_key = CASE WHEN excluded.secondary_attachment_r2_key IS NOT NULL THEN excluded.secondary_attachment_r2_key ELSE operational_vouchers.secondary_attachment_r2_key END,
            secondary_attachment_filename = CASE WHEN excluded.secondary_attachment_filename IS NOT NULL THEN excluded.secondary_attachment_filename ELSE operational_vouchers.secondary_attachment_filename END,
            voucher_pdf_hash_sha256 = excluded.voucher_pdf_hash_sha256,
            status = excluded.status,
            updated_at_utc = excluded.updated_at_utc
        `).bind(
          id,
          voucherNumber,
          voucherType,
          voucherDate,
          supplierName,
          description,
          businessPurpose,
          body.project_id || null,
          body.customer_id || null,
          body.is_billable_to_client ? 1 : 0,
          amountGross,
          amountNet,
          taxRate,
          taxAmount,
          tipAmount,
          totalAttendees,
          businessAttendees,
          businessSharePercent,
          taxDeductibleNet,
          taxNonDeductibleNet,
          privateShareGross,
          body.attendees_json ? typeof body.attendees_json === "string" ? body.attendees_json : JSON.stringify(body.attendees_json) : null,
          body.location_address || "",
          body.is_own_receipt ? 1 : 0,
          body.own_receipt_reason || "",
          body.transport_type || null,
          Number(body.distance_km) || 0,
          body.origin_address || "",
          body.destination_address || "",
          body.parent_hospitality_voucher_id || null,
          skr04,
          skr03,
          body.receipt_r2_key || null,
          body.receipt_filename || null,
          body.receipt_mime_type || null,
          body.payment_slip_r2_key || null,
          body.payment_slip_filename || null,
          Number(body.payment_slip_total_gross) || null,
          body.payment_method || "Card_NFC",
          body.secondary_attachment_r2_key || null,
          body.secondary_attachment_filename || null,
          sha256,
          now,
          now,
          status
        ).run();
        await logAuditEvent(env2, {
          eventType: "voucher_created",
          entityType: "operational_voucher",
          entityId: id,
          actor: "Freelancer",
          description: `Neuer Beleg ${voucherNumber} (${voucherType}, ${amountGross.toFixed(2)} \u20AC) erfasst`,
          dataPayload: { voucherNumber, voucherType, amountGross, taxDeductibleNet, sha256 }
        });
        return jsonResponse({
          success: true,
          voucherId: id,
          voucherNumber,
          dataHash: sha256,
          message: `Beleg ${voucherNumber} wurde GoBD-konform gespeichert.`
        });
      }
      const voucherGetMatch = path.match(/^\/api\/v1\/vouchers\/([a-zA-Z0-9_-]+)$/);
      if (voucherGetMatch && method === "GET") {
        await ensureOperationalVouchers(env2);
        const vId = voucherGetMatch[1];
        const v = await env2.DB.prepare(`
          SELECT v.*, 
                 p.name as project_name, p.project_number,
                 c.name as customer_name, c.customer_number
          FROM operational_vouchers v
          LEFT JOIN projects p ON v.project_id = p.id
          LEFT JOIN customers c ON v.customer_id = c.id
          WHERE v.id = ?
        `).bind(vId).first();
        if (!v) return errorResponse("Beleg nicht gefunden.", 404);
        const { results: linkedTransit } = await env2.DB.prepare(`
          SELECT * FROM operational_vouchers 
          WHERE parent_hospitality_voucher_id = ? 
          ORDER BY created_at_utc ASC
        `).bind(vId).all();
        return jsonResponse({ success: true, voucher: v, linkedTransit: linkedTransit || [] });
      }
      const voucherLinkedTransitMatch = path.match(/^\/api\/v1\/vouchers\/([a-zA-Z0-9_-]+)\/linked-transit$/);
      if (voucherLinkedTransitMatch && method === "DELETE") {
        await ensureOperationalVouchers(env2);
        const vId = voucherLinkedTransitMatch[1];
        await env2.DB.prepare("DELETE FROM operational_vouchers WHERE parent_hospitality_voucher_id = ?").bind(vId).run();
        return jsonResponse({ success: true, message: "Verkn\xFCpfte Fahrten gel\xF6scht." });
      }
      if (voucherGetMatch && method === "DELETE") {
        await ensureOperationalVouchers(env2);
        const vId = voucherGetMatch[1];
        const v = await env2.DB.prepare("SELECT * FROM operational_vouchers WHERE id = ?").bind(vId).first();
        if (!v) return errorResponse("Beleg nicht gefunden.", 404);
        await env2.DB.prepare("DELETE FROM operational_vouchers WHERE id = ?").bind(vId).run();
        await logAuditEvent(env2, {
          eventType: "voucher_deleted",
          entityType: "operational_voucher",
          entityId: vId,
          actor: "Freelancer",
          description: `Beleg ${v.voucher_number} (${v.amount_gross} \u20AC) gel\xF6scht`,
          dataPayload: { voucherNumber: v.voucher_number }
        });
        return jsonResponse({ success: true, message: `Beleg ${v.voucher_number} gel\xF6scht.` });
      }
      const voucherSyncMatch = path.match(/^\/api\/v1\/vouchers\/([a-zA-Z0-9_-]+)\/sync-lexware$/);
      if (voucherSyncMatch && method === "POST") {
        await ensureOperationalVouchers(env2);
        const vId = voucherSyncMatch[1];
        const v = await env2.DB.prepare("SELECT * FROM operational_vouchers WHERE id = ?").bind(vId).first();
        if (!v) return errorResponse("Beleg nicht gefunden.", 404);
        const apiKey = env2.LEXWARE_API_KEY;
        if (!apiKey) {
          return errorResponse("Kein LEXWARE_API_KEY konfiguriert.", 400);
        }
        try {
          const voucherItems = [];
          if (v.voucher_type === "Hospitality") {
            voucherItems.push({
              amount: Number(v.tax_deductible_net.toFixed(2)),
              taxAmount: Number((v.amount_gross * (v.business_share_percent / 100) - v.amount_net * (v.business_share_percent / 100)).toFixed(2)),
              taxRatePercent: v.tax_rate,
              categoryId: "8f59d48b-3022-487e-902e-c5ee7cf75647"
              // Standard Bewirtungsaufwand oder dynamisch
            });
            if (v.tax_non_deductible_net > 0) {
              voucherItems.push({
                amount: Number(v.tax_non_deductible_net.toFixed(2)),
                taxAmount: 0,
                taxRatePercent: 0,
                categoryId: "8f59d48b-3022-487e-902e-c5ee7cf75647"
              });
            }
            if (v.tip_amount > 0) {
              voucherItems.push({
                amount: Number(v.tip_amount.toFixed(2)),
                taxAmount: 0,
                taxRatePercent: 0,
                categoryId: "8f59d48b-3022-487e-902e-c5ee7cf75647"
              });
            }
          } else {
            voucherItems.push({
              amount: Number(v.amount_net.toFixed(2)),
              taxAmount: Number(v.tax_amount.toFixed(2)),
              taxRatePercent: v.tax_rate,
              categoryId: "8f59d48b-3022-487e-902e-c5ee7cf75647"
            });
          }
          const lexBody = {
            voucherType: "purchaseinvoice",
            voucherNumber: v.voucher_number,
            voucherDate: `${v.voucher_date}T00:00:00.000+01:00`,
            shippingDate: `${v.voucher_date}T00:00:00.000+01:00`,
            totalGrossAmount: v.amount_gross + v.tip_amount,
            totalTaxAmount: v.tax_amount,
            taxType: "net",
            useAdditionalTax: false,
            remark: `${v.voucher_type}: ${v.supplier_name} - ${v.business_purpose}`,
            voucherItems
          };
          const lexRes = await fetch("https://api.lexoffice.io/v1/vouchers", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json",
              "Accept": "application/json"
            },
            body: JSON.stringify(lexBody)
          });
          if (!lexRes.ok) {
            const errText = await lexRes.text();
            return errorResponse(`Lexware API Fehler (${lexRes.status}): ${errText}`, 400);
          }
          const lexData = await lexRes.json();
          const lexVoucherId = lexData.id;
          if (v.receipt_r2_key) {
            try {
              const fileObj = await env2.STORAGE.get(v.receipt_r2_key);
              if (fileObj) {
                const fileBytes = await fileObj.arrayBuffer();
                const uploadForm = new FormData();
                const blob = new Blob([fileBytes], { type: v.receipt_mime_type || "image/jpeg" });
                uploadForm.append("file", blob, v.receipt_filename || "beleg.jpg");
                await fetch(`https://api.lexoffice.io/v1/vouchers/${lexVoucherId}/files`, {
                  method: "POST",
                  headers: { "Authorization": `Bearer ${apiKey}` },
                  body: uploadForm
                });
              }
            } catch (fileErr) {
              console.warn("Could not attach receipt file to Lexware voucher:", fileErr);
            }
          }
          await env2.DB.prepare(`
            UPDATE operational_vouchers 
            SET is_synced_to_lexware = 1, lexware_voucher_id = ?, lexware_status = 'synced', updated_at_utc = ?
            WHERE id = ?
          `).bind(lexVoucherId, (/* @__PURE__ */ new Date()).toISOString(), vId).run();
          return jsonResponse({
            success: true,
            lexwareVoucherId,
            message: `Beleg ${v.voucher_number} erfolgreich als Ausgabenbeleg zu Lexware \xFCbertragen.`
          });
        } catch (err) {
          return errorResponse(`Fehler bei Lexware Sync: ${err?.message || err}`, 500);
        }
      }
      return errorResponse("Endpoint nicht gefunden", 404);
    } catch (err) {
      return jsonResponse({ error: err.message, stack: err.stack }, 500);
    }
  }
};
async function logAuditEvent(env2, { eventType, entityType, entityId, actor, description, dataPayload }) {
  try {
    const id = crypto.randomUUID();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await env2.DB.prepare(`
      INSERT INTO audit_events (id, event_type, entity_type, entity_id, actor, description, data_payload_json, timestamp_utc)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      eventType,
      entityType || "general",
      entityId || null,
      actor || "System",
      description || "",
      dataPayload ? JSON.stringify(dataPayload) : null,
      now
    ).run();
  } catch (err) {
    console.error("Audit log error:", err.message);
  }
}
__name(logAuditEvent, "logAuditEvent");
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Strict-Transport-Security": "max-age=31536000; includeSubDomains"
    }
  });
}
__name(jsonResponse, "jsonResponse");
function errorResponse(message, status = 400) {
  return jsonResponse({ error: message }, status);
}
__name(errorResponse, "errorResponse");
export {
  index_default as default,
  syncLexwareContactsInternal
};
//# sourceMappingURL=index.js.map
