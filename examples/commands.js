const Detritus = require('detritus-client');

const client = new Detritus.CommandClient('TOKEN', {
    prefix: '!!'
});

client.registerCommand({
    name: 'ping',
    run: (context, args) => context.reply('pong')
});

client.registerCommand({
    name: 'eval',
    label: 'code',
    args: [{name: 'noreply', type: 'bool', default: false}],
    onBefore: (context) => context.user.id === context.owner.id,
    onCancel: (context) => context.reply(`${context.owner.mention}, ${context.user.mention} tried evaling`),
    run: (context, args) => {
        const match = Detritus.Utils.Tools.regex('text_codeblock', args.code);
        if (match) {
            args.code = match.text;
        }

        let codeType = 'js';
        return new Promise((resolve, reject) => {
            Promise.resolve(eval(args.code)).then((message) => {
                if (!message) {
                    message = String(message);
                } else if (typeof(message) !== 'string') {
                    message = JSON.stringify(message);
                    codeType = 'json';
                }
                resolve(message);
            }).catch(reject);
        }).catch((e) => (e) ? e.stack || e.message : e).then((message) => {
            const max = 1990 - codeType.length;
            if (args.noreply) {return;}
            return context.reply(['```' + codeType, String(message).slice(0, max), '```'].join('\n'));
        });
    },
    onError: (context, args, error) => {
        console.error(error);
    }
});

client.registerCommand({
	name: 'echo',
	label: 'text',
	args: [
		{
			name: 'reverse',
			aliases: ['backwards'],
			type: 'bool',
			default: false
		}
	],
	onBefore: (context, args) => !!args.text,
	onCancel: (context) => context.reply('hey give me text next time'),
	run: (context, args) => {
		let text = args.text;
		if (args.reverse) {
			text = text.split('').reverse().join('');
		}
		return context.reply(text);
	}
});

client.registerCommand({
	name: 'join',
	aliases: ['joinme'],
	args: [
		{name: 'mute', type: 'bool', default: false},
		{name: 'deaf', type: 'bool', default: false},
		{name: 'video', type: 'bool', default: false}
	],
	onBefore: (context) => context.member.voiceChannel,
	onCancel: (context) => context.reply('join a voice channel'),
	run: (context, args) => {
		args.videoEnabled = args.video;

		const voiceChannel = context.member.voiceChannel;
		if (!voiceChannel.canJoin) {
			return context.reply('cant join that channel');
		}

		return voiceChannel.join(args).then((voice) => {
			if (voice.isNew) {
				return context.reply(`ok, joined ${voiceChannel}`);
			} else {
				return context.reply(`ok, moved to ${voiceChannel}`);
			}
		});
	}
});

client.registerCommand({
	name: 'leave',
	onBefore: (context) => !!context.voiceConnection,
	onCancel: (context) => context.reply('im not in a channel??'),
	run: (context) => {
		context.voiceConnection.kill();
		return context.reply('ok i left');
	}
})

client.run().then((cluster) => {
    console.log(`loaded ${cluster.shardCount} shards`);
});