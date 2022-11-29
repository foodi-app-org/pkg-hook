import { useMutation } from "@apollo/client"
import { useState } from "react"
import { RandomCode } from "../../utils"
import { REGISTER_TAGS_PRODUCT } from "./queriesStore"

export const useTagsProducts = () => {
    const [registerTag] = useMutation(REGISTER_TAGS_PRODUCT)
    const data = [
      {
        id: RandomCode(5),
        tag: 'Bebida fria'
      },
      {
        id: RandomCode(5),
        tag: 'Bebida caliente'
      },
      {
        id: RandomCode(5),
        tag: 'Bebida alcohólica'
      },
      {
        id: RandomCode(5),
        tag: 'Bebida sin alcohol'
      }
  ]
    const [tags, setTags] = useState({
      id: '',
      tag: ''
    })
    const handleAddTag = (id, tag) => {
        setTags({
          id,
          tag
        })
    }
    const handleRegister = tag => {
      const { pId, idUser, idStore, nameTag } = tag || {}
      registerTag({
        variables: {
          input: {
            pId,
            idUser,
            nameTag,
            idStore
          }
        }
      }).catch(err => { return console.log({ message: `${err}`, duration: 7000 }) })
    }
    return {
      tags,
      error: false,
      data,
      loading: false,
      handleRegister,
      handleAddTag
    }
  }