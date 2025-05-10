// src/config/content/index.js

import contentEn from './en.json'
import contentEs from './es.json'

const LANG = 'es'

const CONTENT = {
  en: contentEn,
  es: contentEs
}

export const t = (key) => {
  const content = CONTENT[LANG] || {}
  return content[key] || key
}
