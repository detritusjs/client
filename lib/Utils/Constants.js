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
            ICON: (hash, format='png') => `/${hash}.${format}`
        },

        CDN: {
            URL:                                             'https://cdn.discordapp.com',
            APP_ICON: (applicationId, hash, format='png') => `/app-icons/${applicationId}/${hash}.${format}`,
            AVATAR:          (userId, hash, format='png') => `/avatars/${userId}/${hash}.${format}`,
            AVATAR_DEFAULT:         (discriminatorModulo) => `/embed/avatars/${discriminatorModulo}.png`,
            DM_ICON:      (channelId, hash, format='png') => `/channel-icons/${channelId}/${hash}.${format}`,
            GAME_ICON:       (gameId, hash, format='png') => `/game-assets/${gameId}/${hash}.${format}`,
            GUILD_ICON:     (guildId, hash, format='png') => `/icons/${guildId}/${hash}.${format}`,
            GUILD_SPLASH:   (guildId, hash, format='png') => `/splashes/${guildId}/${hash}.${format}`,
            EMOJI:                (emojiId, format='png') => `/emojis/${emojiId}.${format}`,
            ACTIVITY: {
                SPOTIFY: (hash) => `https://i.scdn.co/image/${hash}`
            }
        },

        REST: {
            URL: 'https://discordapp.com',
            URI: `/api/v${ApiVersion.REST}`,

            APPLICATIONS: {
                ALL:    '/applications',
                ASSETS: '/oauth2/applications/:applicationId:/assets'
            },

            CHANNELS: {
                ALL:                   '/channels',
                ID:                    '/channels/:channelId:',
                CALL:                  '/channels/:channelId:/call',
                CALL_RING:             '/channels/:channelId:/call/ring',
                CALL_STOP_RINGING:     '/channels/:channelId:/call/stop-ringing',
                CONVERT:               '/channels/:channelId:/convert',
                BULK_DELETE:           '/channels/:channelId:/messages/bulk-delete',
                INVITES:               '/channels/:channelId:/invites',
                MESSAGES:              '/channels/:channelId:/messages',
                MESSAGE:               '/channels/:channelId:/messages/:messageId:',
                MESSAGE_REACTIONS:     '/channels/:channelId:/messages/:messageId:/reactions',
                MESSAGE_REACTION:      '/channels/:channelId:/messages/:messageId:/reactions/:emoji:',
                MESSAGE_REACTION_USER: '/channels/:channelId:/messages/:messageId:/reactions/:emoji:/:userId:',
                PERMISSIONS:           '/channels/:channelId:/permissions',
                PERMISSION:            '/channels/:channelId:/permissions/:overwriteId:',
                PINS:                  '/channels/:channelId:/pins',
                PIN:                   '/channels/:channelId:/pins/:messageId:',
                RECIPIENTS:            '/channels/:channelId:/recipients',
                RECIPIENT:             '/channels/:channelId:/recipients/:userId:',
                SEARCH:                '/channels/:channelId:/messages/search',
                TYPING:                '/channels/:channelId:/typing',
                WEBHOOKS:              '/channels/:channelId:/webhooks'
            },

            GAMES: {
                ALL:   '/games',
                NEWS:  '/game-news?game_ids=:gameId:'
            },
        
            GUILDS: {
                ALL:              '/guilds',
                ID:               '/guilds/:guildId:',
                AUDIT_LOGS:       '/guilds/:guildId:/audit-logs',
                BANS:             '/guilds/:guildId:/bans',
                BAN:              '/guilds/:guildId:/bans/:userId:',
                CHANNELS:         '/guilds/:guildId:/channels',
                EMBED:            '/guilds/:guildId:/embed',
                EMOJIS:           '/guilds/:guildId:/emojis',
                EMOJI:            '/guilds/:guildId:/emojis/:emojiId:',
                INTEGRATIONS:     '/guilds/:guildId:/integrations',
                INTEGRATION:      '/guilds/:guildId:/integrations/:integrationId:',
                INTEGRATION_SYNC: '/guilds/:guildId:/integrations/:integrationId:/sync',
                INVITES:          '/guilds/:guildId:/invites',
                MFA:              '/guilds/:guildId:/mfa',
                MEMBERS:          '/guilds/:guildId:/members',
                MEMBER:           '/guilds/:guildId:/members/:userId:',
                MEMBER_NICK:      '/guilds/:guildId:/members/:userId:/nick',
                MEMBER_ROLE:      '/guilds/:guildId:/members/:userId:/roles/:roleId:',
                PRUNE:            '/guilds/:guildId:/prune',
                REGIONS:          '/guilds/:guildId:/regions',
                ROLES:            '/guilds/:guildId:/roles',
                ROLE:             '/guilds/:guildId:/roles/:roleId:',
                SEARCH:           '/guilds/:guildId:/messages/search',
                VANITY_URL:       '/guilds/:guildId:/vanity-url',
                WEBHOOKS:         '/guilds/:guildId:/webhooks'
            },
        
            USERS: {
                ID:                            '/users/:userId:',
                ACTIVITY_JOIN:                 '/users/:userId:/sessions/:sessionId:/activity/2',
                ACTIVITY_JOIN_INVITE:          '/users/:userId:/sessions/:sessionId:/activity/8/:sessionId:', //probably wrong
                ACTIVITY_JOIN_REQUEST:         '/users/:userId:/sessions/:sessionId:/activity/8',
                ACTIVITY_METADATA:             '/users/:userId:/sessions/:sessionId:/activity/metadata',
                ACTIVITY_SPECTATE:             '/users/:userId:/sessions/:sessionId:/activity/4',
                BILLING:                       '/users/@me/billing',
                CHANNELS:                      '/users/:userId:/channels',
                CONNECTIONS:                   '/users/:userId:/connections',
                DELETE_ACCOUNT:                '/users/:userId:/delete',
                GAMES_FOLLOWING:               '/users/@me/following',
                GAMES_NOTIFICATIONS:           '/users/@me/settings/games-notifications',
                GAMES_NOTIFICATIONS_OVERRIDES: '/users/@me/settings/games-notifications/overrides',
                GUILDS:                        '/users/:userId:/guilds',
                GUILD:                         '/users/:userId:/guilds/:guildId:',
                GUILD_SETTINGS:                '/users/:userId:/guilds/:guildId:/settings',
                MENTIONS:                      '/users/@me/mentions',
                MENTIONS_MESSAGE:              '/users/@me/mentions/:messageId:',
                PROFILE:                       '/users/:userId:/profile',
                RELATIONSHIPS:                 '/users/:userId:/relationships'
            },
        
            WEBHOOKS: {
                ID:           '/webhooks/:webhookId:',
                TOKEN:        '/webhooks/:webhookId:/:token:',
                TOKEN_GITHUB: '/webhooks/:webhookId:/:token:/github',
                TOKEN_SLACK:  '/webhooks/:webhookId:/:token:/slack',
            },

            FRIEND_SUGGESTIONS: '/friend-suggestions',
            GATEWAY:            '/gateway',
            GATEWAY_BOT:        '/gateway/bot',
            INVITE:             '/invites/:code:',
            VOICE_ICE:          '/voice/ice',
            VOICE_REGIONS:      '/voice/regions'
        }
    },

    Epoch: {
        SNOWFLAKE: 1420070400000,
        TOKEN: 1293840000
    },

    SystemMessages: {
        CallMissed: 'You missed a call from :user:.',
        CallStarted: ':user: started a call.',
        ChannelIconChange: ':user: changed the channel name: **:name:**',
        ChannelNameChange: ':user: changed the channel icon.',
        PinnedMessage: ':user: pinned a message to this channel.',
        RecipientAdd: ':user: added :user2: to the group.',
        RecipientRemove: ':user: removed :user2: from the group.',
        RecipientRemoveSelf: ':user: left the group.',
        GuildMemberJoin: [
            ":user: just joined the server - glhf!",
            ":user: just joined. Everyone, look busy!",
            ":user: just joined. Can I get a heal?",
            ":user: joined your party.",
            ":user: joined. You must construct additional pylons.",
            "Ermagherd. :user: is here.",
            "Welcome, :user:. Stay awhile and listen.",
            "Welcome, :user:. We were expecting you ( ͡° ͜ʖ ͡°)",
            "Welcome, :user:. We hope you brought pizza.",
            "Welcome :user:. Leave your weapons by the door.",
            "A wild :user: appeared.",
            "Swoooosh. :user: just landed.",
            "Brace yourselves. :user: just joined the server.",
            ":user: just joined. Hide your bananas.",
            ":user: just arrived. Seems OP - please nerf.",
            ":user: just slid into the server.",
            "A :user: has spawned in the server.",
            "Big :user: showed up!",
            "Where’s :user:? In the server!",
            ":user: hopped into the server. Kangaroo!!",
            ":user: just showed up. Hold my beer.",
            "Challenger approaching - :user: has appeared!",
            "It's a bird! It's a plane! Nevermind, it's just :user:.",
            "It's :user:! Praise the sun! \\\\[T]/",
            "Never gonna give :user: up. Never gonna let :user: down.",
            "Ha! :user: has joined! You activated my trap card!",
            "Cheers, love! :user:'s here!",
            "Hey! Listen! :user: has joined!",
            "We've been expecting you :user:",
            "It's dangerous to go alone, take :user:!",
            ":user: has joined the server! It's super effective!",
            "Cheers, love! :user: is here!",
            ":user: is here, as the prophecy foretold.",
            ":user: has arrived. Party's over.",
            "Ready player :user:",
            ":user: is here to kick butt and chew bubblegum. And :user: is all out of gum.",
            "Hello. Is it :user: you're looking for?",
            ":user: has joined. Stay a while and listen!",
            "Roses are red, violets are blue, :user: joined this server with you",
        ]
    },

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