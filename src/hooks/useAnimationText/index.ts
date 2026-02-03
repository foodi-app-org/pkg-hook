import { useEffect, useRef, useState } from 'react'

const fullText =
  ' this is full text it\'ll be animated again! Writing a really huge sentence here so that I can see the animation happen. I know it\'s fast but that\'s how it goes.'

export const useAnimatedText = (textMessage: string) => {
  const fullTextRef = useRef(textMessage)
  const [text, setText] = useState('')
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (index < fullText.length) {
      globalThis.requestAnimationFrame(() => {
         
                setText(text => text + fullTextRef.current[index]);
        setIndex(() => {return index + 1})
      })
    }
  }, [index])
  useEffect(() => {
    fullTextRef.current = textMessage
  }, [textMessage])

  return text
}

