const Gateway = require('detritus-websocket').Utils.Constants;
const Rest = require('detritus-client-rest').Utils.Constants;

module.exports = {
	VERSION: '0.0.1',
	Gateway,
	Rest,
	Discord: {
		ChannelTypes: {
			BASE: -1,
			GUILD_TEXT: 0,
			DM: 1,
			GUILD_VOICE: 2,
			GROUP_DM: 3,
			GUILD_CATEGORY: 4
		},
		Epoch: {
			SNOWFLAKE: 1420070400000,
			TOKEN: 1293840000
		},
		MessageTypes: {
			BASE: -1,
			DEFAULT: 0,
			RECIPIENT_ADD: 1,
			RECIPIENT_REMOVE: 2,
			CALL: 3,
			CHANNEL_NAME_CHANGE: 4,
			CHANNEL_ICON_CHANGE: 5,
			CHANNEL_PINNED_MESSAGE: 6,
			GUILD_MEMBER_JOIN: 7
		},
		Permissions: {
			CREATE_INSTANT_INVITES: 1 << 0,
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
		}
	},
	Detritus: {
		MessageCacheTypes: ['global', 'guild', 'channel']
	}
}