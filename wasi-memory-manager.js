// A class to manage the wasm memory
class WasiMemoryManager {
  constructor (memory, malloc, free) {
    this.memory = memory
    this.malloc = malloc
    this.free = free
  }

  // Convert a pointer from the wasm module to JavaScript string.
  convertToString (ptr, length) {
    try {
      // The pointer is a multi byte character array encoded with utf-8.
      const array = new Uint8Array(this.memory.buffer, ptr, length)
      const decoder = new TextDecoder()
      const string = decoder.decode(array)
      return string
    } finally {
      // Free the memory
      this.free(ptr)
    }
  }

  // Convert a JavaScript string to a pointer to multi byte character array
  convertFromString(string) {
    // Encode the string in utf-8.
    const encoder = new TextEncoder()
    const bytes = encoder.encode(string)
    // Copy the string into memory allocated in the WebAssembly
    const ptr = this.malloc(bytes.byteLength)
    const buffer = new Uint8Array(this.memory.buffer, ptr, bytes.byteLength + 1)
    buffer.set(bytes)
    return buffer
  }

}

module.exports = WasiMemoryManager
