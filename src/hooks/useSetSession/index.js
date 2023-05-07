import { Cookies } from "../../cookies"

export const useSetSession = () => {
    const bookOptionsCookie = {
        RESTAURANT: 'restaurant'
    }
    const handleSession = async (props) => {
        try {
            const { cookie } = props
            for (const element of cookie) {
                const { name, value } = element
                if (value) {
                    await Cookies.set(bookOptionsCookie[name], value)
                }
            }
        } catch (error) {
            throw new Error(error)
        }
    }
    return [handleSession]
}
