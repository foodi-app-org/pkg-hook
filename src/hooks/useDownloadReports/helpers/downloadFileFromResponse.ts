export const downloadFileFromResponse = async (response, fileName) => {
    try {
        if (!response.ok) {
            throw new Error(`Failed to download file: ${response.statusText}`)
        }

        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', fileName)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
    } catch (error) {
        console.error('Error downloading file:', error)
        throw error
    }

}