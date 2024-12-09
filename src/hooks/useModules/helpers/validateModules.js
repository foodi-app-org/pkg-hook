/**
 * Validates and filters modules based on the "read" permission.
 * If a module's view does not have "read" permission in the permissions object, the module is removed.
 *
 * @param {Array} modules - List of modules to validate.
 * @param {Object} permissions - Permissions object mapping views to their allowed actions.
 * @returns {Array} - Filtered list of valid modules.
 */
export const validateModules = (modules = [], permissions = {}) => {
  return modules
    .map(module => {
      // Check if the main module's view has "read" permission
      const hasReadPermission = permissions[module.view]?.includes('read')

      // Validate and filter subModules if they exist
      const validSubModules = module.subModules?.filter(subModule =>
        permissions[subModule.view]?.includes('read')
      ) || []

      // If the module or its subModules don't have read permission, exclude it
      if (!hasReadPermission && validSubModules.length === 0) {
        return null
      }

      // Return the module with its valid subModules
      return { ...module, subModules: validSubModules }
    })
    .filter(Boolean) // Remove null values
}
