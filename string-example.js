const fs = require('fs')

class WasiMemoryManager {
  constructor (memory, malloc, free) {
    this.memory = memory
    this.malloc = malloc
    this.free = free
  }

  convertToString (ptr, length) {
    try {
      const array = new Uint8Array(this.memory.buffer, ptr, length)
      const decoder = new TextDecoder()
      const string = decoder.decode(array)
      return string
    } finally {
      this.free(ptr)
    }
  }

  convertFromString(string) {
    const encoder = new TextEncoder()
    const bytes = encoder.encode(string)
    const ptr = this.malloc(bytes.byteLength)
    const buffer = new Uint8Array(this.memory.buffer, ptr, bytes.byteLength + 1)
    buffer.set(bytes)
    return buffer
  }

}

class Wasi {
  constructor (env) {
    this.env = env
    this.wasiMemoryManager = null
  }

  static WASI_ESUCCESS = 0

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

  proc_exit = (rval) => {
    return this.WASI_ESUCCESS
  }
}

async function main() {
  // Read the wasm file.
  const buf = fs.readFileSync('./string-example.wasm')

  // Create an object to manage the memory.
  const wasi = new Wasi({
    "LANG": "en_GB.UTF-8",
    "TERM": "xterm"
  })

  // Instantiate the wasm module.
  const res = await WebAssembly.instantiate(buf, {
    wasi_snapshot_preview1: wasi,
    env: {
      consoleLog: function(ptr, length) {
        const string = wasi.wasiMemoryManager.convertToString(ptr, length)
        console.log(string)
      }
    }
  })

  // Get the memory exports from the wasm instance.
  const {
    memory,
    malloc,
    free
  } = res.instance.exports

  wasi.wasiMemoryManager = new WasiMemoryManager(memory, malloc, free)

  const {
    countLetters,
    sayHelloWorld,
    sayHelloWorldInMandarin
  } = res.instance.exports

  const s1 = '犬 means dog'
  const buf1 = wasi.wasiMemoryManager.convertFromString(s1)
  const l1 = countLetters(buf1.byteOffset)
  console.log(`expected length ${s1.length} got ${l1}`)

  // Should log to console
  sayHelloWorld()
  sayHelloWorldInMandarin()
}

main().then(() => console.log('Done'))