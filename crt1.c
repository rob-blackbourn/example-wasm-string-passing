extern void __wasm_call_ctors(void);
// extern void __wasm_call_dtors(void);

__attribute__((export_name("_start")))
void _start(void) {
    __wasm_call_ctors();
}
