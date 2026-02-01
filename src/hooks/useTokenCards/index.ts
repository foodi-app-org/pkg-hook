import { useState } from 'react'

interface TokenCardPostData {
  // Define the expected properties for postData here
  // Example:
  cardNumber: string;
  expMonth: string;
  expYear: string;
  cvc: string;
  [key: string]: unknown; // Remove or adjust as needed for stricter typing
}

export const useTokenCards = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [responseData, setResponseData] = useState(null)

  const handleTokenCardsSubmit = async (postData: TokenCardPostData) => {
    setLoading(true)
    setError(null)
    try {
      const headers = {
        'Content-Type': 'application/json'
      }
      const url = 'http://localhost:3000/api/v1/wompi/transaction/tokens/cards'

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(postData)
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.message || 'Something went wrong')
      }
      setResponseData(responseData)
      return responseData
    } catch (error) {
      if (error instanceof Error) {
        setError(String(error.message))
      } else {
        setError(String(error))
      }
      return {

      }
    } finally {
      setLoading(false)
    }
  }

  return { loading, error, responseData, handleTokenCardsSubmit }
}
