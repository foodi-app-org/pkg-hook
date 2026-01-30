/**
 * Validates and filters modules based on the "read" permission.
 * If a module's view does not have "read" permission in the permissions object, the module is removed.
 */
type PermissionMap = Record<string, string[]>

interface SubModule {
  view: string
  [key: string]: any
}

interface Module {
  view: string
  subModules?: SubModule[]
  [key: string]: any
}

export const validateModules = (
  modules: Module[] = [],
  permissions: PermissionMap = {}
): Module[] => {
  if (!Array.isArray(modules) || modules.length <= 0) return []
  return modules
    .map((module) => {
      // Check if the main module's view has "read" permission
      const hasReadPermission = permissions[module.view]?.includes('read')

      // Validate and filter subModules if they exist
      const validSubModules =
        module.subModules?.filter((subModule: SubModule) =>
          permissions[subModule.view]?.includes('read')
        ) || []

      // If the module or its subModules don't have read permission, exclude it
      if (!hasReadPermission && validSubModules.length === 0) {
        return null
      }

      // Return the module with its valid subModules
      return { ...module, subModules: validSubModules }
    })
    .filter(Boolean) as Module[] // Remove null values
}
