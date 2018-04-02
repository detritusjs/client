
const PCrypto = {
	available: {},
	modules: ['sodium-native', 'tweetnacl']
};

for (let mod of PCrypto.modules) {
	try {
		PCrypto.available[mod] = require(mod);
	} catch (e) {continue;}
}

class PacketCrypto
{
	constructor(key, mod)
	{
		this.key = null;
		this.mod = null;

		this.setKey(key);
		this.setMod(mod || PCrypto.modules.find((m) => m in PCrypto.available));
	}

	get module()
	{
		if (!this.mod) {throw new Error('Module missing, cannot encrypt/decrypt.');}
		return PCrypto.available[this.mod];
	}

	setMod(mod)
	{
		if (!mod) {
			throw new Error(`For voice packing/unpacking, please install one of: ${JSON.stringify(PCrypto.modules)}`);
		}
		if (!PCrypto.modules.includes(mod)) {
			throw new Error(`Invalid module '${mod}', please use one of: ${JSON.stringify(PCrypto.modules)}`);
		}
		if (!(mod in PCrypto.available)) {
			throw new Error(`Module '${mod} is not installed, use one of: ${JSON.stringify(PCrypto.modules)}`);
		}
		this.mod = mod;
	}

	setKey(key)
	{
		//assume its an array passed in by the websocket
		if (!key) {return;}
		this.key = new Uint8Array(new ArrayBuffer(key.length));
		for (let i = 0; i < this.key.length; i++) {
			this.key[i] = key[i];
		}
	}

	generateNonce()
	{
		let nonce;
		switch (this.mod) {
			case 'sodium-native': {
				nonce = new Buffer(this.module.crypto_secretbox_NONCEBYTES);
				this.module.randombytes_buf(nonce);
			}; break;
			case 'tweetnacl': {
				nonce = Buffer.from(this.module.randomBytes(this.module.box.nonceLength));
			}; break;
		}
		return nonce;
	}

	encrypt(buf, nonce)
	{
		let packet;
		switch (this.mod) {
			case 'sodium-native': {
				packet = new Buffer(buf.length + this.module.crypto_secretbox_MACBYTES);
				this.module.crypto_secret_easy(packet, buf, nonce, this.key);
			}; break;
			case 'tweetnacl': {
				packet = this.module.secretbox(buf, nonce, this.key);
				packet = packet && Buffer.from(packet);
			}; break;
		}
		return packet;
	}

	decrypt(buf, nonce)
	{
		let packet;
		switch (this.mod) {
			case 'sodium-native': {
				packet = new Buffer(buf.length - this.module.crypto_secretbox_MACBYTES);
				this.module.crypto_secretbox_open_easy(packet, buf, nonce, this.key);
			}; break;
			case 'tweetnacl': {
				packet = this.module.secretbox.open(buf, nonce, this.key);
				packet = packet && Buffer.from(packet);
			}; break;
		}
		return packet;
	}
}

module.exports = PacketCrypto;