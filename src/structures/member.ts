import { RequestTypes } from 'detritus-client-rest';

import { ShardClient } from '../client';
import { BaseCollection, emptyBaseCollection } from '../collections/basecollection';
import { BaseSet } from '../collections/baseset';
import { DiscordKeys, Permissions } from '../constants';
import { PermissionTools } from '../utils';

import { BaseStructureData } from './basestructure';

import {
  ChannelGuildBase,
  ChannelGuildVoice,
} from './channel';
import { Guild } from './guild';
import { Overwrite } from './overwrite';
import { Presence } from './presence';
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
  _roles?: BaseCollection<string, null | Role>;

  deaf: boolean = false;
  guildId: string = '';
  hoistedRole?: string;
  joinedAt!: Date;
  mute: boolean = false;
  nick: null | string = null;
  premiumSince: null | Date = null;
  user!: User;

  constructor(client: ShardClient, data: BaseStructureData) {
    super(client);
    this.merge(data);
    Object.defineProperty(this, '_roles', {enumerable: false, writable: true});
  }

  get guild(): Guild | null {
    return this.client.guilds.get(this.guildId) || null;
  }

  get isBoosting(): boolean {
    return !!this.premiumSince;
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

  get joinedAtUnix(): number {
    return this.joinedAt.getTime();
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

  get permissions(): number {
    return this.roles.reduce((total: number, role: null | Role) => {
      if (role) {
        return total | role.permissions;
      }
      return total;
    }, Permissions.NONE);
  }

  get roles(): BaseCollection<string, null | Role> {
    if (this._roles) {
      return this._roles;
    }
    const collection = new BaseCollection<string, null | Role>();
    const guild = this.guild;
    collection.set(this.guildId, (guild) ? guild.defaultRole : null);
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
    options: {
      ignoreAdministrator?: boolean,
      ignoreOwner?: boolean,
    } = {},
  ): boolean {
    const guild = this.guild;
    if (guild) {
      return guild.can(permissions, this, options);
    }
    return PermissionTools.checkPermissions(this.permissions, permissions);
  }

  permissionsFor(channelId: ChannelGuildBase | string): number {
    let channel: ChannelGuildBase;
    if (channelId instanceof ChannelGuildBase) {
      channel = channelId;
    } else {
      if (this.client.channels.has(channelId)) {
        channel = <ChannelGuildBase> this.client.channels.get(channelId);
      } else {
        return Permissions.NONE;
      }
    }

    let allow = 0;
    let deny = 0;
    if (channel.permissionOverwrites.has(channel.guildId)) {
      const overwrite = <Overwrite> channel.permissionOverwrites.get(channel.guildId);
      allow |= overwrite.allow;
      deny |= overwrite.deny;
    }

    for (let [roleId, role] of this.roles) {
      if (channel.permissionOverwrites.has(roleId)) {
        const overwrite = <Overwrite> channel.permissionOverwrites.get(roleId);
        allow |= overwrite.allow;
        deny |= overwrite.deny;
      }
    }

    if (channel.permissionOverwrites.has(this.id)) {
      const overwrite = <Overwrite> channel.permissionOverwrites.get(this.id);
      allow |= overwrite.allow;
      deny |= overwrite.deny;
    }

    return (this.permissions & ~deny) | allow;
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
      return this.client.rest.editGuildNick(this.guildId, nick, '@me', options);
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

  mergeValue(key: string, value: any): void {
    if (value !== undefined) {
      switch (key) {
        case DiscordKeys.JOINED_AT: {
          value = new Date(value);
        }; break;
        case DiscordKeys.PREMIUM_SINCE: {
          if (value) {
            value = new Date(value);
          }
        }; break;
        case DiscordKeys.ROLES: {
          if (value.length) {
            if (!this._roles) {
              this._roles = new BaseCollection<string, null | Role>();
            }
            this._roles.clear();
            const guild = this.guild;
            this.roles.set(this.guildId, (guild) ? guild.defaultRole : null);
            for (let roleId of value) {
              if (guild) {
                this.roles.set(roleId, guild.roles.get(roleId) || null);
              } else {
                this.roles.set(roleId, null);
              }
            }
          } else {
            if (this._roles) {
              this._roles.clear();
              this._roles = undefined;
            }
          }
        }; return;
        case DiscordKeys.USER: {
          let user: User;
          if (this.client.users.has(value.id)) {
            user = <User> this.client.users.get(value.id);
            user.merge(value);
          } else {
            user = new User(this.client, value);
            this.client.users.insert(user);
          }
          value = user;
        }; break;
      }
      return super.mergeValue.call(this, key, value);
    }
  }
}
