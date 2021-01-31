import { Permissions } from '../constants';


export type PermissionChecks = Array<bigint | number | string> | bigint | number | string;

export function checkPermissions(
  permissions: bigint | number,
  check: PermissionChecks,
): boolean {
  if (typeof(permissions) !== 'number' && typeof(permissions) !== 'bigint') {
    throw new Error('Permissions has to be an integer');
  }

  permissions = BigInt(permissions);
  switch (typeof(check)) {
    case 'bigint': {
      return (permissions & check) === check;
    };
    case 'number': {
      return checkPermissions(permissions, BigInt(check));
    };
    case 'object': {
      if (Array.isArray(check)) {
        return check.every((value) => checkPermissions(permissions, value));
      }
    }; break;
    case 'string': {
      check = check.toUpperCase();
      if (check in Permissions) {
        return checkPermissions(permissions, ((Permissions as any)[check] as bigint));
      } else {
        throw new Error(`Unknown Permission: ${check}`);
      }
    };
  }

  throw new Error('Only a string, integer, or an array of strings/integers are allowed to check with.');
};
