const WasiMemoryManager = require('./wasi-memory-manager')

// An implementation of WASI which supports the minimum
// required to use multi byte characters.
class Wasi {
  constructor (env) {
    this.env = env
    this.instance = null
    this.wasiMemoryManager = null
  }

  // Initialise the instance from the WebAssembly.
  init = (instance) => {
    this.instance = instance
    this.wasiMemoryManager = new WasiMemoryManager(
      instance.exports.memory,
      instance.exports.malloc,
      instance.exports.free
    )
  }

  static WASI_ESUCCESS = 0

  // Get the environment variables.
  environ_get = (environ, environBuf) => {
    const encoder = new TextEncoder()
    const view = new DataView(this.wasiMemoryManager.memory.buffer)

    Object.entries(this.env).map(
      ([key, value]) => `${key}=${value}`
    ).forEach(envVar => {
      view.setUint32(environ, environBuf, true)
      environ += 4

      const bytes = encoder.encode(envVar)
      const buf = new Uint8Array(this.wasiMemoryManager.memory.buffer, environBuf, bytes.length + 1)
      environBuf += buf.byteLength
    });
    return this.WASI_ESUCCESS;
  }
  
  // Get the size required to store the environment variables.
  environ_sizes_get = (environCount, environBufSize) => {
    const encoder = new TextEncoder()
    const view = new DataView(this.wasiMemoryManager.memory.buffer)

    const envVars = Object.entries(this.env).map(
      ([key, value]) => `${key}=${value}`
    )
    const size = envVars.reduce(
      (acc, envVar) => acc + encoder.encode(envVar).byteLength + 1,
      0
    )
    view.setUint32(environCount, envVars.length, true)
    view.setUint32(environBufSize, size, true)

    return this.WASI_ESUCCESS
  }

  // This gets called on exit to stop the running program.
  // We don't have anything to stop!
  proc_exit = (rval) => {
    return this.WASI_ESUCCESS
  }
}

module.exports = Wasi
