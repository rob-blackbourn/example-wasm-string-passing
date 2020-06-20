const setupWasi = require('./setup-wasi')

async function main() {
  // Setup the WASI instance.
  const wasi = await setupWasi('./string-example.wasm')

  // Get the functions exported from the WebAssembly
  const {
    countLetters,
    sayHelloWorld,
    sayHelloWorldInMandarin
  } = wasi.instance.exports

  let buf1 = null
  try {
    const s1 = '犬 means dog'
    // Convert the JavaScript string into a pointer in the WebAssembly
    buf1 = wasi.wasiMemoryManager.convertFromString(s1)
    // The Chinese character will take up more than one byte.
    const l1 = countLetters(buf1.byteOffset)
    console.log(`expected length ${s1.length} got ${l1} byte length was ${buf1.byteLength}`)
  } finally {
    // Free the pointer we created in WebAssembly.
    wasi.wasiMemoryManager.free(buf1)
  }

  // Should log "Hello, World!" to the console
  sayHelloWorld()
  sayHelloWorldInMandarin()
}

main().then(() => console.log('Done'))