const Permissions = require('./constants').Discord.Permissions;


module.exports = {
	can(permissions, check) {
		if (typeof(permissions) !== 'number') {throw new Error('Permissions has to be an integer');}

		switch (typeof(check)) {
			case 'object': {
				if (Array.isArray(check)) {
					return check.every(this.can.bind(this, permissions));
				}
			}; break;
			case 'string': return this.can(permissions, Permissions[check.toUpperCase()]);
			case 'number': return !!(permissions & check);
		}

		throw new Error('Only a string, integer, or an array of strings/integers are allowed to check with.');
	}
};