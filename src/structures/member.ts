import { Client as ShardClient } from '../client';
import { BaseCollection } from '../collections/basecollection';
import { Permissions } from '../constants';
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


const keys: ReadonlyArray<string> = [
  'deaf',
  'guild_id',
  'hoisted_role',
  'joined_at',
  'mute',
  'nick',
  'premium_since',
  'roles',
  'user',
];

const ignoreKeys: ReadonlyArray<string> = ['roles', 'joined_at', 'user'];


export class Member extends UserMixin {
  _defaultKeys = keys;
  _ignoreKeys = ignoreKeys;
  readonly roles = new BaseCollection<string, null | Role>();

  deaf: boolean = false;
  guildId: string = '';
  hoistedRole: null | string = null;
  joinedAt!: Date;
  mute: boolean = false;
  nick: null | string = null;
  premiumSince: null | Date = null;
  user!: User;

  constructor(client: ShardClient, data: BaseStructureData) {
    super(client);
    this.merge(data);
  }

  get guild(): Guild | null {
    return this.client.guilds.get(this.guildId) || null;
  }

  get isBoosting(): boolean {
    return !!this.premiumSince;
  }

  get isOwner(): boolean {
    const guild = this.guild;
    if (guild !== null) {
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

  get permissions(): number {
    return this.roles.reduce((total: number, role: Role) => {
      if (role !== null) {
        return total + role.permissions;
      }
      return total;
    }, Permissions.NONE);
  }

  get presence(): Presence | undefined {
    return <Presence | undefined> this.client.presences.get(this.guildId, this.id);
  }

  get voiceChannel(): ChannelGuildVoice | null {
    const voiceState = this.voiceState;
    if (voiceState !== undefined) {
      return voiceState.channel;
    }
    return null;
  }

  get voiceState(): undefined | VoiceState {
    return <undefined | VoiceState> this.client.voiceStates.get(this.guildId, this.id);
  }

  can(
    permissions: PermissionTools.PermissionChecks,
    options: {
      ignoreAdministrator?: boolean,
      ignoreOwner?: boolean,
    } = {},
  ): boolean {
    const guild = this.guild;
    if (guild !== null) {
      return guild.can(permissions, this, options);
    }
    return PermissionTools.checkPermissions(this.permissions, permissions);
  }

  permissionsFor(channelId: ChannelGuildBase | string): number {
    let channel: ChannelGuildBase;
    if (typeof(channelId) === 'string') {
      if (this.client.channels.has(channelId)) {
        channel = <ChannelGuildBase> this.client.channels.get(channelId);
      } else {
        return Permissions.NONE;
      }
    } else {
      channel = channelId;
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

  addRole(roleId: string) {
    return this.client.rest.addGuildMemberRole(this.guildId, this.id, roleId);
  }

  ban(...args: any[]) {
    return this.client.rest.createGuildBan(this.guildId, this.id, ...args);
  }

  edit(...args: any[]) {
    return this.client.rest.editGuildMember(this.guildId, this.id, ...args);
  }

  editNick(nick: string) {
    if (this.isMe) {
      return this.client.rest.editGuildNick(this.guildId, nick);
    }
    return this.client.rest.editGuildNick(this.guildId, nick, this.id);
  }

  move(channelId: null | string) {
    return this.edit({channelId});
  }

  remove() {
    return this.client.rest.removeGuildMember(this.guildId, this.id);
  }

  removeBan() {
    return this.client.rest.removeGuildBan(this.guildId, this.id);
  }

  removeRole(roleId: string) {
    return this.client.rest.removeGuildMemberRole(this.guildId, this.id, roleId);
  }

  setDeaf(deaf: boolean) {
    return this.edit({deaf});
  }

  setMute(mute: boolean) {
    return this.edit({mute});
  }

  mergeValue(key: string, value: any): void {
    if (value !== undefined) {
      switch (key) {
        case 'joined_at': {
          value = new Date(value);
        }; break;
        case 'premium_since': {
          if (value !== null) {
            value = new Date(value);
          }
        }; break;
        case 'roles': {
          this.roles.clear();

          const guild = this.guild;
          this.roles.set(this.guildId, (guild) ? guild.defaultRole : null);
          for (let id of value) {
            if (guild !== null && guild.roles.has(id)) {
              this.roles.set(id, <Role> guild.roles.get(id));
            } else {
              this.roles.set(id, null);
            }
          }
        }; return;
        case 'user': {
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
      super.mergeValue.call(this, key, value);
    }
  }
}
