const BaseStructure = require('./basestructure');

const defaults = {
	afk_timeout: 300,
	animate_emoji: false,
	convert_emoticons: false,
	default_guilds_restricted: false,
	detect_platform_account: false,
	developer_mode: false,
	disable_games_tab: false,
	enable_tts_command: false,
	explicit_content_filter: 0,
	friend_source_flags: {},
	gif_auto_play: false,
	guild_positions: [],
	inline_attachment_media: false,
	inline_embed_media: false,
	locale: 'en-US',
	message_display_compact: false,
	render_embeds: false,
	render_reactions: false,
	restricted_guilds: [],
	show_current_game: false,
	status: 'online',
	theme: 'dark',
	timezone_offset: 240
};

class UserSettings extends BaseStructure {
	constructor(client, data) {
		super(client, data, defaults);
	}
	
	edit(body) {
		return this.client.rest.editSettings(body);
	}
}

module.exports = UserSettings;