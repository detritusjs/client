import { RequestTypes } from 'detritus-client-rest';

import { ShardClient } from '../client';
import { BaseCollection } from '../collections/basecollection';
import { BaseSet } from '../collections/baseset';
import { DiscordKeys, Permissions, PERMISSIONS_ALL } from '../constants';
import { PermissionTools } from '../utils';

import { BaseStructureData } from './basestructure';

import {
  ChannelGuildBase,
  ChannelGuildVoice,
} from './channel';
import { Guild } from './guild';
import { Overwrite } from './overwrite';
import { Role } from './role';
import { User, UserMixin } from './user';
import { VoiceState } from './voicestate';


const keysMember = new BaseSet<string>([
  DiscordKeys.DEAF,
  DiscordKeys.GUILD_ID,
  DiscordKeys.HOISTED_ROLE,
  DiscordKeys.JOINED_AT,
  DiscordKeys.MUTE,
  DiscordKeys.NICK,
  DiscordKeys.PENDING,
  DiscordKeys.PREMIUM_SINCE,
  DiscordKeys.ROLES,
  DiscordKeys.USER,
]);

const keysMergeMember = new BaseSet<string>([
  DiscordKeys.GUILD_ID,
]);

/**
 * Guild Member Structure
 * @category Structure
 */
export class Member extends UserMixin {
  readonly _keys = keysMember;
  readonly _keysMerge = keysMergeMember;
  _roles?: Array<string>;

  deaf: boolean = false;
  guildId: string = '';
  hoistedRoleId: null | string = null;
  joinedAtUnix: number = 0;
  left: boolean = false;
  mute: boolean = false;
  nick: null | string = null;
  pending: boolean = false;
  premiumSinceUnix: number = 0;
  user!: User;

  constructor(
    client: ShardClient,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(client, undefined, isClone);
    this.merge(data);
    Object.defineProperty(this, '_roles', {enumerable: false, writable: true});
  }

  get canAdministrator(): boolean {
    return this.can([Permissions.ADMINISTRATOR]);
  }

  get canBanMembers(): boolean {
    return this.can([Permissions.BAN_MEMBERS]);
  }

  get canChangeNickname(): boolean {
    return this.can([Permissions.CHANGE_NICKNAME]);
  }

  get canChangeNicknames(): boolean {
    return this.can([Permissions.CHANGE_NICKNAMES]);
  }

  get canCreateInstantInvite(): boolean {
    return this.can([Permissions.CREATE_INSTANT_INVITE]);
  }

  get canKickMembers(): boolean {
    return this.can([Permissions.KICK_MEMBERS]);
  }

  get canManageChannels(): boolean {
    return this.can([Permissions.MANAGE_CHANNELS]);
  }

  get canManageEmojis(): boolean {
    return this.can([Permissions.MANAGE_EMOJIS]);
  }

  get canManageGuild(): boolean {
    return this.can([Permissions.MANAGE_GUILD]);
  }

  get canManageMessages(): boolean {
    return this.can([Permissions.MANAGE_MESSAGES]);
  }

  get canManageRoles(): boolean {
    return this.can([Permissions.MANAGE_ROLES]);
  }

  get canManageWebhooks(): boolean {
    return this.can([Permissions.MANAGE_WEBHOOKS]);
  }

  get canViewAuditLogs(): boolean {
    return this.can([Permissions.VIEW_AUDIT_LOG]);
  }

  get color(): number {
    const role = this.colorRole;
    return (role) ? role.color : 0;
  }

  get colorRole(): null | Role {
    let highestRole: null | Role = null;
    for (let [roleId, role] of this.roles) {
      if (role && role.color) {
        if (highestRole) {
          if (highestRole.position < role.position) {
            highestRole = role;
          }
        } else {
          highestRole = role;
        }
      }
    }
    return highestRole;
  }

  get guild(): Guild | null {
    return this.client.guilds.get(this.guildId) || null;
  }

  get highestRole(): null | Role {
    let highestRole: null | Role = null;
    for (let [roleId, role] of this.roles) {
      if (role) {
        if (highestRole) {
          if (highestRole.position < role.position) {
            highestRole = role;
          }
        } else {
          highestRole = role;
        }
      }
    }
    return highestRole;
  }

  get hoistedRole(): null | Role {
    if (this.hoistedRoleId) {
      return this.roles.get(this.hoistedRoleId) || null;
    }
    return null;
  }

  get isBoosting(): boolean {
    return !!this.premiumSinceUnix;
  }

  get isOffline(): boolean {
    const presence = this.presence;
    if (presence) {
      return presence.isOffline;
    }
    return true;
  }

  get isOwner(): boolean {
    const guild = this.guild;
    if (guild) {
      return guild.isOwner(this.id);
    }
    return false;
  }

  get isPartial(): boolean {
    return !!this.joinedAtUnix;
  }

  get joinedAt(): Date | null {
    if (this.joinedAtUnix) {
      return new Date(this.joinedAtUnix);
    }
    return null;
  }

  get mention(): string {
    return (this.nick) ? `<@!${this.id}>` : this.user.mention;
  }

  get name(): string {
    return this.nick || this.username;
  }

  get names(): Array<string> {
    if (this.nick) {
      return [this.nick, this.username];
    }
    return [this.username];
  }

  get permissions(): bigint {
    if (this.isOwner) {
      return PERMISSIONS_ALL;
    }
    return this.roles.reduce((total: bigint, role: null | Role) => {
      if (role) {
        return total | role.permissions;
      }
      return total;
    }, Permissions.NONE);
  }

  get premiumSince(): Date | null {
    if (this.premiumSinceUnix) {
      return new Date(this.premiumSinceUnix);
    }
    return null;
  }

  get roles(): BaseCollection<string, null | Role> {
    const collection = new BaseCollection<string, null | Role>();

    const guild = this.guild;
    collection.set(this.guildId, (guild) ? guild.defaultRole : null);
    if (this._roles) {
      for (let roleId of this._roles) {
        if (guild) {
          collection.set(roleId, guild.roles.get(roleId) || null);
        } else {
          collection.set(roleId, null);
        }
      }
    }

    return collection;
  }

  get voiceChannel(): ChannelGuildVoice | null {
    const voiceState = this.voiceState;
    if (voiceState) {
      return voiceState.channel;
    }
    return null;
  }

  get voiceState(): null | VoiceState {
    return this.client.voiceStates.get(this.guildId, this.id) || null;
  }

  can(
    permissions: PermissionTools.PermissionChecks,
    options: {ignoreAdministrator?: boolean, ignoreOwner?: boolean} = {},
  ): boolean {
    const guild = this.guild;
    if (guild) {
      return guild.can(permissions, this, options);
    }
    return PermissionTools.checkPermissions(this.permissions, permissions);
  }

  /* just checks who has the higher role, doesn't check permissions */
  canEdit(member: Member): boolean {
    if (this.isOwner) {
      return true;
    }
    if (member.isOwner) {
      return false;
    }
    if (this.id === member.id) {
      return true;
    }
    const us = this.highestRole;
    const them = member.highestRole;
    if (us && them) {
      return them.position < us.position;
    }
    return false;
  }

  permissionsIn(channelId: ChannelGuildBase | string): bigint {
    let channel: ChannelGuildBase;
    if (channelId instanceof ChannelGuildBase) {
      channel = channelId;
    } else {
      if (this.client.channels.has(channelId)) {
        channel = this.client.channels.get(channelId) as ChannelGuildBase;
      } else {
        return Permissions.NONE;
      }
    }

    let total = this.permissions;
    if (channel.permissionOverwrites.has(channel.guildId)) {
      const overwrite = channel.permissionOverwrites.get(channel.guildId) as Overwrite;
      total = (total & ~overwrite.deny) | overwrite.allow;
    }

    let allow = Permissions.NONE, deny = Permissions.NONE;
    for (let [roleId, role] of this.roles) {
      if (roleId === this.guildId) {continue;}
      if (channel.permissionOverwrites.has(roleId)) {
        const overwrite = channel.permissionOverwrites.get(roleId) as Overwrite;
        allow |= overwrite.allow;
        deny |= overwrite.deny;
      }
    }
    total = (total & ~deny) | allow;

    if (channel.permissionOverwrites.has(this.id)) {
      const overwrite = channel.permissionOverwrites.get(this.id) as Overwrite;
      total = (total & ~overwrite.deny) | overwrite.allow;
    }
    return total;
  }

  addRole(roleId: string, options: RequestTypes.AddGuildMemberRole = {}) {
    return this.client.rest.addGuildMemberRole(this.guildId, this.id, roleId, options);
  }

  ban(options: RequestTypes.CreateGuildBan = {}) {
    return this.client.rest.createGuildBan(this.guildId, this.id, options);
  }

  edit(options: RequestTypes.EditGuildMember = {}) {
    return this.client.rest.editGuildMember(this.guildId, this.id, options);
  }

  editNick(nick: string, options: RequestTypes.EditGuildNick = {}) {
    if (this.isMe) {
      return this.client.rest.editGuildNick(this.guildId, nick, options);
    }
    return this.edit({...options, nick});
  }

  move(channelId: null | string, options: RequestTypes.EditGuildMember = {}) {
    return this.edit({...options, channelId});
  }

  remove(options: RequestTypes.RemoveGuildMember = {}) {
    return this.client.rest.removeGuildMember(this.guildId, this.id, options);
  }

  removeBan(options: RequestTypes.RemoveGuildBan = {}) {
    return this.client.rest.removeGuildBan(this.guildId, this.id, options);
  }

  removeRole(roleId: string, options: RequestTypes.RemoveGuildMemberRole = {}) {
    return this.client.rest.removeGuildMemberRole(this.guildId, this.id, roleId, options);
  }

  setDeaf(deaf: boolean, options: RequestTypes.EditGuildMember = {}) {
    return this.edit({...options, deaf});
  }

  setMute(mute: boolean, options: RequestTypes.EditGuildMember = {}) {
    return this.edit({...options, mute});
  }

  difference(key: string, value: any): [boolean, any] {
    let differences: any;
    switch (key) {
      case DiscordKeys.HOISTED_ROLE: {
        if (this.hasDifference(key, value)) {
          differences = this.hoistedRoleId;
        }
      }; break;
      case DiscordKeys.ROLES: {
        if (this.hasDifference(key, value)) {
          differences = this._roles || [];
        }
      }; break;
      default: {
        return super.difference(key, value);
      };
    }
    if (differences !== undefined) {
      return [true, differences];
    }
    return [false, null];
  }

  hasDifference(key: string, value: any): boolean {
    switch (key) {
      case DiscordKeys.HOISTED_ROLE: {
        return (this.hoistedRoleId !== value);
      };
      case DiscordKeys.ROLES: {
        const old = this._roles;
        if (old) {
          return (old.length !== value.length) || !value.every((roleId: string) => old.includes(roleId));
        } else {
          return value.length !== 0;
        }
      };
    }
    return super.hasDifference(key, value);
  }

  mergeValue(key: string, value: any): void {
    if (value !== undefined) {
      switch (key) {
        case DiscordKeys.HOISTED_ROLE: {
          this.hoistedRoleId = value;
        }; return;
        case DiscordKeys.JOINED_AT: {
          this.joinedAtUnix = (value) ? (new Date(value).getTime()) : 0;
        }; return;
        case DiscordKeys.PREMIUM_SINCE: {
          this.premiumSinceUnix = (value) ? (new Date(value).getTime()) : 0;
        }; return;
        case DiscordKeys.ROLES: {
          if (value.length) {
            this._roles = value;
          } else {
            this._roles = undefined;
          }
        }; return;
        case DiscordKeys.USER: {
          let user: User;
          if (this.isClone) {
            user = new User(this.client, value, this.isClone);
          } else {
            if (this.client.users.has(value.id)) {
              user = this.client.users.get(value.id) as User;
              user.merge(value);
            } else {
              user = new User(this.client, value);
              this.client.users.insert(user);
            }
          }
          value = user;
        }; break;
      }
      return super.mergeValue(key, value);
    }
  }

  toJSON(withRoles?: boolean) {
    const data = super.toJSON() as any;
    if (!withRoles) {
      if (DiscordKeys.HOISTED_ROLE in data) {
        data[DiscordKeys.HOISTED_ROLE] = this.hoistedRoleId;
      }
      if (DiscordKeys.ROLES in data) {
        data[DiscordKeys.ROLES] = Array.from(data.roles.keys());
      }
    }
    return data;
  }
}
