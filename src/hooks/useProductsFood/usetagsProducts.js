import { useMutation } from "@apollo/client"
import { useState } from "react"
import { REGISTER_TAGS_PRODUCT } from "./queriesStore"

export const useTagsProducts = () => {
    const [registerTag] = useMutation(REGISTER_TAGS_PRODUCT)
    const data = [
      {
        id: 1,
        tag: 'Bebida fría'
      },
      {
        id: 2,
        tag: 'Bebida caliente'
      },
      {
        id: 3,
        tag: 'Bebida alcohólica'
      },
      {
        id: 4,
        tag: 'Bebida sin alcohol'
      }
  ]
    const [tags, setTags] = useState({
      id: '',
      tag: ''
    })

    const handleAddTag = (id, tag) => {
      if (tags.id === id) {
        return setTags({
          id: '',
          tag: ''
        })
      }
      return setTags({
        id,
        tag
      })
    }
    const handleRegister = tag => {
      const {
        pId,
        idUser,
        idStore,
        nameTag
      } = tag || {}

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