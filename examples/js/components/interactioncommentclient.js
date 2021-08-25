const { Constants, InteractionCommandClient, Utils } = require('../../../lib');
const { InteractionCallbackTypes, MessageFlags, Permissions } = Constants;
const { Components, ComponentActionRow } = Utils;


const guildId = '';
const token = '';
const interactionClient = new InteractionCommandClient(token);

interactionClient.add({
  description: 'ping!',
  name: 'ping',
  guildIds: [guildId],
  run: (context) => {
    const actionRow = new ComponentActionRow();
    actionRow.createButton({
      label: 'ping, but clear buttons',
      run: (componentContext) => componentContext.editOrRespond({content: 'pong from the button!', components: []}),
    });
    actionRow.createButton({
      label: 'ping, but respond',
      run: (componentContext) => {
        return componentContext.respond(InteractionCallbackTypes.CHANNEL_MESSAGE_WITH_SOURCE, {
          content: 'pong!',
          flags: MessageFlags.EPHEMERAL,
        });
      },
    });
    return context.editOrRespond({content: 'pong!', components: [actionRow]});
  },
});

interactionClient.add({
  description: 'Click Test',
  name: 'click-test',
  guildIds: [guildId],
  run: (context) => {
    const components = new Components({
      timeout: 5 * (60 * 1000),
      onTimeout: () => context.editOrRespond({content: 'didnt click for 5 minutes', components: []}),
    });
    {
      const actionRow = components.createActionRow();
      actionRow.createButton({
        label: 'click me',
        run: (componentContext) => componentContext.editOrRespond({content: `clicked by ${componentContext.user}`, components: []}),
      });
    }
    return context.editOrRespond({content: 'click the button', components});
  },
});

interactionClient.add({
  description: 'Give yourself a role',
  name: 'give-role',
  guildIds: [guildId],
  disableDm: true,
  permissions: [Permissions.MANAGE_ROLES],
  permissionsClient: [Permissions.MANAGE_ROLES],
  onPermissionsFail: (context, permissions) => context.editOrRespond('You need manage roles'),
  onPermissionsFailClient: (context, permissions) => context.editOrRespond('The bot needs manage roles'),
  onBefore: (context) => context.me.canEdit(context.member),
  onCancel: (context) => context.editOrRespond('The bot cannot edit you, change some role hierachy or something'),
  run: (context) => {
    const components = new Components({
      timeout: 5 * (60 * 1000),
      onTimeout: () => context.editOrRespond({content: 'Choosing Expired', components: []}),
      run: async (componentContext) => {
        if (componentContext.userId !== context.userId || !context.values) {
          // ignore the press because it wasnt from the initiator
          return componentContext.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
        }

        const roleIds = context.values;
        if (roleIds.length) {
          if (context.me.canEdit(context.member)) {
            for (let roleId of context.values) {
              if (!context.member.roles.has(roleId) && context.me.canEditRole(roleId)) {
                await context.member.addRole(roleId);
              }
            }
            context.editOrRespond(`Ok, gave ${roleIds.length} roles to you`);
          } else {
            context.editOrRespond('Can\'t edit you anymore');
          }
        } else {
          context.editOrRespond('choose some roles!');
        }
      },
    });

    if (context.guild) {
      const rolesWeCanAdd = context.guild.roles.filter((role) => {
        return !context.member.roles.has(roleId) && context.me.canEditRole(role);
      });
      if (rolesWeCanAdd.length) {
        components.createSelectMenu({
          placeholder: 'Choose',
          options: rolesWeCanAdd.slice(0, 25).map((role) => {
            return {
              label: role.name,
              value: role.id,
            };
          }),
        });
      }
    }
    return context.editOrRespond({content: 'choose a role', components, flags: MessageFlags.EPHEMERAL});
  },
});


(async () => {
  const cluster = await interactionClient.run();
  console.log('running');
})();
