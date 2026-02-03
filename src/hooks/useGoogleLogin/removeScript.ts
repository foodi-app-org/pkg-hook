const removeScript = (d: Document, id: string): void => {
  const element = d.getElementById(id)

  if (element) {
    element.remove()
  }
}

export default removeScript
