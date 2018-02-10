const ApiVersion = {
    GATEWAY: 6,
    REST: 7
};

module.exports = {
    VERSION: '0.0.1',
    ApiVersion: ApiVersion,

    AUDIT_LOG: {
        GUILD_UPDATE:              1,

        CHANNEL_CREATE:           10,
        CHANNEL_UPDATE:           11,
        CHANNEL_DELETE:           12,
        CHANNEL_OVERWRITE_CREATE: 13,
        CHANNEL_OVERWRITE_UPDATE: 14,
        CHANNEL_OVERWRITE_DELETE: 15,
    
        MEMBER_KICK:              20,
        MEMBER_PRUNE:             21,
        MEMBER_BAN_ADD:           22,
        MEMBER_BAN_REMOVE:        23,
        MEMBER_UPDATE:            24,
        MEMBER_ROLE_UPDATE:       25,
    
        ROLE_CREATE:              30,
        ROLE_UPDATE:              31,
        ROLE_DELETE:              32,
    
        INVITE_CREATE:            40,
        INVITE_UPDATE:            41,
        INVITE_DELETE:            42,
    
        WEBHOOK_CREATE:           50,
        WEBHOOK_UPDATE:           51,
        WEBHOOK_DELETE:           52,
    
        EMOJI_CREATE:             60,
        EMOJI_UPDATE:             61,
        EMOJI_DELETE:             62,
    
        MESSAGE_DELETE:           72  
    },

    ChannelTypes: {
        CHANNEL:       -1,
        GUILD_TEXT:     0,
        DM:             1,
        GUILD_VOICE:    2,
        GROUP_DM:       3,
        GUILD_CATEGORY: 4
    },

    MessageTypes: {
        BASE:                  -1,
        DEFAULT:                0,
        RECIPIENT_ADD:          1,
        RECIPIENT_REMOVE:       2,
        CALL:                   3,
        CHANNEL_NAME_CHANGE:    4,
        CHANNEL_ICON_CHANGE:    5,
        CHANNEL_PINNED_MESSAGE: 6,
        GUILD_MEMBER_JOIN:      7
    },

    OpCodes: {
        Gateway: {
            DISPATCH:              0,
            HEARTBEAT:             1,
            IDENTIFY:              2,
            STATUS_UPDATE:         3,
            VOICE_STATE_UPDATE:    4,
            VOICE_SERVER_PING:     5,
            RESUME:                6,
            RECONNECT:             7,
            REQUEST_GUILD_MEMBERS: 8,
            INVALID_SESSION:       9,
            HELLO:                10,
            HEARTBEAT_ACK:        11,
            SYNC_GUILD:           12
        },
        Voice: {
            IDENTIFY:            0,
            SELECT_PROTOCOL:     1,
            READY:               2,
            HEARTBEAT:           3,
            SESSION_DESCRIPTION: 4,
            SPEAKING:            5,
            HEARTBEACK_ACK:      6,
            RESUME:              7,
            HELLO:               8,
            RESUMED:             9,
            CLIENT_DISCONNECT:  10,
        }
    },

    Permissions: {
        CREATE_INSTANT_INVITES: 1,
        KICK_MEMBERS:           1 << 1,
        BAN_MEMBERS:            1 << 2,
        ADMINISTRATOR:          1 << 3,
        MANAGE_CHANNELS:        1 << 4,
        MANAGE_GUILD:           1 << 5,
        ADD_REACTIONS:          1 << 6,
        VIEW_AUDIT_LOGS:        1 << 7,

        READ_MESSAGES:          1 << 10,
        SEND_MESSAGES:          1 << 11,
        SEND_TTS_MESSAGES:      1 << 12,
        MANAGE_MESSAGES:        1 << 13,
        EMBED_LINKS:            1 << 14,
        ATTACH_FILES:           1 << 15,
        READ_MESSAGE_HISTORY:   1 << 16,
        MENTION_EVERYONE:       1 << 17,
        EXTERNAL_EMOJIS:        1 << 18,

        VOICE_CONNECT:          1 << 20,
        VOICE_SPEAK:            1 << 21,
        VOICE_MUTE_MEMBERS:     1 << 22,
        VOICE_DEAFEN_MEMBERS:   1 << 23,
        VOICE_MOVE_MEMBERS:     1 << 24,
        VOICE_USE_VAD:          1 << 25,
        CHANGE_NICKNAME:        1 << 26,
        MANAGE_NICKNAMES:       1 << 27,
        MANAGE_ROLES:           1 << 28,
        MANAGE_WEBHOOKS:        1 << 29,
        MANAGE_EMOJIS:          1 << 30
    },

    Endpoints: {
        ASSETS: {
            URL:                          'https://discordapp.com/assets',
            DM_GROUP:                     '/f046e2247d730629309457e902d5c5b3.svg',
            ICON: (hash, format='jpg') => `/${hash}.${format}`
        },

        CDN: {
            URL:                                             'https://cdn.discordapp.com',
            APP_ICON: (applicationId, hash, format='png') => `/app-icons/${applicationId}/${hash}.${format}`,
            AVATAR:          (userId, hash, format='jpg') => `/avatars/${userId}/${hash}.${format}`,
            DM_ICON:      (channelId, hash, format='jpg') => `/channel-icons/${channelId}/${hash}.${format}`,
            GAME_ICON:       (gameId, hash, format='jpg') => `/game-assets/${gameId}/${hash}.${format}`,
            GUILD_ICON:     (guildId, hash, format='jpg') => `/icons/${guildId}/${hash}.${format}`,
            GUILD_SPLASH:   (guildId, hash, format='jpg') => `/splashes/${guildId}/${hash}.${format}`,
            EMOJI:                (emojiId, format='png') => `/emojis/${emojiId}.${format}`,
            ACTIVITY: {
                SPOTIFY: (hash) => `https://i.scdn.co/image/${hash}`
            }
        },

        REST: {
            URL: 'https://discordapp.com',
            URI: `/api/v${ApiVersion.REST}`,
        
            CHANNELS: {
                ALL:                                                             '/channels',
                ID:                                               (channelId) => `/channels/${channelId}`,
                BULK_DELETE:                                      (channelId) => `/channels/${channelId}/messages/bulk-delete`,
                INVITES:                                          (channelId) => `/channels/${channelId}/invites`,
                MESSAGES:                                         (channelId) => `/channels/${channelId}/messages`,
                MESSAGE:                               (channelId, messageId) => `/channels/${channelId}/messages/${messageId}`,
                MESSAGE_REACTIONS:                     (channelId, messageId) => `/channels/${channelId}/messages/${messageId}/reactions`,
                MESSAGE_REACTION:               (channelId, messageId, emoji) => `/channels/${channelId}/messages/${messageId}/reactions/${emoji}`,
                MESSAGE_REACTION_USER:  (channelId, messageId, emoji, userId) => `/channels/${channelId}/messages/${messageId}/reactions/${emoji}/${userId}`,
                PERMISSIONS:                                      (channelId) => `/channels/${channelId}/permissions`,
                PERMISSION:                          (channelId, overwriteId) => `/channels/${channelId}/permissions/${overwriteId}`,
                PINS:                                             (channelId) => `/channels/${channelId}/pins`,
                PIN:                                   (channelId, messageId) => `/channels/${channelId}/pins/${messageId}`,
                RECIPIENT:                                (channelId, userId) => `/channels/${channelId}/recipients/${userId}`,
                TYPING:                                           (channelId) => `/channels/${channelId}/typing`,
                WEBHOOKS:                                         (channelId) => `/channels/${channelId}/webhooks`
            },
        
            GUILDS: {
                ALL:                                          '/guilds',
                ID:                              (guildId) => `/guilds/${guildId}`,
                AUDIT_LOGS:                      (guildId) => `/guilds/${guildId}/audit-logs`,
                BANS:                            (guildId) => `/guilds/${guildId}/bans`,
                BAN:                     (guildId, userId) => `/guilds/${guildId}/bans/${userId}`,
                CHANNELS:                        (guildId) => `/guilds/${guildId}/channels`,
                EMBED:                           (guildId) => `/guilds/${guildId}/embed`,
                EMOJIS:                          (guildId) => `/guilds/${guildId}/emojis`,
                EMOJI:                  (guildId, emojiId) => `/guilds/${guildId}/emojis/${emojiId}`,
                INTEGRATIONS:                    (guildId) => `/guilds/${guildId}/integrations`,
                INTEGRATION:      (guildId, integrationId) => `/guilds/${guildId}/integrations/${integrationId}`,
                INTEGRATION_SYNC: (guildId, integrationId) => `/guilds/${guildId}/integrations/${integrationId}/sync`,
                INVITES:                         (guildId) => `/guilds/${guildId}/invites`,
                MEMBERS:                         (guildId) => `/guilds/${guildId}/members`,
                MEMBER:                  (guildId, userId) => `/guilds/${guildId}/members/${userId}`,
                MEMBER_NICK:             (guildId, userId) => `/guilds/${guildId}/members/${userId}/nick`,
                MEMBER_ROLE:     (guildId, userId, roleId) => `/guilds/${guildId}/members/${userId}/nick/${roleId}`,
                PRUNE:                           (guildId) => `/guilds/${guildId}/prune`,
                REGIONS:                         (guildId) => `/guilds/${guildId}/regions`,
                ROLES:                           (guildId) => `/guilds/${guildId}/roles`,
                ROLE:                            (guildId) => `/guilds/${guildId}/roles/${roleId}`,
                VANITY_URL:                      (guildId) => `/guilds/${guildId}/vanity-url`,
                WEBHOOKS:                        (guildId) => `/guilds/${guildId}/webhooks`
            },
        
            USERS: {
                ID:          (userId) => `/users/${userId}`,
                CHANNELS:    (userId) => `/users/${userId}/channels`,
                CONNECTIONS: (userId) => `/users/${userId}/connections`,
                GUILDS:      (userId) => `/users/${userId}/guilds`,
                GUILD:       (userId) => `/users/${userId}/guilds/${guildId}`
            },
        
            WEBHOOKS: {
                ID:                  (webhookId) => `/webhooks/${webhookId}`,
                TOKEN:        (webhookId, token) => `/webhooks/${webhookId}/${token}`,
                TOKEN_GITHUB: (webhookId, token) => `/webhooks/${webhookId}/${token}/github`,
                TOKEN_SLACK:  (webhookId, token) => `/webhooks/${webhookId}/${token}/slack`,
            },
        
            GAMES:            '/games',
            GATEWAY:          '/gateway',
            GATEWAY_BOT:      '/gateway/bot',
            INVITE: (code) => `/invites/${code}`,
            VOICE_ICE:        `/voice/ice`,
            VOICE_REGIONS:    `/voice/regions`
        }
    },

    Epoch: {
        SNOWFLAKE: 1420070400000,
        TOKEN: 1293840000
    },

    DefaultAvatarHashes: [
        '6debd47ed13483642cf09e832ed0bc1b',
        '322c936a8c8be1b803cd94861bdfa868',
        'dd4dbc0016779df1378e7812eabaa04d',
        '0e291f67c9274a1abdddeb3fd919cbaa',
        '1cbd08c76f8af6dddce02c5138971129'
    ],

    ImageFormats: [
        'jpg',
        'png',
        'gif',
        'webp'
    ],

    Gateway: {
        Encoding: [
            'etf',
            'json'
        ],
        MAX_HEARTBEAT_THRESHOLD: 3 * 60 * 1000,
        READY_TIMEOUT: 1 * 60 * 1000,
        STATUS: {
            ONLINE: 'online',
            DND: 'dnd',
            IDLE: 'idle',
            INVISIBLE: 'invisible',
            OFFLINE: 'offline'
        }
    },

    Detritus: {
        State: {
            CLOSED: 0,
            CONNECTING: 1,
            CONNECTED: 2
        },
        MessageCacheTypes: [
            'global',
            'guild',
            'channel'
        ],
        Events: {
            GATEWAY_OPEN: 0
        }
    }
};