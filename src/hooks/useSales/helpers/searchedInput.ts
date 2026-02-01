export const searchedInput = (words: string, setInputValue: (value: string) => void) => {
    setInputValue(words)
    const n = words.split(' ')
    if (n.length !== 0) {
        if (n[n.length - 1] === '') {
            n.pop()
        }
        return n[n.length - 1]
    }
    return ''
}