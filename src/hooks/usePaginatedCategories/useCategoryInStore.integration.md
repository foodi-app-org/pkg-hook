# Integración sin romper useCategoryInStore

No reemplazar `useCategoryInStore` en consumidores antiguos: su `categories` corresponde a `getOneCatStore`, y su `data` corresponde a `catProductsAll`. Son conceptos distintos.

Para una vista paginada usa el hook nuevo:

```tsx
import { usePaginatedCategories } from 'npm-pkg-hook'

const {
  categories, loading, page, pageSize, pagination,
  nextPage, previousPage, goToPage, setPageSize, refetch
} = usePaginatedCategories({ search: term, pState: 1, pageSize: 20 })

// Al mutar una categoría: await refetch() o refetchQueries
// categories es la página actual; no el conjunto completo.
```

Agrega export público en el archivo barril del paquete (`src/hooks/index.ts` o `src/index.ts` según la configuración real):
`export * from './hooks/usePaginatedCategories'` (ajusta la ruta al archivo real).

Ejemplo mutation Apollo:
```tsx
await updateCategory({
  variables: { input },
  refetchQueries: [{ query: GET_PAGINATED_CATEGORY_PRODUCTS, variables: { page, max: pageSize, search, pState, mode: 'offset' } }],
  awaitRefetchQueries: true
})
```

Para paginación cursor se incluye GraphQL `mode` / `cursor` / `nextCursor`, pero este hook está intencionalmente diseñado para páginas offset como los listados administrativos.
