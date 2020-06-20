#include <stdlib.h>
#include <string.h>
#include <wchar.h>
#include <locale.h>

extern void consoleLog(char* ptr, int length);

int is_locale_initialised = 0;

static void initLocale()
{
    // The locale must be initialised before using
    // multi byte characters.
    is_locale_initialised = 1;
    setlocale(LC_ALL, "");
}

__attribute__((used)) size_t countLetters(char* ptr)
{
    if (is_locale_initialised == 0)
        initLocale();

    size_t letters = 0;
    const char* end = ptr + strlen(ptr);
    mblen(NULL, 0); // reset the conversion state
    while(ptr < end) {
        int next = mblen(ptr, end - ptr);
        if(next == -1) {
            return -1;
        }
        ptr += next;
        ++letters;
    }
    return letters;
}

__attribute__((used)) void sayHelloWorld()
{
    if (is_locale_initialised == 0)
        initLocale();

    const char* s1 = "Hello World";
    size_t len = strlen(s1);
    char* s2 = malloc(len + 1);
    consoleLog(strcpy(s2, s1), (int) len);
}

__attribute__((used)) void sayHelloWorldInMandarin()
{
    if (is_locale_initialised == 0)
        initLocale();

    const wchar_t* wstr = L"你好，世界！";
    mbstate_t state;
    memset(&state, 0, sizeof(state));
    size_t len =  wcsrtombs(NULL, &wstr, 0, &state);
    char* mbstr = malloc(len + 1);
    wcsrtombs(mbstr, &wstr, len + 1, &state);
    consoleLog(mbstr, (int) len);
}
