import { Permissions } from '../constants';


export type PermissionChecks = Array<number | string> | number | string;

export function checkPermissions(
  permissions: number,
  check: PermissionChecks,
): boolean {
  if (typeof(permissions) !== 'number') {
    throw new Error('Permissions has to be an integer');
  }

  switch (typeof(check)) {
    case 'number': {
      return (permissions & check) == permissions;
    };
    case 'object': {
      if (Array.isArray(check)) {
        return check.every((value) => checkPermissions(permissions, value));
      }
    }; break;
    case 'string': {
      check = check.toUpperCase();
      if (check in Permissions) {
        return checkPermissions(permissions, (<number> (<any> Permissions)[check]));
      } else {
        throw new Error(`Unknown Permission: ${check}`);
      }
    };
  }

  throw new Error('Only a string, integer, or an array of strings/integers are allowed to check with.');
};
