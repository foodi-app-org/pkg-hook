export const getCardType = (cardNum: string) => {
  let payCardType = ''

  if (cardNum.startsWith('4')) {
    payCardType = 'VISA'
  } else if (cardNum.startsWith('5')) {
    payCardType = 'MASTERCARD'
  } else {
    const regexMap = [
      { regEx: /^4[0-9]{5}/gi, cardType: 'VISA' },
      { regEx: /^5[1-5][0-9]{4}/gi, cardType: 'MASTERCARD' },
      { regEx: /^(5[06-8]\d{4}|6\d{5})/gi, cardType: 'MAESTRO' }
    ]

    for (const { regEx, cardType } of regexMap) {
      if (cardNum.match(regEx)) {
        payCardType = cardType
        break
      }
    }
  }

  return payCardType
}
