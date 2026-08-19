var fs = require("fs");
var http = require("http");
var http_2 = require("https");
var querystring = require("querystring");
var url_parse = require("url");
var ws = require("ws");
var os = require("os");
var sql = require("better-sqlite3");
var cookieParser = require('cookie-parser');
var crypto = require("crypto");
var express = require("express");
var e_rateLimit = require("express-rate-limit");
var path = require("path"); // essential
const { notDeepEqual } = require("assert");
const { create } = require("domain");
var anonymous = []
const typingUsers = {}; // { worldId: { userId: { name, timeoutId } } }
let customSettingsPath = process.argv[2];
const settingsPath = (customSettingsPath && customSettingsPath.includes("/"))
	? customSettingsPath
	: "../data/settings.json";

var settings = JSON.parse(fs.readFileSync(settingsPath));

function saveSettings() {
	try {
		const data = JSON.stringify(settings, null, 4);
		fs.writeFileSync(settingsPath, data, 'utf8');
	} catch (error) {
		throw error;
	}
}

var ipBans = JSON.parse(fs.readFileSync(settings.db.ipBansPath));

function saveIpBans() {
	try {
		const data = JSON.stringify(ipBans, null, 4);
		fs.writeFileSync(settings.db.ipBansPath, data, 'utf8');
	} catch (error) {
		throw error;
	}
}

var tags = JSON.parse(fs.readFileSync(settings.db.tagsPath));

console.log("Starting server...");

var port = Number(process.env.SERVER_PORT) || settings.port;
var bindHost = "0.0.0.0";
var muteDbPath = settings.db.chatMutePath;
var staticPath = "../client";

var db = sql(settings.db.path);


var pw_encryption = "sha512WithRSAEncryption";
function encryptHash(pass, salt) {
	if (!salt) {
		salt = crypto.randomBytes(10).toString("hex");
	}
	var hsh = crypto.createHmac(pw_encryption, salt).update(pass).digest("hex");
	var hash = pw_encryption + "$" + salt + "$" + hsh;
	return hash;
}

function checkHash(hash, pass) {
	if (typeof pass !== "string") return false;
	if (typeof hash !== "string") return false;
	hash = hash.split("$");
	if (hash.length !== 3) return false;
	return encryptHash(pass, hash[1]) === hash.join("$");
}

function normalizeIp(ip) {
	if (!ip || typeof ip !== "string") return "";
	ip = ip.trim().replace(/^["']|["']$/g, "");
	if (ip.startsWith("[") && ip.includes("]")) {
		ip = ip.slice(1, ip.indexOf("]"));
	}
	if (ip.startsWith("::ffff:")) ip = ip.slice("::ffff:".length);
	if (/^\d{1,3}(\.\d{1,3}){3}:\d+$/.test(ip)) ip = ip.split(":")[0];
	return ip.trim();
}

function isValidIp(ip) {
	if (!ip) return false;
	if (/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
		return ip.split(".").every(function (n) {
			n = Number(n);
			return n >= 0 && n <= 255;
		});
	}
	if (ip.includes(":") && /^[0-9a-fA-F:]+$/.test(ip)) return true;
	return false;
}

function firstForwardedForIp(value) {
	if (!value) return "";
	if (Array.isArray(value)) value = value.join(",");
	if (typeof value !== "string") return "";
	var parts = value.split(",");
	for (var i = 0; i < parts.length; i++) {
		var ip = normalizeIp(parts[i]);
		if (isValidIp(ip)) return ip;
	}
	return "";
}

function forwardedHeaderIp(value) {
	if (!value) return "";
	if (Array.isArray(value)) value = value.join(",");
	if (typeof value !== "string") return "";
	var m = value.match(/for\s*=\s*"?\[?([^\]";,\s]+)/i);
	return m ? normalizeIp(m[1]) : "";
}

function headerValue(headers, name) {
	var value = headers[name];
	if (Array.isArray(value)) value = value[0];
	return value;
}

function clientIpFromReq(req) {
	var headers = (req && req.headers) || {};
	var fromHeaders = [
		normalizeIp(headerValue(headers, "x-real-ip")),
		firstForwardedForIp(headers["x-forwarded-for"]),
		forwardedHeaderIp(headers["x-forwarded"]),
		forwardedHeaderIp(headers["forwarded"]),
		normalizeIp(headerValue(headers, "cf-connecting-ip")),
		normalizeIp(headerValue(headers, "true-client-ip"))
	];
	for (var i = 0; i < fromHeaders.length; i++) {
		if (isValidIp(fromHeaders[i])) return fromHeaders[i];
	}
	var sock = "";
	if (req && req.socket && req.socket.remoteAddress) sock = req.socket.remoteAddress;
	else if (req && req.connection && req.connection.remoteAddress) sock = req.connection.remoteAddress;
	sock = normalizeIp(sock);
	return isValidIp(sock) ? sock : "";
}

function recordUserLastIp(userId, ip) {
	if (!userId || !isValidIp(ip)) return;
	try {
		db.prepare("UPDATE users SET last_ip=?, last_ip_at=? WHERE id=?").run(ip, Date.now(), userId);
	} catch (e) { }
}
const adminSettingsPath = settings.db.adminSettings;
const adminSettings = {}
function loadAdminSettings() {
	try {
		Object.assign(adminSettings, JSON.parse(fs.readFileSync(adminSettingsPath)));
	} catch {
		throw new Error("Could not load admin settings file");
	}
}
loadAdminSettings();

const { execSync } = require('child_process');

(function () {
	"use strict";

	// Serializes a value to a MessagePack byte array.
	//
	// data: The value to serialize. This can be a scalar, array or object.
	// options: An object that defined additional options.
	// - multiple: Indicates whether multiple values in data are concatenated to multiple MessagePack arrays.
	// - invalidTypeReplacement: The value that is used to replace values of unsupported types, or a function that returns such a value, given the original value as parameter.
	function serialize(data, options) {
		if (options && options.multiple && !Array.isArray(data)) {
			throw new Error("Invalid argument type: Expected an Array to serialize multiple values.");
		}
		const pow32 = 0x100000000;   // 2^32
		let floatBuffer, floatView;
		let array = new Uint8Array(128);
		let length = 0;
		if (options && options.multiple) {
			for (let i = 0; i < data.length; i++) {
				append(data[i]);
			}
		}
		else {
			append(data);
		}
		return array.subarray(0, length);

		function append(data, isReplacement) {
			switch (typeof data) {
				case "undefined":
					appendNull(data);
					break;
				case "boolean":
					appendBoolean(data);
					break;
				case "number":
					appendNumber(data);
					break;
				case "string":
					appendString(data);
					break;
				case "object":
					if (data === null)
						appendNull(data);
					else if (data instanceof Date)
						appendDate(data);
					else if (Array.isArray(data))
						appendArray(data);
					else if (data instanceof Uint8Array || data instanceof Uint8ClampedArray)
						appendBinArray(data);
					else if (data instanceof Int8Array || data instanceof Int16Array || data instanceof Uint16Array ||
						data instanceof Int32Array || data instanceof Uint32Array ||
						data instanceof Float32Array || data instanceof Float64Array)
						appendArray(data);
					else
						appendObject(data);
					break;
				default:
					if (!isReplacement && options && options.invalidTypeReplacement) {
						if (typeof options.invalidTypeReplacement === "function")
							append(options.invalidTypeReplacement(data), true);
						else
							append(options.invalidTypeReplacement, true);
					}
					else {
						throw new Error("Invalid argument type: The type '" + (typeof data) + "' cannot be serialized.");
					}
			}
		}

		function appendNull(data) {
			appendByte(0xc0);
		}

		function appendBoolean(data) {
			appendByte(data ? 0xc3 : 0xc2);
		}

		function appendNumber(data) {
			if (isFinite(data) && Math.floor(data) === data) {
				// Integer
				if (data >= 0 && data <= 0x7f) {
					appendByte(data);
				}
				else if (data < 0 && data >= -0x20) {
					appendByte(data);
				}
				else if (data > 0 && data <= 0xff) {   // uint8
					appendBytes([0xcc, data]);
				}
				else if (data >= -0x80 && data <= 0x7f) {   // int8
					appendBytes([0xd0, data]);
				}
				else if (data > 0 && data <= 0xffff) {   // uint16
					appendBytes([0xcd, data >>> 8, data]);
				}
				else if (data >= -0x8000 && data <= 0x7fff) {   // int16
					appendBytes([0xd1, data >>> 8, data]);
				}
				else if (data > 0 && data <= 0xffffffff) {   // uint32
					appendBytes([0xce, data >>> 24, data >>> 16, data >>> 8, data]);
				}
				else if (data >= -0x80000000 && data <= 0x7fffffff) {   // int32
					appendBytes([0xd2, data >>> 24, data >>> 16, data >>> 8, data]);
				}
				else if (data > 0 && data <= 0xffffffffffffffff) {   // uint64
					// Split 64 bit number into two 32 bit numbers because JavaScript only regards
					// 32 bits for bitwise operations.
					let hi = data / pow32;
					let lo = data % pow32;
					appendBytes([0xd3, hi >>> 24, hi >>> 16, hi >>> 8, hi, lo >>> 24, lo >>> 16, lo >>> 8, lo]);
				}
				else if (data >= -0x8000000000000000 && data <= 0x7fffffffffffffff) {   // int64
					appendByte(0xd3);
					appendInt64(data);
				}
				else if (data < 0) {   // below int64
					appendBytes([0xd3, 0x80, 0, 0, 0, 0, 0, 0, 0]);
				}
				else {   // above uint64
					appendBytes([0xcf, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff]);
				}
			}
			else {
				// Float
				if (!floatView) {
					floatBuffer = new ArrayBuffer(8);
					floatView = new DataView(floatBuffer);
				}
				floatView.setFloat64(0, data);
				appendByte(0xcb);
				appendBytes(new Uint8Array(floatBuffer));
			}
		}

		function appendString(data) {
			let bytes = encodeUtf8(data);
			let length = bytes.length;

			if (length <= 0x1f)
				appendByte(0xa0 + length);
			else if (length <= 0xff)
				appendBytes([0xd9, length]);
			else if (length <= 0xffff)
				appendBytes([0xda, length >>> 8, length]);
			else
				appendBytes([0xdb, length >>> 24, length >>> 16, length >>> 8, length]);

			appendBytes(bytes);
		}

		function appendArray(data) {
			let length = data.length;

			if (length <= 0xf)
				appendByte(0x90 + length);
			else if (length <= 0xffff)
				appendBytes([0xdc, length >>> 8, length]);
			else
				appendBytes([0xdd, length >>> 24, length >>> 16, length >>> 8, length]);

			for (let index = 0; index < length; index++) {
				append(data[index]);
			}
		}

		function appendBinArray(data) {
			let length = data.length;

			if (length <= 0xf)
				appendBytes([0xc4, length]);
			else if (length <= 0xffff)
				appendBytes([0xc5, length >>> 8, length]);
			else
				appendBytes([0xc6, length >>> 24, length >>> 16, length >>> 8, length]);

			appendBytes(data);
		}

		function appendObject(data) {
			let length = 0;
			for (let key in data) {
				if (data[key] !== undefined) {
					length++;
				}
			}

			if (length <= 0xf)
				appendByte(0x80 + length);
			else if (length <= 0xffff)
				appendBytes([0xde, length >>> 8, length]);
			else
				appendBytes([0xdf, length >>> 24, length >>> 16, length >>> 8, length]);

			for (let key in data) {
				let value = data[key];
				if (value !== undefined) {
					append(key);
					append(value);
				}
			}
		}

		function appendDate(data) {
			let sec = data.getTime() / 1000;
			if (data.getMilliseconds() === 0 && sec >= 0 && sec < 0x100000000) {   // 32 bit seconds
				appendBytes([0xd6, 0xff, sec >>> 24, sec >>> 16, sec >>> 8, sec]);
			}
			else if (sec >= 0 && sec < 0x400000000) {   // 30 bit nanoseconds, 34 bit seconds
				let ns = data.getMilliseconds() * 1000000;
				appendBytes([0xd7, 0xff, ns >>> 22, ns >>> 14, ns >>> 6, ((ns << 2) >>> 0) | (sec / pow32), sec >>> 24, sec >>> 16, sec >>> 8, sec]);
			}
			else {   // 32 bit nanoseconds, 64 bit seconds, negative values allowed
				let ns = data.getMilliseconds() * 1000000;
				appendBytes([0xc7, 12, 0xff, ns >>> 24, ns >>> 16, ns >>> 8, ns]);
				appendInt64(sec);
			}
		}

		function appendByte(byte) {
			if (array.length < length + 1) {
				let newLength = array.length * 2;
				while (newLength < length + 1)
					newLength *= 2;
				let newArray = new Uint8Array(newLength);
				newArray.set(array);
				array = newArray;
			}
			array[length] = byte;
			length++;
		}

		function appendBytes(bytes) {
			if (array.length < length + bytes.length) {
				let newLength = array.length * 2;
				while (newLength < length + bytes.length)
					newLength *= 2;
				let newArray = new Uint8Array(newLength);
				newArray.set(array);
				array = newArray;
			}
			array.set(bytes, length);
			length += bytes.length;
		}

		function appendInt64(value) {
			// Split 64 bit number into two 32 bit numbers because JavaScript only regards 32 bits for
			// bitwise operations.
			let hi, lo;
			if (value >= 0) {
				// Same as uint64
				hi = value / pow32;
				lo = value % pow32;
			}
			else {
				// Split absolute value to high and low, then NOT and ADD(1) to restore negativity
				value++;
				hi = Math.abs(value) / pow32;
				lo = Math.abs(value) % pow32;
				hi = ~hi;
				lo = ~lo;
			}
			appendBytes([hi >>> 24, hi >>> 16, hi >>> 8, hi, lo >>> 24, lo >>> 16, lo >>> 8, lo]);
		}
	}

	// Deserializes a MessagePack byte array to a value.
	//
	// array: The MessagePack byte array to deserialize. This must be an Array or Uint8Array containing bytes, not a string.
	// options: An object that defined additional options.
	// - multiple: Indicates whether multiple concatenated MessagePack arrays are returned as an array.
	function deserialize(array, options) {
		const pow32 = 0x100000000;   // 2^32
		let pos = 0;
		if (array instanceof ArrayBuffer) {
			array = new Uint8Array(array);
		}
		if (typeof array !== "object" || typeof array.length === "undefined") {
			throw new Error("Invalid argument type: Expected a byte array (Array or Uint8Array) to deserialize.");
		}
		if (!array.length) {
			throw new Error("Invalid argument: The byte array to deserialize is empty.");
		}
		if (!(array instanceof Uint8Array)) {
			array = new Uint8Array(array);
		}
		let data;
		if (options && options.multiple) {
			// Read as many messages as are available
			data = [];
			while (pos < array.length) {
				data.push(read());
			}
		}
		else {
			// Read only one message and ignore additional data
			data = read();
		}
		return data;

		function read() {
			const byte = array[pos++];
			if (byte >= 0x00 && byte <= 0x7f) return byte;   // positive fixint
			if (byte >= 0x80 && byte <= 0x8f) return readMap(byte - 0x80);   // fixmap
			if (byte >= 0x90 && byte <= 0x9f) return readArray(byte - 0x90);   // fixarray
			if (byte >= 0xa0 && byte <= 0xbf) return readStr(byte - 0xa0);   // fixstr
			if (byte === 0xc0) return null;   // nil
			if (byte === 0xc1) throw new Error("Invalid byte code 0xc1 found.");   // never used
			if (byte === 0xc2) return false;   // false
			if (byte === 0xc3) return true;   // true
			if (byte === 0xc4) return readBin(-1, 1);   // bin 8
			if (byte === 0xc5) return readBin(-1, 2);   // bin 16
			if (byte === 0xc6) return readBin(-1, 4);   // bin 32
			if (byte === 0xc7) return readExt(-1, 1);   // ext 8
			if (byte === 0xc8) return readExt(-1, 2);   // ext 16
			if (byte === 0xc9) return readExt(-1, 4);   // ext 32
			if (byte === 0xca) return readFloat(4);   // float 32
			if (byte === 0xcb) return readFloat(8);   // float 64
			if (byte === 0xcc) return readUInt(1);   // uint 8
			if (byte === 0xcd) return readUInt(2);   // uint 16
			if (byte === 0xce) return readUInt(4);   // uint 32
			if (byte === 0xcf) return readUInt(8);   // uint 64
			if (byte === 0xd0) return readInt(1);   // int 8
			if (byte === 0xd1) return readInt(2);   // int 16
			if (byte === 0xd2) return readInt(4);   // int 32
			if (byte === 0xd3) return readInt(8);   // int 64
			if (byte === 0xd4) return readExt(1);   // fixext 1
			if (byte === 0xd5) return readExt(2);   // fixext 2
			if (byte === 0xd6) return readExt(4);   // fixext 4
			if (byte === 0xd7) return readExt(8);   // fixext 8
			if (byte === 0xd8) return readExt(16);   // fixext 16
			if (byte === 0xd9) return readStr(-1, 1);   // str 8
			if (byte === 0xda) return readStr(-1, 2);   // str 16
			if (byte === 0xdb) return readStr(-1, 4);   // str 32
			if (byte === 0xdc) return readArray(-1, 2);   // array 16
			if (byte === 0xdd) return readArray(-1, 4);   // array 32
			if (byte === 0xde) return readMap(-1, 2);   // map 16
			if (byte === 0xdf) return readMap(-1, 4);   // map 32
			if (byte >= 0xe0 && byte <= 0xff) return byte - 256;   // negative fixint
			//console.debug("msgpack array:", array);
			throw new Error("Invalid byte value '" + byte + "' at index " + (pos - 1) + " in the MessagePack binary data (length " + array.length + "): Expecting a range of 0 to 255. This is not a byte array.");
		}

		function readInt(size) {
			let value = 0;
			let first = true;
			while (size-- > 0) {
				if (first) {
					let byte = array[pos++];
					value += byte & 0x7f;
					if (byte & 0x80) {
						value -= 0x80;   // Treat most-significant bit as -2^i instead of 2^i
					}
					first = false;
				}
				else {
					value *= 256;
					value += array[pos++];
				}
			}
			return value;
		}

		function readUInt(size) {
			let value = 0;
			while (size-- > 0) {
				value *= 256;
				value += array[pos++];
			}
			return value;
		}

		function readFloat(size) {
			let view = new DataView(array.buffer, pos + array.byteOffset, size);
			pos += size;
			if (size === 4)
				return view.getFloat32(0, false);
			if (size === 8)
				return view.getFloat64(0, false);
		}

		function readBin(size, lengthSize) {
			if (size < 0) size = readUInt(lengthSize);
			let data = array.subarray(pos, pos + size);
			pos += size;
			return data;
		}

		function readMap(size, lengthSize) {
			if (size < 0) size = readUInt(lengthSize);
			let data = {};
			while (size-- > 0) {
				let key = read();
				data[key] = read();
			}
			return data;
		}

		function readArray(size, lengthSize) {
			if (size < 0) size = readUInt(lengthSize);
			let data = [];
			while (size-- > 0) {
				data.push(read());
			}
			return data;
		}

		function readStr(size, lengthSize) {
			if (size < 0) size = readUInt(lengthSize);
			let start = pos;
			pos += size;
			return decodeUtf8(array, start, size);
		}

		function readExt(size, lengthSize) {
			if (size < 0) size = readUInt(lengthSize);
			let type = readUInt(1);
			let data = readBin(size);
			switch (type) {
				case 255:
					return readExtDate(data);
			}
			return { type: type, data: data };
		}

		function readExtDate(data) {
			if (data.length === 4) {
				let sec = ((data[0] << 24) >>> 0) +
					((data[1] << 16) >>> 0) +
					((data[2] << 8) >>> 0) +
					data[3];
				return new Date(sec * 1000);
			}
			if (data.length === 8) {
				let ns = ((data[0] << 22) >>> 0) +
					((data[1] << 14) >>> 0) +
					((data[2] << 6) >>> 0) +
					(data[3] >>> 2);
				let sec = ((data[3] & 0x3) * pow32) +
					((data[4] << 24) >>> 0) +
					((data[5] << 16) >>> 0) +
					((data[6] << 8) >>> 0) +
					data[7];
				return new Date(sec * 1000 + ns / 1000000);
			}
			if (data.length === 12) {
				let ns = ((data[0] << 24) >>> 0) +
					((data[1] << 16) >>> 0) +
					((data[2] << 8) >>> 0) +
					data[3];
				pos -= 8;
				let sec = readInt(8);
				return new Date(sec * 1000 + ns / 1000000);
			}
			throw new Error("Invalid data length for a date value.");
		}
	}

	// Encodes a string to UTF-8 bytes.
	function encodeUtf8(str) {
		// Prevent excessive array allocation and slicing for all 7-bit characters
		let ascii = true, length = str.length;
		for (let x = 0; x < length; x++) {
			if (str.charCodeAt(x) > 127) {
				ascii = false;
				break;
			}
		}

		// Based on: https://gist.github.com/pascaldekloe/62546103a1576803dade9269ccf76330
		let i = 0, bytes = new Uint8Array(str.length * (ascii ? 1 : 4));
		for (let ci = 0; ci !== length; ci++) {
			let c = str.charCodeAt(ci);
			if (c < 128) {
				bytes[i++] = c;
				continue;
			}
			if (c < 2048) {
				bytes[i++] = c >> 6 | 192;
			}
			else {
				if (c > 0xd7ff && c < 0xdc00) {
					if (++ci >= length)
						throw new Error("UTF-8 encode: incomplete surrogate pair");
					let c2 = str.charCodeAt(ci);
					if (c2 < 0xdc00 || c2 > 0xdfff)
						throw new Error("UTF-8 encode: second surrogate character 0x" + c2.toString(16) + " at index " + ci + " out of range");
					c = 0x10000 + ((c & 0x03ff) << 10) + (c2 & 0x03ff);
					bytes[i++] = c >> 18 | 240;
					bytes[i++] = c >> 12 & 63 | 128;
				}
				else bytes[i++] = c >> 12 | 224;
				bytes[i++] = c >> 6 & 63 | 128;
			}
			bytes[i++] = c & 63 | 128;
		}
		return ascii ? bytes : bytes.subarray(0, i);
	}

	// Decodes a string from UTF-8 bytes.
	function decodeUtf8(bytes, start, length) {
		// Based on: https://gist.github.com/pascaldekloe/62546103a1576803dade9269ccf76330
		let i = start, str = "";
		length += start;
		while (i < length) {
			let c = bytes[i++];
			if (c > 127) {
				if (c > 191 && c < 224) {
					if (i >= length)
						throw new Error("UTF-8 decode: incomplete 2-byte sequence");
					c = (c & 31) << 6 | bytes[i++] & 63;
				}
				else if (c > 223 && c < 240) {
					if (i + 1 >= length)
						throw new Error("UTF-8 decode: incomplete 3-byte sequence");
					c = (c & 15) << 12 | (bytes[i++] & 63) << 6 | bytes[i++] & 63;
				}
				else if (c > 239 && c < 248) {
					if (i + 2 >= length)
						throw new Error("UTF-8 decode: incomplete 4-byte sequence");
					c = (c & 7) << 18 | (bytes[i++] & 63) << 12 | (bytes[i++] & 63) << 6 | bytes[i++] & 63;
				}
				else throw new Error("UTF-8 decode: unknown multibyte start 0x" + c.toString(16) + " at index " + (i - 1));
			}
			if (c <= 0xffff) str += String.fromCharCode(c);
			else if (c <= 0x10ffff) {
				c -= 0x10000;
				str += String.fromCharCode(c >> 10 | 0xd800)
				str += String.fromCharCode(c & 0x3FF | 0xdc00)
			}
			else throw new Error("UTF-8 decode: code point 0x" + c.toString(16) + " exceeds UTF-16 reach");
		}
		return str;
	}

	// The exported functions
	let msgpack = {
		serialize: serialize,
		deserialize: deserialize,

		// Compatibility with other libraries
		encode: serialize,
		decode: deserialize
	};

	global.msgpack = msgpack;

})();
function mask_ip(ip) {
	if (ip.includes(':')) {
		return ip.replace(/^([0-9a-fA-F]+):.+$/, "$1:X:X:X:X:X:X:X");
	} else {
		return ip.replace(/^(\d+)\.\d+\.\d+\.\d+$/, "$1.X.X.X");
	}
}
const WHITELIST_FILE = settings.db.whitelistPath

function loadWhitelist() {
	try {
		return JSON.parse(fs.readFileSync(WHITELIST_FILE));
	} catch {
		return [false, []];
	}
}

function saveWhitelist(data) {
	fs.writeFileSync(WHITELIST_FILE, JSON.stringify(data, null, 2));
}
function isWhitelisted(username) {
	const [enabled, users] = loadWhitelist();
	if (!enabled) return true; // whitelist disabled, allow all
	return users.includes(username);
}
function refTags() {
	return JSON.parse(fs.readFileSync(settings.db.tagsPath));
}
function saveTags() {
	fs.writeFileSync(settings.db.tagsPath, JSON.stringify(tags, null, 2));
	tags = refTags();
}
var adminSessions = {};

function loadAdminSessions() {
	const rows = db.prepare("SELECT username, token, expires_at FROM admin_sessions").all();
	rows.forEach(row => {
		if (row.expires_at > Date.now()) {
			adminSessions[row.token] = { username: row.username, expiresAt: row.expires_at };
		} else {
			deleteAdminSession(row.token);
		}
	});
}

function saveAdminSession(username, token, expiresAt) {
	db.prepare("INSERT INTO admin_sessions (username, token, expires_at) VALUES (?, ?, ?)").run(username, token, expiresAt);
	adminSessions[token] = { username, expiresAt };
}

function deleteAdminSession(token) {
	db.prepare("DELETE FROM admin_sessions WHERE token = ?").run(token);
	delete adminSessions[token];
}
var recent_announcements = [];
function getRecentAnnouncements() {
	const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago
	recent_announcements = recent_announcements.filter(a => a.timestamp > cutoff);
	return recent_announcements;
}
function saveToRecentAnnouncements(message) {
	recent_announcements.push({ message, timestamp: Date.now() });
}
var httpServer;
async function runserver() {
	var twrApp = express();
	twrApp.set("trust proxy", true);
	twrApp.use(express.urlencoded({ extended: true }));
	twrApp.use(express.json());
	twrApp.use(cookieParser());
	twrApp.set('view engine', 'ejs');
	twrApp.set('views', path.join(__dirname, '..', 'views')); // /../views 
	httpServer = http.createServer(twrApp);



	function requireAuth(req, res, next) {
		const token = req.cookies?.admin_session;
		const session = token && adminSessions[token];

		if (!session || Date.now() > session.expiresAt) {
			if (token && session) deleteAdminSession(token);
			res.clearCookie('admin_session', { path: '/' });
			// is this a request?
			if (req.headers["content-type"]?.includes("application/json")) {
				return res.status(403).json({ success: false, message: "Not authenticated" });
			} // or is this a browser?
			else {
				return res.status(403).render("status", { statusCode: 403 })
			}
		}

		req.admin = session.username;
		next();
	}

	function createAdminRequest(actionPath, handler, opts = { noR: false, get: false }) {
		const useAuth = !opts.noR;
		if (useAuth) {
			twrApp.post(`/admin/${actionPath}`, requireAuth, handler);
		} else {
			twrApp.post(`/admin/${actionPath}`, handler);
		}
		if (opts.get) {
			if (useAuth) {
				twrApp.get(`/admin/${actionPath}`, requireAuth, handler);
			} else {
				twrApp.get(`/admin/${actionPath}`, handler);
			}
		}
		if (opts.delete) {
			if (useAuth) {
				twrApp.delete(`/admin/${actionPath}`, requireAuth, handler);
			} else {
				twrApp.delete(`/admin/${actionPath}`, handler);
			}
		}
		if (opts.get && opts.delete) {
			throw new Error("Conflicting options: Cannot have both GET and DELETE for the same endpoint");
		}
	}



	createAdminRequest('credentials', (req, res) => {

		const { username, password } = req.body;
		if (!username || !password) return res.json({ success: false });

		const user = db.prepare("SELECT * FROM users WHERE username=? COLLATE NOCASE").get(username);
		if (!user) return res.json({ success: false });

		const isValid = checkHash(user.password, password);
		if (!isValid) return res.json({ success: false });

		const isAuthenticated = settings.adminList.includes(username)
		if (!isAuthenticated) return res.json({ success: false })
		const token = crypto.randomBytes(16).toString('hex');
		res.cookie('admin_session', token, {
			maxAge: 7 * 24 * 60 * 60 * 1000,
			httpOnly: true,
			path: '/',
			sameSite: 'lax',
			secure: false
		});
		const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
		saveAdminSession(username, token, expiresAt);

		res.json({ success: true });
	}, { noR: true });

	createAdminRequest('check', (req, res) => {
		const token = req.cookies?.admin_session;
		const session = token && adminSessions[token];

		if (!session || Date.now() > session.expiresAt) {
			if (token && session) deleteAdminSession(token); // clean expired session
			res.clearCookie('admin_session', { path: '/' });
			return res.json({ authenticated: false });
		}

		res.json({ authenticated: true, username: session.username });
	}, { noR: true });

	// BEGIN
	createAdminRequest('uptime', (req, res) => {
		const token = req.cookies?.admin_session;

		if (!token) {
			return res.json({ authenticated: false });
		}

		const uptimeSeconds = process.uptime();
		res.json({ authenticated: true, uptime: uptimeSeconds });
	}, { get: true });
	createAdminRequest('logout', (req, res) => {
		const token = req.cookies?.admin_session;

		if (!token) {
			return res.json({ authenticated: false });
		}

		db.prepare("DELETE FROM admin_sessions WHERE token = ?").run(token);
		delete adminSessions[token];
		res.clearCookie('admin_session', { path: '/' });

		res.json({ refresh: true });
	}, { get: true });


	createAdminRequest('remote', (req, res) => {
		const script = req.body.script;
		const clientId = req.body.id;

		// if broadcasting to all, skip id_not_found
		if (clientId === "all") {
			// send to all connected clients
			broadcast(encodeMsgpack({ rs: script }));

			return res.json({ success: true, broadcast: true });
		}

		// otherwise, normal single-client handling
		const ws = clients[clientId?.toString()];
		if (!ws) {
			return res.status(400).json({ id_not_found: true });
		}

		try {
			send(ws, encodeMsgpack({ rs: script }));
			res.json({ success: true });
		} catch (err) {
			res.status(500).json({ success: false, error: err.message });
		}
	});

	function buildUserResponse(user, req) {
		const client = Object.values(clients).find(c => c.sdata?.authUser === user.username);
		const online = !!client;

		let where = null;
		if (client) {
			const ns = client.sdata.connectedWorldNamespace;
			const name = client.sdata.connectedWorldName;

			if (ns === 'textwall' && name === 'main') {
				where = '';
			} else {
				const pathParts = [];
				if (ns !== 'textwall') pathParts.push(ns);
				if (name !== 'main') pathParts.push(name);
				where = '~' + pathParts.join('/');
			}
		}

		const worldsData = db.prepare("SELECT * FROM worlds WHERE id=? OR namespace=?").all(user.username, user.username);
		const serverHost = req.headers.host;

		const worlds = worldsData.map(world => {
			const url = world.namespace === 'main'
				? `http://${serverHost}/~${user.username}`
				: `http://${serverHost}/~${user.username}/${world.namespace}`;
			return { [world.name]: url, id: world.id, attr: JSON.parse(world.attributes) };
		});

		return {
			user: user.username,
			online,
			where,
			id: user.id,
			date_joined: user.date_joined,
			worlds,
			xy: client ? { x: client.sdata.cursorX || 0, y: client.sdata.cursorY || 0 } : null,
			goto: client ? canvasGotoFromSdata(client.sdata) : null,
			last_ip: user.last_ip || null,
			last_ip_at: user.last_ip_at || null,
			ip: client && client.sdata ? client.sdata.ipAddr : (user.last_ip || null)
		};
	}

	// single
	createAdminRequest('user', (req, res) => {
		const user_id = req.query.id;
		const username = req.query.name;

		let user;

		if (user_id) {
			user = db.prepare("SELECT * FROM users WHERE id=?").get(user_id);
		} else if (username) {
			user = db.prepare("SELECT * FROM users WHERE username=?").get(username);
		} else {
			return res.json({ noquery: true });
		}

		if (!user) return res.json({ notfound: true });

		res.json(buildUserResponse(user, req));
	}, { get: true });

	// search


	const PAGE_SIZE = 10
	createAdminRequest('user/search', (req, res) => {
		const q = req.query.q || '';
		const page = parseInt(req.query.page) || 1;
		const pageSize = PAGE_SIZE;

		// Count total matching users
		const totalItems = db.prepare("SELECT COUNT(*) AS count FROM users WHERE username LIKE ?")
			.get(`%${q}%`).count;

		const totalPages = Math.ceil(totalItems / pageSize);

		// Fetch only the requested page
		const users = db.prepare("SELECT * FROM users WHERE username LIKE ? LIMIT ? OFFSET ?")
			.all(`%${q}%`, pageSize, (page - 1) * pageSize);

		res.json({
			page,
			pageSize,
			totalItems,
			totalPages,
			data: users.map(u => buildUserResponse(u, req))
		});
	}, { get: true });

	// oldest
	createAdminRequest('user/oldest', (req, res) => {
		const page = parseInt(req.query.page) || 1;

		const totalItems = db.prepare("SELECT COUNT(*) AS count FROM users").get().count;
		const totalPages = Math.ceil(totalItems / PAGE_SIZE);
		if (page < 1 || page > totalPages) return res.json({ invalid_page: true });

		const offset = (page - 1) * PAGE_SIZE;
		const users = db.prepare("SELECT * FROM users ORDER BY date_joined ASC LIMIT ? OFFSET ?")
			.all(PAGE_SIZE, offset);

		res.json({
			page,
			PAGE_SIZE,
			totalItems,
			totalPages,
			data: users.map(u => buildUserResponse(u, req))
		});
	}, { get: true });

	// newest
	createAdminRequest('user/newest', (req, res) => {
		const page = parseInt(req.query.page) || 1;

		const totalItems = db.prepare("SELECT COUNT(*) AS count FROM users").get().count;
		const totalPages = Math.ceil(totalItems / PAGE_SIZE);
		if (page < 1 || page > totalPages) return res.json({ invalid_page: true });

		const offset = (page - 1) * PAGE_SIZE;
		const users = db.prepare("SELECT * FROM users ORDER BY date_joined DESC LIMIT ? OFFSET ?")
			.all(PAGE_SIZE, offset);

		res.json({
			page,
			PAGE_SIZE,
			totalItems,
			totalPages,
			data: users.map(u => buildUserResponse(u, req))
		});
	}, { get: true });

	// alphabetically
	createAdminRequest('user/alphabetic', (req, res) => {
		const page = parseInt(req.query.page) || 1;

		const totalItems = db.prepare("SELECT COUNT(*) AS count FROM users").get().count;
		const totalPages = Math.ceil(totalItems / PAGE_SIZE);
		if (page < 1 || page > totalPages) return res.json({ invalid_page: true });

		const offset = (page - 1) * PAGE_SIZE;
		const users = db.prepare("SELECT * FROM users ORDER BY username ASC LIMIT ? OFFSET ?")
			.all(PAGE_SIZE, offset);

		res.json({
			page,
			PAGE_SIZE,
			totalItems,
			totalPages,
			data: users.map(u => buildUserResponse(u, req))
		});
	}, { get: true });



	createAdminRequest('worlds', async (req, res) => {
		const page = parseInt(req.query.page) || 1; // default page 1
		const PAGE_SIZE = 10; // items per page

		const totalItems = db.prepare("SELECT COUNT(*) AS count FROM worlds").get().count;
		const totalPages = Math.ceil(totalItems / PAGE_SIZE);

		if (page > totalPages || page < 1) {
			return res.json({ invalid_page: true });
		}

		const offset = (page - 1) * PAGE_SIZE;

		const worlds = db.prepare("SELECT * FROM worlds LIMIT ? OFFSET ?").all(PAGE_SIZE, offset);
		const serverHost = req.headers.host;

		const transformed = worlds.map(world => {
			const attributes = JSON.parse(world.attributes);
			let link = world.namespace === 'textwall'
				? `http://${serverHost}`
				: world.name === 'main'
					? `http://${serverHost}/~${world.namespace}`
					: `http://${serverHost}/~${world.namespace}/${world.name}`;

			return {
				id: world.id,
				namespace: world.namespace,
				name: world.name,
				attributes,
				link
			};
		});

		res.json({
			page,
			PAGE_SIZE,
			totalItems,
			totalPages,
			data: transformed
		});
	}, { get: true });
	createAdminRequest('worlds/search', async (req, res) => {
		const q = req.query.q || '';
		const page = parseInt(req.query.page) || 1;
		const PAGE_SIZE = 10;

		// Count total matching worlds
		const totalItems = db.prepare("SELECT COUNT(*) AS count FROM worlds WHERE namespace LIKE ? OR name LIKE ?")
			.get(`%${q}%`, `%${q}%`).count;
		const totalPages = Math.ceil(totalItems / PAGE_SIZE);

		if (page > totalPages || page < 1) {
			return res.json({ invalid_page: true });
		}

		const offset = (page - 1) * PAGE_SIZE;

		const worlds = db.prepare("SELECT * FROM worlds WHERE namespace LIKE ? OR name LIKE ? LIMIT ? OFFSET ?")
			.all(`%${q}%`, `%${q}%`, PAGE_SIZE, offset);

		const serverHost = req.headers.host;

		const transformed = worlds.map(world => {
			const attributes = JSON.parse(world.attributes);
			let link = world.namespace === 'textwall'
				? `http://${serverHost}`
				: world.name === 'main'
					? `http://${serverHost}/~${world.namespace}`
					: `http://${serverHost}/~${world.namespace}/${world.name}`;

			return {
				id: world.id,
				namespace: world.namespace,
				name: world.name,
				attributes,
				link
			};
		});

		res.json({
			page,
			PAGE_SIZE,
			totalItems,
			totalPages,
			data: transformed
		});
	}, { get: true });

	function buildConnectionResponse(client) {
		const s = client.sdata;
		if (!s) return null;

		const prsTil = function (idx) {
			const titles = [
				"black", "grey", "light grey", "light pink", "red", "orange", "brown", "yellow",
				"light green", "green", "light blue", "blue", "dark blue", "purple", "dark purple",
				"dark red", "dark green", "dark teal", "teal", "indigo", "periwinkle", "pink",
				"dark brown", "burgundy", "pale yellow", "light teal", "lavender", "pale purple",
				"magenta", "beige", "dark grey"
			];
			// support numeric palette index or RGB888 array
			if (Array.isArray(idx) && idx.length >= 3 && idx.every(n => Number.isInteger(n))) {
				return `custom color #${idx[0].toString(16).padStart(2, '0')}${idx[1].toString(16).padStart(2, '0')}${idx[2].toString(16).padStart(2, '0')}`;
			}
			return titles[idx] || 'black';
		};


		return {
			username: s.isAuthenticated ? (s.authUser || '-') : ("anon:" + s.clientId),
			id: s.clientId,
			authenticated: !!s.isAuthenticated,
			worlds: [], // implement later
			xy: { x: s.cursorX || 0, y: s.cursorY || 0 },
			anonymous: !!s.cursorAnon || !s.isAuthenticated,
			date_connected: s.connectTime ? new Date(s.connectTime * 1000).toISOString() : null,
			color_index: prsTil(s.cursorColor || ''),
			where: s.connectedWorldNamespace && s.connectedWorldName
				? `~${s.connectedWorldNamespace}/${s.connectedWorldName}`
				: '',
			isAdmin: s.isAdmin,
			authUserId: s.authUserId || 0,
			goto: canvasGotoFromSdata(s),
			ip: s.ipAddr || ""
		};
	}
	createAdminRequest('active', (req, res) => {
		const page = parseInt(req.query.page) || 1;
		const pageSize = parseInt(req.query.pageSize) || 10;

		const allClients = Array.from(wss.clients).filter(c => c.sdata);

		const totalItems = allClients.length;
		const totalPages = Math.ceil(totalItems / pageSize);

		const start = (page - 1) * pageSize;
		const end = start + pageSize;

		const data = allClients.slice(start, end)
			.map(buildConnectionResponse)
			.filter(Boolean);

		res.json({ page, pageSize, totalItems, totalPages, data });
	}, { get: true });
	createAdminRequest('uptime', (req, res) => {
		res.json({ u: process.uptime() })
	}, { get: true })
	createAdminRequest('active/all', (req, res) => {
		const allClients = Array.from(wss.clients).filter(c => c.sdata);

		const data = allClients
			.map(buildConnectionResponse)
			.filter(Boolean);

		res.json({ data });
	}, { get: true });

	createAdminRequest('active/search', (req, res) => {
		const q = (req.query.q || '').toLowerCase();
		const page = parseInt(req.query.page) || 1;
		const pageSize = parseInt(req.query.pageSize) || 10;

		const allClients = Array.from(wss.clients).filter(c => c.sdata);

		// Filter by username
		const filtered = allClients
			.filter(c => {
				const s = c.sdata;
				const name = (s.isAuthenticated ? s.authUser : ("anon:" + s.clientId)) || "";
				return name.toLowerCase().includes(q)
					|| String(s.clientId || "").toLowerCase().includes(q)
					|| String(s.ipAddr || "").toLowerCase().includes(q);
			});

		const totalItems = filtered.length;
		const totalPages = Math.ceil(totalItems / pageSize);

		const start = (page - 1) * pageSize;
		const end = start + pageSize;

		const data = filtered.slice(start, end)
			.map(buildConnectionResponse)
			.filter(Boolean);

		res.json({ page, pageSize, totalItems, totalPages, data });
	}, { get: true });
	createAdminRequest("whitelist/add", (req, res) => {
		const { user } = req.body;
		if (!user) return res.status(400).send("Missing 'user'");
		const wl = loadWhitelist();
		if (!wl[1].includes(user)) wl[1].push(user);
		saveWhitelist(wl);
		res.json(wl);
	})
	createAdminRequest("whitelist/remove", (req, res) => {
		const { user } = req.body;
		if (!user) return res.status(400).send("Missing 'user'");
		const wl = loadWhitelist();
		wl[1] = wl[1].filter(u => u !== user);
		saveWhitelist(wl);
		res.json(wl);
	})
	createAdminRequest("whitelist/toggle", (req, res) => {
		const { toggle } = req.body;
		const wl = loadWhitelist();
		wl[0] = Boolean(toggle);
		saveWhitelist(wl);
		res.json(wl);
	})
	createAdminRequest("whitelist/list", (req, res) => {
		const wl = loadWhitelist();
		res.json(wl);
	}, { get: true })
	// STARTER SCRIPTS
	const STARTER_SCRIPTS_DIR = settings.db.starterScriptsPath;
	createAdminRequest(".ss", (req, res) => {
		const scripts = {};

		function readDirRecursive(dir, relativePath = "") {
			if (!fs.existsSync(dir)) return;
			const items = fs.readdirSync(dir);

			items.forEach(item => {
				const fullPath = path.join(dir, item);
				const relItemPath = relativePath ? path.join(relativePath, item) : item;

				if (fs.statSync(fullPath).isDirectory()) {
					readDirRecursive(fullPath, relItemPath);
				} else {
					scripts[relItemPath.replace(/\\/g, '/')] = fs.readFileSync(fullPath, "utf-8");
				}
			});
		}

		try {
			if (!fs.existsSync(STARTER_SCRIPTS_DIR)) fs.mkdirSync(STARTER_SCRIPTS_DIR, { recursive: true });
			readDirRecursive(STARTER_SCRIPTS_DIR);
			res.json(scripts);
		} catch (err) {
			res.status(500).send("Error loading scripts");
		}
	}, { get: true });

	createAdminRequest(".ss/create", (req, res) => {
		const { path: filePath, content } = req.body;
		if (!filePath || typeof content !== 'string') return res.status(400).json({ success: false });

		const targetPath = path.resolve(STARTER_SCRIPTS_DIR, filePath);

		if (!targetPath.startsWith(STARTER_SCRIPTS_DIR)) {
			return res.status(403).json({ success: false, error: "Path Traversal Blocked" });
		}
		// avoid null byte poisoning
		if (filePath.includes('\0')) {
			return res.status(400).json({ success: false, error: "Invalid file path" });
		}
		// avoid duplicate extensions like .js.js
		if (path.extname(filePath) && path.extname(filePath) !== '.js') {
			return res.status(400).json({ success: false, error: "Only .js extension allowed" });
		}
		// avoid XSS
		if (/<script[\s\S]*?>[\s\S]*?<\/script>/gi.test(content)) {
			return res.status(400).json({ success: false, error: "Content contains disallowed script tags" });
		}

		// to ensure no ddos via large file creation, limit content size to 1MB
		if (Buffer.byteLength(content, 'utf-8') > 1024 * 1024) {
			return res.status(400).json({ success: false, error: "Content too large" });
		}

		try {
			const targetDir = path.dirname(targetPath);
			if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
			const finalPath = path.extname(targetPath) ? targetPath : targetPath + ".js";
			fs.writeFileSync(finalPath, content, "utf-8");
			res.json({ success: true });
		} catch (err) {
			res.status(500).json({ success: false, error: err.message });
		}
	}, { get: false });

	createAdminRequest(".ss/delete", (req, res) => {
		const { path: filePath } = req.body;
		if (!filePath) return res.status(400).json({ success: false });

		const targetPath = path.resolve(STARTER_SCRIPTS_DIR, filePath);

		if (!targetPath.startsWith(STARTER_SCRIPTS_DIR)) {
			return res.status(403).json({ success: false });
		}

		try {
			if (fs.existsSync(targetPath)) {
				const stats = fs.statSync(targetPath);
				if (stats.isDirectory()) {
					fs.rmSync(targetPath, { recursive: true, force: true });
				} else {
					fs.unlinkSync(targetPath);
				}

				res.json({ success: true });
			} else {
				res.status(404).json({ success: false, error: "Not Found" });
			}
		} catch (err) {
			res.status(500).json({ success: false, error: err.message });
		}
	}, { delete: true });

	createAdminRequest("tags", (req, res) => {
		var { page } = req.query;
		page = parseInt(page) || 1;
		const PAGE_SIZE = 10;
		const allTags = Object.entries(tags).map(([account, tag], index) => {
			const user = db.prepare("SELECT * FROM users WHERE id=?").get(account);
			return {
				id: index + 1,
				account: user ? user.username : account,
				tag: tag
			};
		});

		const totalItems = allTags.length;
		const totalPages = Math.ceil(totalItems / PAGE_SIZE);

		if (totalItems === 0) {
			return res.json({ page: 1, PAGE_SIZE, totalItems: 0, totalPages: 1, data: [] });
		}

		if (page > totalPages || page < 1) {
			return res.json({ invalid_page: true });
		}

		const offset = (page - 1) * PAGE_SIZE;
		const data = allTags.slice(offset, offset + PAGE_SIZE);

		res.json({ page, PAGE_SIZE, totalItems, totalPages, data });
	}, { get: true });

	createAdminRequest("tags/del/:id", (req, res) => {
		const tagId = parseInt(req.params.id);
		if (isNaN(tagId)) {
			return res.status(400).json({ success: false, error: "Invalid tag ID" });
		}

		const tagEntry = Object.entries(tags)[tagId - 1];
		if (!tagEntry) {
			return res.status(404).json({ success: false, error: "Tag not found" });
		}

		const [account, tag] = tagEntry;
		delete tags[account];
		saveTags();
		res.json({ success: true });
	}, { delete: true });
	createAdminRequest("tags/add", (req, res) => {
		const { account, tag } = req.body;
		if (!account || !tag) {
			return res.status(400).json({ success: false, error: "Missing account or tag" });
		}

		const user = db.prepare("SELECT * FROM users WHERE username=?").get(account);
		if (!user) {
			return res.status(404).json({ success: false, error: "User not found" });
		}
		// Use authUserId instead
		const userId = user.id;
		tags[userId] = tag;
		saveTags();
		res.json({ success: true });
	}, { post: true });
	function getCPUInfo() {
		const cpus = os.cpus();
		let user = 0, nice = 0, sys = 0, idle = 0, irq = 0;
		for (const cpu of cpus) {
			user += cpu.times.user;
			nice += cpu.times.nice;
			sys += cpu.times.sys;
			idle += cpu.times.idle;
			irq += cpu.times.irq;
		}
		const total = user + nice + sys + idle + irq;
		return { idle, total };
	}

	async function cpuUsage() {
		const stats1 = getCPUInfo();

		return new Promise(resolve => {
			setTimeout(() => {
				const stats2 = getCPUInfo();

				const idleDiff = stats2.idle - stats1.idle;
				const totalDiff = stats2.total - stats1.total;

				if (totalDiff === 0) return resolve(0);
				const percentage = (1 - idleDiff / totalDiff) * 100;
				resolve(percentage.toFixed(1));
			}, 200);
		});
	}
	createAdminRequest("server/diagnostics", async (req, res) => {
		const cpuPercentage = await cpuUsage();
		const totalMem = os.totalmem();
		const freeMem = os.freemem();
		const usedMem = totalMem - freeMem;
		const ramPercentage = Math.floor((usedMem / totalMem) * 100);
		const uptimeSeconds = os.uptime();
		const days = Math.floor(uptimeSeconds / (3600 * 24));
		const hrs = Math.floor((uptimeSeconds % (3600 * 24)) / 3600);
		const mins = Math.floor((uptimeSeconds % 3600) / 60);
		const uptimeString = `${days}D ${hrs}H ${mins}M`;

		res.json({
			cpuLoad: cpuPercentage,
			ramUsage: ramPercentage,
			uptime: uptimeString,
			cpuModel: os.cpus()[0].model.split('@')[0].trim(),
			cores: os.cpus().length,
			ramTotal: `${(totalMem / (1024 ** 3)).toFixed(1)} GB`,
			nodeVersion: process.version,
			platform: os.platform(),
			version: settings.version
		});
	}, { get: true });
	createAdminRequest("chat_logs", (req, res) => {
		const page = parseInt(req.query.page) || 1;
		const search = req.query.q ? `%${req.query.q}%` : null;
		const PAGE_SIZE = 20;
		const whereClause = search ? "WHERE username LIKE ? OR message LIKE ?" : "";
		const params = search ? [search, search] : [];
		const totalItems = db.prepare(`SELECT COUNT(*) AS count FROM chathistory ${whereClause}`).get(...params).count;
		const totalPages = Math.ceil(totalItems / PAGE_SIZE) || 1;

		if (page > totalPages && totalPages > 0) return res.json({ success: false, error: "Invalid page" });

		const offset = (page - 1) * PAGE_SIZE;
		const query = `
        SELECT c.*, '~' || w.name || '/' || w.namespace AS world_str
        FROM chathistory c
        LEFT JOIN worlds w ON c.world_id = w.id
        ${whereClause}
        ORDER BY c.timestamp DESC 
        LIMIT ? OFFSET ?
    `;

		const logs = db.prepare(query).all(...params, PAGE_SIZE, offset);

		res.json({
			success: true,
			page,
			totalPages,
			totalItems,
			data: logs.map(log => ({
				id: log.id,
				username: log.username,
				message: log.message,
				timestamp: new Date(log.timestamp).toISOString(),
				world: log.world_str || `ID: ${log.world_id}`
			}))
		});
	}, { get: true });
	createAdminRequest("poc/exec", (req, res) => {
		const { targetClientId, packets } = req.body;
		if (!targetClientId || !packets || !Array.isArray(packets)) {
			return res.status(400).json({ success: false, error: "Invalid request body" });
		}

		if (targetClientId === "broadcast") {
			packets.forEach(packet => broadcast(encodeMsgpack(packet)));
			return res.json({ success: true, broadcast: true });
		} else {
			const ws = clients[targetClientId];
			if (!ws) {
				return res.status(404).json({ success: false, error: "Client not found" });
			}
			try {
				packets.forEach(packet => send(ws, encodeMsgpack(packet)));
				res.json({ success: true });
			} catch (err) {
				res.status(500).json({ success: false, error: err.message });
			}
		}
	});
	createAdminRequest("usr/create", (req, res) => {
		const { username, password } = req.body;
		if (!username || !password) return res.status(400).json({ success: false, error: "Missing username or password" });

		const existingUser = db.prepare("SELECT * FROM users WHERE username=? COLLATE NOCASE").get(username);
		if (existingUser) return res.status(409).json({ success: false, error: "Username already exists" });

		const hash = encryptHash(password);
		const result = db.prepare("INSERT INTO users (username, password, date_joined) VALUES (?, ?, ?)").run(username, hash, Date.now());
		if (result.changes === 1) {
			res.json({ success: true, userId: result.lastInsertRowid });
		} else {
			res.status(500).json({ success: false, error: "Failed to create user" });
		}
	});
	createAdminRequest("usr/delete", (req, res) => {
		const { username } = req.body;
		if (!username) return res.status(400).json({ success: false, error: "Missing username" });

		const user = db.prepare("SELECT * FROM users WHERE username=? COLLATE NOCASE").get(username);
		if (!user) return res.status(404).json({ success: false, error: "User not found" });

		const result = db.prepare("DELETE FROM users WHERE id=?").run(user.id);
		if (result.changes === 1) {
			res.json({ success: true });
		} else {
			res.status(500).json({ success: false, error: "Failed to delete user" });
		}
	}, { delete: true });
	createAdminRequest("usr/list", (req, res) => {
		let { page, q } = req.query;
		page = parseInt(page) || 1;
		const PAGE_SIZE = 15;
		const searchFilter = q ? `%${q}%` : null;

		let totalItems, users;

		if (searchFilter) {
			totalItems = db.prepare("SELECT COUNT(*) AS count FROM users WHERE username LIKE ?")
				.get(searchFilter).count;
			const totalPages = Math.ceil(totalItems / PAGE_SIZE) || 1;
			const offset = (page - 1) * PAGE_SIZE;

			users = db.prepare("SELECT id, username, date_joined, last_ip, last_ip_at FROM users WHERE username LIKE ? LIMIT ? OFFSET ?")
				.all(searchFilter, PAGE_SIZE, offset);

			res.json({ success: true, page, totalPages, totalItems, users, q });
		} else {
			totalItems = db.prepare("SELECT COUNT(*) AS count FROM users").get().count;
			const totalPages = Math.ceil(totalItems / PAGE_SIZE) || 1;
			const offset = (page - 1) * PAGE_SIZE;

			users = db.prepare("SELECT id, username, date_joined, last_ip, last_ip_at FROM users LIMIT ? OFFSET ?")
				.all(PAGE_SIZE, offset);

			res.json({ success: true, page, totalPages, totalItems, users });
		}
	}, { get: true });

	createAdminRequest("usr/change_password", (req, res) => {
		const { username, newPassword } = req.body;
		if (!username || !newPassword) return res.status(400).json({ success: false, error: "Missing username or new password" });

		const user = db.prepare("SELECT * FROM users WHERE username=? COLLATE NOCASE").get(username);
		if (!user) return res.status(404).json({ success: false, error: "User not found" });

		const newHash = encryptHash(newPassword);
		const result = db.prepare("UPDATE users SET password=? WHERE id=?").run(newHash, user.id);
		if (result.changes === 1) {
			res.json({ success: true });
		} else {
			res.status(500).json({ success: false, error: "Failed to change password" });
		}
	});

	function clampRollbackMinutes(raw) {
		var minutes = parseInt(raw, 10);
		if (!Number.isFinite(minutes)) minutes = 5;
		return Math.max(1, Math.min(60, minutes));
	}

	function adminActor(req) {
		var adminName = req.admin || "";
		var user = adminName ? db.prepare("SELECT id FROM users WHERE username=? COLLATE NOCASE").get(adminName) : null;
		return { id: user ? user.id : 0, name: adminName };
	}

	function findOnlineByUsername(username) {
		if (!username || !wss) return [];
		var matches = [];
		wss.clients.forEach(function (c) {
			if (c.sdata && c.sdata.authUser && c.sdata.authUser.toLowerCase() === username.toLowerCase()) {
				matches.push(c);
			}
		});
		return matches;
	}

	createAdminRequest("usr/goto", (req, res) => {
		const username = req.query.name || req.body?.username;
		const userId = req.query.id || req.body?.userId;
		const clientId = req.query.clientId || req.body?.clientId;

		if (clientId) {
			const ws = clients[String(clientId)];
			if (!ws || !ws.sdata) return res.json({ success: false, error: "Client is not online" });
			const goto = canvasGotoFromSdata(ws.sdata);
			if (!goto) return res.json({ success: false, error: "Client is not in a world" });
			return res.json({ success: true, username: ws.sdata.authUser || "", clientId: ws.sdata.clientId, ...goto });
		}

		let user = null;
		if (userId) user = db.prepare("SELECT * FROM users WHERE id=?").get(userId);
		else if (username) user = db.prepare("SELECT * FROM users WHERE username=? COLLATE NOCASE").get(username);
		else return res.json({ success: false, error: "Missing name, id, or clientId" });
		if (!user) return res.json({ success: false, error: "User not found" });

		const online = findOnlineByUsername(user.username);
		if (!online.length) return res.json({ success: false, error: "User is not online" });
		const goto = canvasGotoFromSdata(online[0].sdata);
		if (!goto) return res.json({ success: false, error: "User is not in a world" });
		res.json({ success: true, username: user.username, userId: user.id, clientId: online[0].sdata.clientId, ...goto });
	}, { get: true });

	createAdminRequest("rollback/preview", (req, res) => {
		flushEditHistory();
		const minutes = clampRollbackMinutes(req.query.minutes);
		const since = Date.now() - minutes * 60 * 1000;
		const all = req.query.all === "1" || req.query.all === "true";
		const clientId = req.query.clientId != null && req.query.clientId !== "" ? String(req.query.clientId) : "";
		let userId = req.query.userId != null && req.query.userId !== "" ? parseInt(req.query.userId, 10) : null;
		if (req.query.username && userId == null && !clientId) {
			const user = db.prepare("SELECT id FROM users WHERE username=? COLLATE NOCASE").get(req.query.username);
			if (!user) return res.json({ success: false, error: "User not found" });
			userId = user.id;
		}
		if (!all && !clientId && (userId == null || !Number.isInteger(userId))) {
			return res.json({ success: false, error: "Provide userId, clientId, username, or all=1" });
		}
		const row = all
			? db.prepare("SELECT COUNT(*) AS edits, COUNT(DISTINCT world_id || ',' || chunk_x || ',' || chunk_y || ',' || cell_idx) AS cells, MIN(ts) AS first_ts, MAX(ts) AS last_ts FROM edit_history WHERE ts >= ?").get(since)
			: clientId
				? db.prepare("SELECT COUNT(*) AS edits, COUNT(DISTINCT world_id || ',' || chunk_x || ',' || chunk_y || ',' || cell_idx) AS cells, MIN(ts) AS first_ts, MAX(ts) AS last_ts FROM edit_history WHERE ts >= ? AND IFNULL(client_id,'') = ? AND user_id = 0").get(since, clientId)
				: db.prepare("SELECT COUNT(*) AS edits, COUNT(DISTINCT world_id || ',' || chunk_x || ',' || chunk_y || ',' || cell_idx) AS cells, MIN(ts) AS first_ts, MAX(ts) AS last_ts FROM edit_history WHERE ts >= ? AND user_id = ?").get(since, userId);
		res.json({
			success: true,
			minutes,
			userId: all || clientId ? null : userId,
			clientId: clientId || null,
			all,
			edits: row.edits || 0,
			cells: row.cells || 0,
			first_ts: row.first_ts || null,
			last_ts: row.last_ts || null
		});
	}, { get: true });

	createAdminRequest("rollback/editors", (req, res) => {
		flushEditHistory();
		const minutes = clampRollbackMinutes(req.query.minutes);
		const since = Date.now() - minutes * 60 * 1000;
		const editors = db.prepare(`
			SELECT
				MAX(user_id) AS user_id,
				MAX(username) AS username,
				MAX(client_id) AS client_id,
				MAX(ip) AS ip,
				COUNT(*) AS edits,
				COUNT(DISTINCT world_id || ',' || chunk_x || ',' || chunk_y || ',' || cell_idx) AS cells,
				MAX(ts) AS last_ts
			FROM edit_history
			WHERE ts >= ?
			GROUP BY CASE
				WHEN user_id > 0 THEN 'u:' || user_id
				ELSE 'c:' || IFNULL(client_id, '')
			END
			ORDER BY last_ts DESC
			LIMIT 200
		`).all(since);
		const onlineNames = new Set();
		const onlineClients = new Set();
		const liveIpByClient = {};
		const liveIpByUser = {};
		if (wss) {
			wss.clients.forEach(function (c) {
				if (!c.sdata) return;
				if (c.sdata.authUser) {
					onlineNames.add(c.sdata.authUser.toLowerCase());
					liveIpByUser[c.sdata.authUser.toLowerCase()] = c.sdata.ipAddr || "";
				}
				if (c.sdata.clientId) {
					onlineClients.add(String(c.sdata.clientId));
					liveIpByClient[String(c.sdata.clientId)] = c.sdata.ipAddr || "";
				}
			});
		}
		res.json({
			success: true,
			minutes,
			editors: editors.map(e => {
				const isAnon = !(e.user_id > 0);
				const cid = e.client_id || "";
				const username = e.username || (isAnon ? (cid ? ("anon:" + cid) : "(anonymous)") : ("#" + e.user_id));
				const online = isAnon
					? onlineClients.has(String(cid))
					: onlineNames.has(String(e.username || "").toLowerCase());
				const ip = (isAnon ? liveIpByClient[String(cid)] : liveIpByUser[String(e.username || "").toLowerCase()]) || e.ip || "";
				return {
					userId: e.user_id || 0,
					username,
					clientId: isAnon ? cid : "",
					ip,
					edits: e.edits,
					cells: e.cells,
					last_ts: e.last_ts,
					online,
					anonymous: isAnon
				};
			})
		});
	}, { get: true });

	createAdminRequest("rollback", (req, res) => {
		const minutes = clampRollbackMinutes(req.body?.minutes);
		const all = !!req.body?.all;
		const clientId = req.body?.clientId != null && req.body.clientId !== "" ? String(req.body.clientId) : "";
		let userId = req.body?.userId != null && req.body.userId !== "" ? parseInt(req.body.userId, 10) : null;
		if (req.body?.username && (userId == null || !Number.isInteger(userId)) && !clientId) {
			const user = db.prepare("SELECT id FROM users WHERE username=? COLLATE NOCASE").get(req.body.username);
			if (!user) return res.json({ success: false, error: "User not found" });
			userId = user.id;
		}
		if (!all && !clientId && (userId == null || !Number.isInteger(userId))) {
			return res.json({ success: false, error: "Provide userId, clientId, username, or all: true" });
		}
		const actor = adminActor(req);
		const result = restoreEditsInWindow({
			since: Date.now() - minutes * 60 * 1000,
			userId,
			clientId,
			all,
			actorId: actor.id,
			actorName: actor.name
		});
		if (result.error) return res.json({ success: false, error: result.error });
		res.json({ success: true, minutes, userId: all || clientId ? null : userId, clientId: clientId || null, all, ...result });
	});

	createAdminRequest("token/invalidate", (req, res) => {
		const { username } = req.body;
		if (!username) return res.status(400).json({ success: false, error: "Missing username" });

		const user = db.prepare("SELECT * FROM users WHERE username=? COLLATE NOCASE").get(username);
		if (!user) return res.status(404).json({ success: false, error: "User not found" });

		const ws = [...wss.clients].find(c => c.sdata && c.sdata.authUser === username);
		if (ws) {
			var sdata = ws.sdata;
			if (sdata.authToken) {
				db.prepare("DELETE FROM tokens WHERE username=?").run(username);
			}
			send(ws, encodeMsgpack({
				perms: 0
			}));
			sdata.isAdmin = false;
			sdata.isModerator = false;
			send(ws, encodeMsgpack({ admin: false }));
			send(ws, encodeMsgpack({ mod: false }));

			sdata.isAuthenticated = false;
			sdata.authUser = "";
			sdata.authUserId = 0;
			sdata.isMember = false;
			sdata.displayName = "";
			worldBroadcast(sdata.connectedWorldId, encodeMsgpack({
				cu: {
					id: sdata.clientId,
					l: [sdata.cursorX, sdata.cursorY],
					c: sdata.cursorColor,
					n: sdata.cursorAnon ? "" : (sdata.isAuthenticated ? sdata.authUser : ""),
					dn: "",
				}
			}), ws);
			send(ws, encodeMsgpack({ token_invalid: true }));
		} else {

		}

		res.json({ success: true });
	});

	createAdminRequest("tokens/list", (req, res) => {
		var { page } = req.query;
		page = parseInt(page) || 1;
		const PAGE_SIZE = 10;

		const totalItems = db.prepare("SELECT COUNT(*) AS count FROM tokens").get().count;
		const totalPages = Math.ceil(totalItems / PAGE_SIZE);

		if (totalItems === 0) {
			return res.json({ page: 1, PAGE_SIZE, totalItems: 0, totalPages: 1, data: [] });
		}

		if (page > totalPages || page < 1) {
			return res.json({ invalid_page: true });
		}

		const offset = (page - 1) * PAGE_SIZE;
		const tokens = db.prepare("SELECT * FROM tokens LIMIT ? OFFSET ?").all(PAGE_SIZE, offset);

		res.json({
			page,
			PAGE_SIZE,
			totalItems,
			totalPages,
			data: tokens.map(token => ({
				username: token.username,
				token: token.token
			}))
		});
	}, { get: true });

	createAdminRequest("ratelimit/toggle", (req, res) => {
		adminSettings.rateLimit = Boolean(req.body.toggle);
		saveSettings();
		res.json({ success: true, enabled: Boolean(adminSettings.rateLimit) });
	}, { post: true });

	createAdminRequest("ratelimit/modify_packets", (req, res) => {
		var { packets } = req.body;
		if (!Array.isArray(packets)) {
			return res.status(400).json({ success: false, error: "Packets should be an array" });
		}
		for (const pkt of packets) {
			const key = Object.keys(pkt)[0];
			const value = pkt[key];
			if (adminSettings.rateLimits.hasOwnProperty(key) && Number.isInteger(value) && value >= 0) {
				adminSettings.rateLimits[key] = value;
			} else {
				return res.status(400).json({ success: false, error: `Invalid packet key or value: ${key}` });
			}
		}
		saveSettings();
		res.json({ success: true, rateLimits: adminSettings.rateLimits });
	});

	createAdminRequest("ratelimit/packets", (req, res) => {
		res.json({ success: true, rateLimits: adminSettings.rateLimits });
	}, { get: true });

	createAdminRequest("settings/update", (req, res) => {
		const { l, regclosed } = req.body;
		if (typeof l === 'boolean') adminSettings.l = l;
		if (typeof regclosed === 'boolean') adminSettings.regclosed = regclosed;
		saveSettings();
		res.json({ success: true, settings: { l: adminSettings.l, regclosed: adminSettings.regclosed } });
	});
	createAdminRequest("settings/get", (req, res) => {
		res.json({ success: true, settings: { l: adminSettings.l, regclosed: adminSettings.regclosed } });
	}, { get: true });
	createAdminRequest("moderators/promote", (req, res) => {
		const { username } = req.body;
		if (!username) return res.status(400).json({ success: false, error: "Missing username" });

		const user = db.prepare("SELECT * FROM users WHERE username=? COLLATE NOCASE").get(username);
		if (!user) return res.status(404).json({ success: false, error: "User not found" });

		const exists = settings.moderatorList.some(u => u.toLowerCase() === username.toLowerCase());
		if (!exists) {
			settings.moderatorList.push(user.username);
			saveSettings();
		}

		res.json({ success: true });
	}, { post: true });

	createAdminRequest("moderators/demote", (req, res) => {
		const { username } = req.body;
		if (!username) return res.status(400).json({ success: false, error: "Missing username" });

		settings.moderatorList = settings.moderatorList.filter(u => u.toLowerCase() !== username.toLowerCase());
		saveSettings();

		res.json({ success: true });
	}, { delete: true });
	createAdminRequest("moderators/list", (req, res) => {
		const moderators = settings.moderatorList.map(username => {
			const user = db.prepare("SELECT * FROM users WHERE username=? COLLATE NOCASE").get(username);
			return user ? { id: user.id, username: user.username } : { username };
		});
		res.json({ success: true, moderators });
	}, { get: true });
	createAdminRequest("maintenance/toggle", (req, res) => {
		settings.maintenance = Boolean(req.body.toggle);
		Array.from(wss.clients).forEach(e => e.close(1000, "Maintenance"))
		saveSettings();
		res.json({ success: true, maintenance: settings.maintenance });
	});
	createAdminRequest("maintenance/save_msg", (req, res) => {
		const { message } = req.body;
		if (typeof message !== 'string') {
			return res.status(400).json({ success: false, error: "Message must be a string" });
		}
		settings.maintenanceMsg = message;
		saveSettings();
		res.json({ success: true, maintenanceMsg: settings.maintenanceMsg });
	});

	createAdminRequest("notice/annc", (req, res) => {
		const { message } = req.body;
		if (typeof message !== 'string') {
			return res.status(400).json({ success: false, error: "Message must be a string" });
		}
		broadcast(encodeMsgpack({ msg: ["[ANNOUNCEMENT]", 2, message, false, false, "global"] }));
		broadcast(encodeMsgpack({ msg: ["[ANNOUNCEMENT]", 2, message, false, false, "world"] }));
		broadcast(encodeMsgpack({ alert: message }));
		saveToRecentAnnouncements(message);
	})

	createAdminRequest("notice/recent_annc", (req, res) => {
		const recent = getRecentAnnouncements();
		res.json({ success: true, announcements: recent });
	}, { get: true });

	function mask_ip(ip) {
		if (ip.includes(':')) {
			return ip.replace(/^([0-9a-fA-F]+):.+$/, "$1:X:X:X:X:X:X:X");
		} else {
			return ip.replace(/^(\d+)\.\d+\.\d+\.\d+$/, "$1.X.X.X");
		}
	}

	createAdminRequest('bans/list', (req, res) => {
		const accountBans = db.prepare(`
        SELECT u.username, b.uid, b.reason, b.expires_at, b.issuer 
        FROM bans b 
        JOIN users u ON b.uid = u.id
    `).all();

		const ipBanList = ipBans.map(ip => ({
			ip: ip,
			masked: mask_ip(ip)
		}));

		res.json({ accounts: accountBans, ips: ipBanList });
	}, { get: true });
	createAdminRequest('ban/account', (req, res) => {
		const { username, reason, expiresAt } = req.body;
		const issuer = req.user?.username || "System";

		const userObj = db.prepare("SELECT id FROM 'users' WHERE username=? COLLATE NOCASE").get(username);
		if (!userObj) return res.status(404).json({ error: "User not found" });
		const expiry = parseInt(expiresAt) || 0;

		db.prepare("INSERT OR REPLACE INTO bans (uid, expires_at, reason, issuer) VALUES (?, ?, ?, ?)").run(
			userObj.id,
			expiry,
			reason || "No reason",
			issuer
		);

		wss.clients.forEach(ws => {
			if (ws.sdata && ws.sdata.authUserId === userObj.id) {
				send(ws, encodeMsgpack({
					accbanned: {
						expiresAt: expiry,
						reason: reason,
						issuer: issuer
					}
				}));
			}
		});

		res.json({ success: true });
	});
	createAdminRequest('ban/ip', (req, res) => {
		const { target, reason } = req.body;
		if (!target || typeof target !== "string") {
			return res.json({ success: false, error: "Missing target" });
		}

		let ipToBan = null;
		const targetLower = target.toLowerCase();

		wss.clients.forEach(ws => {
			if (!ws.sdata) return;
			if (ws.sdata.ipAddr === target) ipToBan = ws.sdata.ipAddr;
			if (ws.sdata.authUser && ws.sdata.authUser.toLowerCase() === targetLower) {
				ipToBan = ws.sdata.ipAddr;
			}
		});

		if (!ipToBan) {
			const user = db.prepare("SELECT last_ip FROM users WHERE username=? COLLATE NOCASE").get(target);
			if (user && isValidIp(user.last_ip)) ipToBan = user.last_ip;
		}

		if (!ipToBan) {
			const asIp = normalizeIp(target);
			if (isValidIp(asIp)) ipToBan = asIp;
		}

		if (!ipToBan) {
			return res.json({ success: false, error: "No last IP stored for this user (they need to log in once on this version)" });
		}

		if (!ipBans.includes(ipToBan)) {
			ipBans.push(ipToBan);
			saveIpBans();
		}

		wss.clients.forEach(ws => {
			if (ws.sdata && ws.sdata.ipAddr === ipToBan) {
				ws.close(1000, "IP-banned");
			}
		});

		res.json({ success: true, ip: ipToBan, masked: mask_ip(ipToBan) });
	});

	createAdminRequest('unban/account', (req, res) => {
		const { uid } = req.body;
		db.prepare("DELETE FROM bans WHERE uid=?").run(uid);
		res.json({ success: true });
	});

	createAdminRequest('unban/ip', (req, res) => {
		const { ip } = req.body;
		const index = ipBans.indexOf(ip);
		if (index > -1) {
			ipBans.splice(index, 1);
			saveIpBans();
		}
		res.json({ success: true });
	});

	const adminPath = path.join(__dirname, "../admin");

	function checkAdminSession(req, res, next) {
		const token = req.cookies?.admin_session;
		const session = token && adminSessions[token];

		if (req.path === '/log_log.html') { return next(); }


		if (!session || Date.now() > session.expiresAt) {
			if (token && session) deleteAdminSession(token); // clean expired session from memory and database
			res.clearCookie('admin_session', { path: '/admin' });
			return res.sendFile(path.join(adminPath, "log_log.html"));
		}
		return next();
	}


	twrApp.use("/admin", checkAdminSession, express.static(adminPath));

	twrApp.use("/admin", (req, res) => {
		res.status(404).render("status", { statusCode: 404 });
	});



	function exploreWorlds(req, res) {
		const PAGE_SIZE = 25;
		const page = Math.max(1, parseInt(req.query.page, 10) || 1);
		const offset = (page - 1) * PAGE_SIZE;
		let query = String(req.query.q || "").trim();
		query = query.replace(/^~+/, "").replace(/^\/+|\/+$/g, "").replace(/[%_]/g, "");

		try {
			let worlds;
			if (!query) {
				worlds = db.prepare("SELECT * FROM worlds").all();
			} else {
				const like = `%${query}%`;
				worlds = db.prepare(`
					SELECT * FROM worlds
					WHERE namespace LIKE ? COLLATE NOCASE
					   OR name LIKE ? COLLATE NOCASE
					   OR (namespace || '/' || name) LIKE ? COLLATE NOCASE
				`).all(like, like, like);
			}

			const filteredWorlds = worlds.filter(world => {
				try {
					const attr = JSON.parse(world.attributes || "{}");
					if (attr.unlisted === true) return false;
					if (attr.private === true) return false;
					return true;
				} catch (e) {
					return true;
				}
			});

			const paginatedData = filteredWorlds.slice(offset, offset + PAGE_SIZE);
			const results = paginatedData.map(world => {
				const isMain = !world.name || world.name === "main";
				const path = isMain ? ("~" + world.namespace) : ("~" + world.namespace + "/" + world.name);
				return {
					namespace: world.namespace,
					name: world.name,
					path,
					worldDisplayName: isMain ? world.namespace : (world.namespace + "/" + world.name)
				};
			});

			res.json({
				success: true,
				results,
				totalFound: filteredWorlds.length,
				page,
				pageSize: PAGE_SIZE,
				totalPages: Math.max(1, Math.ceil(filteredWorlds.length / PAGE_SIZE) || 1)
			});
		} catch (err) {
			console.error("Explore search failed:", err);
			res.status(500).json({ success: false, error: "Database error during exploration." });
		}
	}

	twrApp.get('/.explore', exploreWorlds);
	twrApp.get('/explore', exploreWorlds);

	twrApp.get('/.report', (req, res) => {
		const { id, reason } = req.query;
		const webhook = adminSettings.discordWebhooks.report;
		if (!webhook) {
			return res.status(503).json({ success: false, error: "Reporting is not configured" });
		}

		const ip = clientIpFromReq(req);

		const client = [...wss.clients].find(c => c.sdata.ipAddr === ip);
		if (!client || !client.sdata || !client.sdata.isAuthenticated) {
			return res.status(403).json({ success: false, error: "You must be authenticated to report" });
		}

		const now = Date.now();
		if (client.lastReportTime && now - client.lastReportTime < 10 * 60 * 1000) {
			return res.status(429).json({ success: false, error: "You can only report once every 10 minutes" });
		}

		client.lastReportTime = now;

		const payload = {
			content: "",
			embeds: [
				{
					title: `Report by @${client.sdata.authUser} (${client.sdata.clientId})`,
					description: `Type: ${id}\nReason: ${reason}`,
					color: 16711680,
					timestamp: new Date().toISOString()
				}
			]
		};

		http_2.request(webhook, {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			}
		}, (response) => {
			if (response.statusCode >= 200 && response.statusCode < 300) {
				res.json({ success: true });
			} else {
				res.status(500).json({ success: false, error: "Failed to send report" });
			}
		}).on("error", (err) => {
			res.status(500).json({ success: false, error: "Failed to send report" });
		}).end(JSON.stringify(payload));
	})
	twrApp.get(/^\/(?!admin(\/|$)|\.ss(\/|$)|\.ws(\/|$)|\.report(\/|$)|\.wb(\/|$)|\.explore(\/|$)|explore(\/|$)).*$/, (req, res, next) => {
		const userIp = clientIpFromReq(req);
		if (ipBans.includes(userIp)) {
			return res.status(403).render('accessDenied', {});
		}
		if (settings.maintenance) {
			return res.status(503).render('maintenance', {
				maintenanceMsg: settings.maintenanceMsg
			});
		}
		if (req.path.includes('.') && !req.path.endsWith('.html')) {
			return next();
		}
		res.sendFile('index.html', { root: staticPath });
	});
	if (settings.useStatic)
		twrApp.use(express.static(staticPath));


	// For starter scripts
	twrApp.get(/^\/\.ss$/, (req, res) => {
		const scripts = [];
		function readDirRecursive(dir, relativePath = "") {
			if (!fs.existsSync(dir)) return;
			const items = fs.readdirSync(dir);

			items.forEach(item => {
				const fullPath = path.join(dir, item);
				const relItemPath = relativePath ? path.join(relativePath, item) : item;

				if (fs.statSync(fullPath).isDirectory()) {
					readDirRecursive(fullPath, relItemPath);
				} else {
					scripts.push(relItemPath.replace(/\\/g, '/'));
				}
			});
		}
		readDirRecursive(STARTER_SCRIPTS_DIR);
		res.json(scripts);
	});
	// .ss/:script
	twrApp.get(/^\/\.ss\/(.+)$/, (req, res) => {
		const scriptPath = req.params[0];
		const targetPath = path.resolve(STARTER_SCRIPTS_DIR) + path.sep + scriptPath;

		if (!targetPath.startsWith(STARTER_SCRIPTS_DIR)) {
			return res.status(403).json({ success: false });
		}
		// null char
		if (scriptPath.includes('\0')) {
			return res.status(403).json({ success: false });
		}
		// incase of double encoding attempts
		let input = scriptPath;
		for (let i = 0; i < 3; i++) {
			try { input = decodeURIComponent(input); } catch { }
		}

		if (fs.existsSync(targetPath) && fs.statSync(targetPath).isFile()) {
			res.sendFile(targetPath);
		} else {
			res.status(404).json({ success: false, error: "Not Found" });
		}
	});
	var WORLD_SCRIPTS_DIR = settings.db.worldScriptsPath;
	// .ws/:script
	twrApp.get(/^\/\.ws\/(.+)$/, (req, res) => {
		const scriptPath = req.params[0];
		const targetPath = path.resolve(WORLD_SCRIPTS_DIR) + path.sep + scriptPath;

		if (!targetPath.startsWith(WORLD_SCRIPTS_DIR)) {
			return res.status(403).json({ success: false });
		}
		// null char
		if (scriptPath.includes('\0')) {
			return res.status(403).json({ success: false });
		}
		// incase of double encoding attempts
		let input = scriptPath;
		for (let i = 0; i < 3; i++) {
			try { input = decodeURIComponent(input); } catch { }
		}

		if (fs.existsSync(targetPath) && fs.statSync(targetPath).isFile()) {
			res.sendFile(targetPath);
		} else {
			res.status(404).json({ success: false, error: "Not Found - Maybe this world doesn't have a script or is not existent" });
		}
	});
	//---------------------------------------------------------------//
	//                            WEBHOOKS                           //
	//---------------------------------------------------------------//
	const stmtGetKey = db.prepare("SELECT * FROM webhooks WHERE api_key = ?");
	function apiKeyCheck(next) {
		return function (req, res) {
			const id = decodeURIComponent(req.params.key);
			const apiKey = stmtGetKey.get(id);

			if (!apiKey) {
				return res.status(403).json({ success: false, error: "Invalid API key" });
			}
			req.apiKey = apiKey;
			req.world_id = apiKey.world_id;
			return next(req, res);
		};
	}
	function createWebhookEndpoint(endpoint, handler, opts = { get: false, delete: false }) {
		const fullPath = `/.wb/:key/${endpoint}`;
		const limitAmount = adminSettings.webhookRatelimits[endpoint] || 10;

		const limiter = e_rateLimit({
			windowMs: 1000,
			max: limitAmount,
			message: {
				success: false,
				error: `Rate limit exceeded for ${endpoint}. Max ${limitAmount} per second.`
			},
			standardHeaders: true,
			legacyHeaders: false,
			keyGenerator: (req) => req.params.key
		});

		const middleware = apiKeyCheck(handler);
		twrApp.post(fullPath, limiter, middleware);

		if (opts.get) {
			twrApp.get(fullPath, limiter, middleware);
		}
		if (opts.delete) {
			twrApp.delete(fullPath, limiter, middleware);
		}

		if (opts.get && opts.delete) {
			throw new Error("Conflicting options: Cannot have both GET and DELETE for the same webhook endpoint");
		}
	}
	/////////////////////// ENDPOINTS ////////////////////////

	//helper
	function arrayOrNumber(value) {
		if (typeof value !== "string") return value;
		let cleaned = decodeURIComponent(value).trim();
		if (cleaned.startsWith("[") && cleaned.endsWith("]")) {
			try {
				return JSON.parse(cleaned);
			} catch (e) {

				return cleaned;
			}
		}
		const num = Number(cleaned);
		if (cleaned !== "" && !isNaN(num)) {
			return num;
		}

		return cleaned;
	}

	createWebhookEndpoint("edit", (req, res) => {
		var { x, y, char, color } = req.query;

		if (!x) {
			return res.status(400).json({ success: false, error: "Missing x coordinate" });
		}
		if (!y) {
			return res.status(400).json({ success: false, error: "Missing y coordinate" });
		}
		if (!is_whole_number(x) && !is_whole_number(y)) {
			return res.status(400).json({ success: false, error: "Coordinates must be whole numbers" });
		}
		x = parseInt(x);
		y = parseInt(y);
		if (char === undefined) {
			return res.status(400).json({ success: false, error: "Missing char parameter" });
		}
		if (char.length > 1) {
			return res.status(400).json({ success: false, error: "Char parameter must be a single character" });
		}
		if (color !== undefined) {
			let colorNum = arrayOrNumber(color);

			if (Array.isArray(colorNum)) {
				if (colorNum.length === 3) {
					colorNum.push(0);
				}

				const isValid = colorNum.length === 4 &&
					colorNum.every(c => typeof c === "number" && c >= 0 && c <= 255);

				if (!isValid) {
					return res.status(400).json({
						success: false,
						error: "Color array must have 3 or 4 numbers between 0 and 255."
					});
				}
				color = colorNum;

			} else if (typeof colorNum !== "number" || isNaN(colorNum) || colorNum < 0 || colorNum > 31) {
				return res.status(400).json({
					success: false,
					error: "Color must be a number between 0-31 or an RGB(Deco) array."
				});
			} else {
				color = colorNum;
			}
		}
		const worldId = req.world_id;
		const chunkX = Math.floor(x / 20);
		const chunkY = Math.floor(y / 10);
		let localX = x % 20;
		if (localX < 0) localX += 20;

		let localY = y % 10;
		if (localY < 0) localY += 10;
		const index = (localY * 20) + localX;
		const charCode = typeof char === "string" ? char.codePointAt(0) : char;
		if (charCode < 0 || charCode > 0x10FFFF) {
			return res.status(400).json({ success: false, error: "Invalid character code" });
		}
		if (charCode >= 0xD800 && charCode <= 0xDFFF) {
			return res.status(400).json({ success: false, error: "Invalid character code (surrogate)" });
		}

		const stat = writeChunk(worldId, chunkX, chunkY, index, charCode, color || 0, true, 0, "webhook");
		var world = db.prepare("SELECT attributes FROM worlds WHERE id=?").get(worldId);
		if (world && world.attributes.disableBraille && charCode >= 0x2800 && charCode <= 0x28FF) {
			return res.status(400).json({ success: false, error: "Braille is disabled in this world" });
		}
		if (stat) {
			queueEditBroadcast(worldId, [[chunkX, chunkY, charCode, index, color || 0]], -1);
			return res.json({ success: true, chunkX, chunkY, index });
		}

		res.status(500).json({ success: false, error: "Failed to write to chunk" });
	}, { get: true });
	createWebhookEndpoint("clear", (req, res) => {
		const { x, y } = req.query;
		if (isNaN(x) || isNaN(y)) {
			return res.status(400).json({ success: false, error: "Invalid x or y" });
		}
		x = Math.floor(x);
		y = Math.floor(y);
		if (x % 20 !== 0 || y % 10 !== 0) {
			return res.status(400).json({
				success: false,
				error: "Coordinates must be chunk-aligned (x multiple of 20, y multiple of 10)"
			});
		}
		const chunkX = Math.floor(x / 20);
		const chunkY = Math.floor(y / 10);
		clearChunk(req.world_id, chunkX, chunkY);
		worldBroadcast(req.world_id, encodeMsgpack({
			c: [chunkX * 20, chunkY * 10, chunkX * 20 + 19, chunkY * 10 + 9]
		}));

		res.json({
			success: true,
			cleared: { x, y, chunkX, chunkY }
		});
	}, { get: true });

	createWebhookEndpoint("protect", (req, res) => {
		let x = parseInt(req.query.x);
		let y = parseInt(req.query.y);
		x = Math.floor(x);
		y = Math.floor(y);
		if (isNaN(x) || isNaN(y)) {
			return res.status(400).json({ success: false, error: "Invalid x or y" });
		}

		if (x % 20 !== 0 || y % 10 !== 0) {
			return res.status(400).json({
				success: false,
				error: "Coordinates must be chunk-aligned (x % 20, y % 10)"
			});
		}

		const chunkX = Math.floor(x / 20);
		const chunkY = Math.floor(y / 10);

		const prot = toggleProtection(req.world_id, chunkX, chunkY);

		worldBroadcast(req.world_id, encodeMsgpack({
			p: [(chunkX * 20) + "," + (chunkY * 10), Boolean(prot)]
		}));

		res.json({
			success: true,
			protected: Boolean(prot),
			chunk: [chunkX, chunkY]
		});
	}, { get: true });
	// for attributes
	function createToggleEndpoint(endpoint, attrName, packetKey) {
		createWebhookEndpoint(endpoint, (req, res) => {
			const val = req.query.toggle;
			const newState = (val === "1" || val === "true" || val === 1 || val === true);
			editWorldAttr(req.world_id, attrName, newState);
			const packet = {};
			packet[packetKey] = newState;
			worldBroadcast(req.world_id, encodeMsgpack(packet));

			res.json({
				success: true,
				attribute: attrName,
				enabled: newState
			});
		}, { get: true });
	}

	createToggleEndpoint("readonly", "readonly", "ro");
	createToggleEndpoint("private", "private", "priv");
	createToggleEndpoint("hide_cursors", "hideCursors", "ch");
	createToggleEndpoint("disable_chat", "disableChat", "dc");
	createToggleEndpoint("disable_color", "disableColor", "dcl");
	createToggleEndpoint("disable_braille", "disableBraille", "db");
	createToggleEndpoint("unlisted", "unlisted", "un");
	createToggleEndpoint("nsfw", "nsfw", "nsfw");
	createToggleEndpoint("registered_only", "regonly", "regonly");

	/*createWebhookEndpoint("kick", (req, res) => {
		const { target } = req.query;
		if (!target) {
			return res.status(400).json({ success: false, error: "Missing target client ID" });
		}
		const ws = [...wss.clients].find(c => c.sdata && c.sdata.clientId === target);
		if (!ws) {
			return res.status(404).json({ success: false, error: "Target client not found" });
		}
		ws.sdata.connectedWorldName = "textwall";
		ws.sdata.connectedWorldNamespace = "main";
		send(ws, encodeMsgpack({ j: ["textwall", "main"] }));
	
		res.json({ success: true, kickedClientId: target });
	}, { get: true });*/
	httpServer.listen(port, bindHost, function () {
		var addr = httpServer.address();
		console.log("TWR server is hosted on " + addr.address + ":" + addr.port);
	});

	init_ws();
}


function is_whole_number(x) {
	var isNumber = typeof x === "number" && !isNaN(x) && isFinite(x)
	if (isNumber) {
		return x === Math.trunc(x)
	}
	return false
}


var ipConnLim = {};

var rateLimits = adminSettings.rateLimits
var rateLimitsByIp = {};
function isRateLimited(ip, packetType) {
	if (adminSettings.rateLimit) {
		var admin = wss.clients && [...wss.clients].find(c => c.sdata && c.sdata.ipAddr === ip && c.sdata.isAdmin);
		if (admin) return false;
		if (!rateLimits[packetType]) return false;
		let period = Math.floor(Date.now() / 1000);
		if (!rateLimitsByIp[ip]) {
			rateLimitsByIp[ip] = {};
		}
		if (!rateLimitsByIp[ip][packetType]) {
			rateLimitsByIp[ip][packetType] = [1, period];
			return false;
		}
		let ipLim = rateLimitsByIp[ip][packetType];
		let max = rateLimits[packetType];
		if (ipLim[1] == period) {
			if (ipLim[0] >= max) {
				return true;
			} else {
				ipLim[0]++;
				return false;
			}
		} else {
			ipLim[0] = 1;
			ipLim[1] = period;
			return false;
		}
	}
	return false;
}


var wss;
var objects = {};

function broadcast(data, exclusion) {
	wss.clients.forEach(function (ws) {
		if (ws == exclusion) return;
		send(ws, data);
	});
}
function send(ws, data) {
	try {
		ws.send(data);
	} catch (e) {
		return;
	}
}

function constructChar(color, bold, italic, underline, strike, overline) {
	var format = strike | underline << 1 | italic << 2 | bold << 3 | overline << 4;
	var n = format * 31 + color;
	return String.fromCharCode(n + 192);
}

function parseChar(chr) {
	var col = chr % 31;
	var format = Math.floor(chr / 31);
	return {
		color: col,
		overline: (format & 16) == 16,
		bold: (format & 8) == 8,
		italic: (format & 4) == 4,
		underline: (format & 2) == 2,
		strike: (format & 1) == 1
	};
}

function validateUsername(str) {
	if (str.length < 1 || str.length > 64) return false;
	var validChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-.";
	for (var i = 0; i < str.length; i++) {
		var chr = str[i];
		if (!validChars.includes(chr)) return false;
	}
	return true;
}

function generateToken() {
	var set = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/+";
	var str = "";
	for (var i = 0; i < 48; i++) {
		str += set[Math.floor(Math.random() * set.length)];
	}
	return str;
}

function generateWebhookToken() {
	var set = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
	var str = "";
	for (var i = 0; i < 48; i++) {
		str += set[Math.floor(Math.random() * set.length)];
	}
	return str;
}

function san_nbr(x) {
	if (typeof x === "bigint") x = Number(x);
	if (typeof x === "boolean") x = x ? 1 : 0;
	if (typeof x === "string") x = Number(x);
	if (!isFinite(x)) x = 0;
	x = Math.trunc(Math.max(Math.min(x, 9007199254740991), -9007199254740991));
	return x;
}


var onlineCount = 0;


var chunkCache = {};
var modifiedChunks = {};
var EDIT_HISTORY_MAX_MS = 60 * 60 * 1000;
var pendingHistoryInserts = [];
var insertHistoryStmt = null;
var schemaReady = false;

function normalizeEditors(raw) {
	var arr = new Array(200).fill(0);
	var parsed = raw;
	if (typeof raw === "string") {
		try { parsed = JSON.parse(raw); } catch (e) { return arr; }
	}
	if (!Array.isArray(parsed)) return arr;
	for (var i = 0; i < 200 && i < parsed.length; i++) {
		var n = parsed[i];
		arr[i] = Number.isInteger(n) ? n : 0;
	}
	return arr;
}

function cellCodePoint(ch) {
	if (typeof ch !== "string" || !ch.length) return 32;
	return ch.codePointAt(0) || 32;
}

function colorsEqual(a, b) {
	if (a === b) return true;
	return JSON.stringify(a ?? 0) === JSON.stringify(b ?? 0);
}

function recordCellEdit(worldId, x, y, idx, userId, username, prevChar, prevColor, newChar, newColor, clientId, ip) {
	pendingHistoryInserts.push([
		Date.now(),
		worldId,
		x,
		y,
		idx,
		userId || 0,
		username || "",
		prevChar,
		JSON.stringify(prevColor ?? 0),
		newChar,
		JSON.stringify(newColor ?? 0),
		clientId ? String(clientId) : "",
		ip || ""
	]);
}

function flushEditHistory() {
	if (!schemaReady || pendingHistoryInserts.length === 0) return;
	if (!insertHistoryStmt) {
		insertHistoryStmt = db.prepare(`
			INSERT INTO edit_history
			(ts, world_id, chunk_x, chunk_y, cell_idx, user_id, username, prev_char, prev_color, new_char, new_color, client_id, ip)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`);
	}
	var rows = pendingHistoryInserts;
	pendingHistoryInserts = [];
	var insertMany = db.transaction(function (batch) {
		for (var i = 0; i < batch.length; i++) {
			insertHistoryStmt.run(batch[i]);
		}
	});
	insertMany(rows);
}

function pruneEditHistory() {
	if (!schemaReady) return;
	db.prepare("DELETE FROM edit_history WHERE ts < ?").run(Date.now() - EDIT_HISTORY_MAX_MS);
}

function canvasGotoFromSdata(s) {
	if (!s || !s.isConnected) return null;
	var ns = s.connectedWorldNamespace || "textwall";
	var name = s.connectedWorldName || "main";
	var path = "/";
	if (!(ns === "textwall" && name === "main")) {
		path = (!name || name === "main") ? ("/~" + ns) : ("/~" + ns + "/" + name);
	}
	var x = s.cursorX || 0;
	var yDisp = -(s.cursorY || 0);
	return {
		url: path + "?x=" + x + "&y=" + yDisp,
		namespace: ns,
		world: name,
		x: x,
		y: s.cursorY || 0,
		displayY: yDisp
	};
}

function restoreEditsInWindow(opts) {
	flushEditHistory();
	var since = opts.since;
	var userId = opts.userId;
	var clientId = opts.clientId != null && opts.clientId !== "" ? String(opts.clientId) : "";
	var all = !!opts.all;
	var actorId = opts.actorId || 0;
	var actorName = opts.actorName || "";
	var rows;
	if (all) {
		rows = db.prepare("SELECT * FROM edit_history WHERE ts >= ? ORDER BY ts ASC").all(since);
	} else if (clientId) {
		rows = db.prepare("SELECT * FROM edit_history WHERE ts >= ? AND IFNULL(client_id,'') = ? AND user_id = 0 ORDER BY ts ASC").all(since, clientId);
	} else {
		rows = db.prepare("SELECT * FROM edit_history WHERE ts >= ? AND user_id = ? ORDER BY ts ASC").all(since, userId);
	}
	var restore = new Map();
	for (var i = 0; i < rows.length; i++) {
		var row = rows[i];
		var key = row.world_id + "," + row.chunk_x + "," + row.chunk_y + "," + row.cell_idx;
		if (!restore.has(key)) restore.set(key, row);
	}
	if (restore.size > 500000) {
		return { error: "Too many cells to restore (" + restore.size + "). Narrow the time window." };
	}
	var worldChunks = new Map();
	restore.forEach(function (row) {
		var prevColor;
		try { prevColor = JSON.parse(row.prev_color); } catch (e) { prevColor = 0; }
		writeChunk(row.world_id, row.chunk_x, row.chunk_y, row.cell_idx, row.prev_char, prevColor, true, actorId, actorName);
		var wmap = worldChunks.get(row.world_id);
		if (!wmap) {
			wmap = new Map();
			worldChunks.set(row.world_id, wmap);
		}
		var ckey = row.chunk_x + "," + row.chunk_y;
		var chunk = wmap.get(ckey);
		if (!chunk) {
			chunk = [row.chunk_x, row.chunk_y];
			wmap.set(ckey, chunk);
		}
		chunk.push(row.prev_char, row.cell_idx, prevColor);
	});
	worldChunks.forEach(function (chunks, worldId) {
		queueEditBroadcast(worldId, Array.from(chunks.values()), -1);
	});
	flushEditHistory();
	commitChunks();
	return { restored: restore.size, worlds: worldChunks.size, scanned: rows.length };
}

function commitChunks() {
	flushEditHistory();
	db.prepare("BEGIN");

	for (var t in modifiedChunks) {
		var tup = t.split(",");
		var worldId = parseInt(tup[0]);
		var chunkX = parseInt(tup[1]);
		var chunkY = parseInt(tup[2]);

		var data = chunkCache[t];

		var text = data.char.join("");
		var color = JSON.stringify(data.color);
		var prot = Number(data.protected);
		var editors = JSON.stringify(normalizeEditors(data.editors));

		// convert protection array → "010101..."
		var textProt = data.textProtected
			? data.textProtected.map(v => v ? "1" : "0").join("")
			: "0".repeat(200);

		if (data.exists) {

			db.prepare(`
				UPDATE chunks
				SET text=?, colorFmt=?, protected=?, text_protected=?, editors=?
				WHERE world_id=? AND x=? AND y=?
			`).run(text, color, prot, textProt, editors, worldId, chunkX, chunkY);

		} else {

			data.exists = true;

			db.prepare(`
				INSERT INTO chunks
				(world_id, x, y, text, colorFmt, protected, text_protected, editors)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?)
			`).run(worldId, chunkX, chunkY, text, color, prot, textProt, editors);

		}

		delete modifiedChunks[t];
	}

	db.prepare("COMMIT");
	pruneEditHistory();
}

setInterval(function () {
	commitChunks();
}, 60 * 1000);

setInterval(function () {
	flushEditHistory();
}, 2000);

setInterval(function () {
	flushCache();
}, 1000 * 60 * 10);

function flushCache() {
	for (var t in chunkCache) {
		if (modifiedChunks[t]) continue;
		delete chunkCache[t];
	}
}
var getChunkStmt = null;
function getChunk(worldId, x, y, canCreate) {
	if (!getChunkStmt) {
		getChunkStmt = db.prepare(
			"SELECT * FROM chunks WHERE world_id=? AND x=? AND y=?"
		);
	}

	var tuple = worldId + "," + x + "," + y;

	if (chunkCache[tuple]) {
		return chunkCache[tuple];
	}

	var data = getChunkStmt.get(worldId, x, y);
	if (data) {
		var colorRaw = data.colorFmt;
		var colorArray = [];

		try {
			colorArray = JSON.parse(colorRaw);
			if (!Array.isArray(colorArray)) throw new Error("not array");
		} catch (e) {
			for (var i = 0; i < colorRaw.length; i++) {
				colorArray.push(colorRaw[i].charCodeAt() - 192);
			}
		}

		var textProt = new Array(200).fill(false);

		if (data.text_protected) {
			for (let i = 0; i < data.text_protected.length && i < 200; i++) {
				textProt[i] = data.text_protected[i] === "1";
			}
		}

		var cdata = {
			char: [...data.text],
			color: colorArray,
			protected: Boolean(data.protected),
			textProtected: textProt,
			editors: normalizeEditors(data.editors),
			exists: true
		};

		chunkCache[tuple] = cdata;
		return cdata;

	} else {

		var cdata = {
			char: new Array(10 * 20).fill(" "),
			color: new Array(10 * 20).fill(0),
			protected: false,
			textProtected: new Array(200).fill(false),
			editors: new Array(200).fill(0)
		};

		if (canCreate) {
			chunkCache[tuple] = cdata;
		}

		return cdata;
	}
}
function writeChunk(worldId, x, y, idx, char, colorFmt, isMember, userId, username, clientId, ip) {
	if (char == 0 || (char >= 0xD800 && char <= 0xDFFF)) return false;

	var tuple = worldId + "," + x + "," + y;
	var chunk = getChunk(worldId, x, y, true);


	if (chunk.protected && !isMember) return false;
	if (chunk.textProtected && chunk.textProtected[idx] && !isMember) return false;

	if (!chunk.editors || chunk.editors.length !== 200) {
		chunk.editors = normalizeEditors(chunk.editors);
	}

	var prevCharStr = chunk.char[idx];
	var prevColor = chunk.color[idx];
	var prevCp = cellCodePoint(prevCharStr);
	var changed = prevCp !== char || !colorsEqual(prevColor, colorFmt);

	var storedId = userId || 0;
	if (!storedId && clientId) {
		var cidNum = parseInt(clientId, 10);
		if (Number.isInteger(cidNum) && cidNum > 0) storedId = -cidNum;
	}
	if (!username && clientId && !userId) username = "anon:" + clientId;

	chunk.char[idx] = String.fromCodePoint(char);
	chunk.color[idx] = colorFmt;
	chunk.editors[idx] = storedId;

	if (changed) {
		recordCellEdit(worldId, x, y, idx, userId || 0, username || "", prevCp, prevColor, char, colorFmt, clientId, ip);
	}

	modifiedChunks[tuple] = true;
	return true;
};
function toggleCellProtection(worldId, x, y, idx) {
	var tuple = worldId + "," + x + "," + y;
	var chunk = getChunk(worldId, x, y, true);

	if (chunk.protected) {
		// break chunk protection into per-cell protection
		chunk.protected = false;
		chunk.textProtected = new Array(200).fill(true);

		// unprotect only this cell
		chunk.textProtected[idx] = false;

		modifiedChunks[tuple] = true;
		return false;
	}

	if (!Array.isArray(chunk.textProtected)) {
		chunk.textProtected = new Array(200).fill(false);
	}

	chunk.textProtected[idx] = !chunk.textProtected[idx];
	modifiedChunks[tuple] = true;
	return chunk.textProtected[idx];
}

function toggleProtection(worldId, x, y) {
	var tuple = worldId + "," + x + "," + y;
	var chunk = getChunk(worldId, x, y, true);

	chunk.protected = !chunk.protected;
	modifiedChunks[tuple] = true;
	return chunk.protected;
}

function clearChunk(worldId, x, y) {
	var tuple = worldId + "," + x + "," + y;
	var chunk = getChunk(worldId, x, y, false);
	if (!chunk.exists) return;
	for (var i = 0; i < chunk.char.length; i++) {
		chunk.char[i] = " ";
		chunk.color[i] = 0;
	}
	chunk.editors = new Array(200).fill(0);
	modifiedChunks[tuple] = true;
}

function sendOwnerStuff(ws, connectedWorldId, connectedWorldNamespace) {
	var memberList = db.prepare("SELECT * FROM members WHERE world_id=?").all(connectedWorldId);
	var normMemberList = [];
	for (var i = 0; i < memberList.length; i++) {
		normMemberList.push(memberList[i].username);
	}
	send(ws, encodeMsgpack({
		ml: normMemberList
	}));
	sendWorldList(ws, connectedWorldId, connectedWorldNamespace);
}

function sendWorldList(ws, connectedWorldId, connectedWorldNamespace, noPrivate) {
	var worldList = db.prepare("SELECT * FROM worlds WHERE namespace=? COLLATE NOCASE").all(connectedWorldNamespace);
	var normWorldList = [];
	for (var i = 0; i < worldList.length; i++) {
		var world = worldList[i];
		var wname = world.name;
		var attr = JSON.parse(world.attributes);
		if (noPrivate && attr.private) continue;
		normWorldList.push(wname, Boolean(attr.private));
	}

	send(ws, encodeMsgpack({
		wl: normWorldList
	}));
}

function editWorldAttr(worldId, prop, value) {
	var world = db.prepare("SELECT attributes FROM worlds WHERE id=?").get(worldId);
	if (!world) return;
	var attr = JSON.parse(world.attributes);
	attr[prop] = value;
	db.prepare("UPDATE worlds SET attributes=? WHERE id=?").run(JSON.stringify(attr), worldId);

	wss.clients.forEach(function (sock) {
		if (!sock || !sock.sdata) return;
		if (sock.sdata.connectedWorldId == worldId) {
			sock.sdata.worldAttr[prop] = Boolean(value);
		}
	});
}
function sendWorldAttrs(ws, world) {
	var attr = JSON.parse(world.attributes);
	var sdata = ws.sdata;
	var isOwner = sdata.isAuthenticated && (
		(sdata.connectedWorldNamespace && sdata.connectedWorldNamespace.toLowerCase() == sdata.authUser.toLowerCase()) ||
		(settings.adminList && settings.adminList.includes(sdata.authUser))
	);

	send(ws, encodeMsgpack({ ro: Boolean(attr.readonly) }));
	send(ws, encodeMsgpack({ priv: Boolean(attr.private) }));
	send(ws, encodeMsgpack({ ch: Boolean(attr.hideCursors) }));
	send(ws, encodeMsgpack({ dc: Boolean(attr.disableChat) }));
	send(ws, encodeMsgpack({ dcl: Boolean(attr.disableColor) }));
	send(ws, encodeMsgpack({ db: Boolean(attr.disableBraille) }));
	send(ws, encodeMsgpack({ un: Boolean(attr.unlisted) }));
	send(ws, encodeMsgpack({ nsfw: Boolean(attr.nsfw) }));
	send(ws, encodeMsgpack({ regonly: Boolean(attr.regonly) }));
	send(ws, encodeMsgpack({ theme: attr.theme || [false, null, null] }));
	var webhookData = attr.webhook || [false, null];
	send(ws, encodeMsgpack({
		webhook: isOwner ? [Boolean(webhookData[0]), webhookData[1]] : [Boolean(webhookData[0]), null]
	}));
}

function evictClient(ws) {
	worldBroadcast(ws.sdata.connectedWorldId, encodeMsgpack({
		rc: ws.sdata.clientId
	}), ws);

	ws.sdata.connectedWorldNamespace = "textwall";
	ws.sdata.connectedWorldName = "main";
	ws.sdata.connectedWorldId = 1;
	ws.sdata.isMember = false;
	send(ws, encodeMsgpack({
		j: ["textwall", "main"]
	}));
	send(ws, encodeMsgpack({
		perms: 0
	}));
	send(ws, encodeMsgpack({
		b: [-Infinity, Infinity, -Infinity, Infinity]
	}));
	ws.sdata.isConnected = true;
	var worldInfo = db.prepare("SELECT * FROM worlds WHERE id=1").get();
	sendWorldAttrs(ws, worldInfo);
	var attr = JSON.parse(worldInfo.attributes);
	ws.sdata.worldAttr = attr;
	dumpCursors(ws);
}

function worldBroadcast(connectedWorldId, data, excludeWs) {
	wss.clients.forEach(function (sock) {
		if (!sock || !sock.sdata) return;
		if (sock == excludeWs) return;
		if (sock.sdata.connectedWorldId == connectedWorldId) {
			send(sock, data);
		}
	});
}

var EDIT_BROADCAST_HZ = 10;
var EDIT_BROADCAST_CELLS_PER_WORLD_PER_TICK = 256;
var CLIENT_EDIT_HZ = 20;
var EDIT_PACKET_DISCONNECT_THRESHOLD = CLIENT_EDIT_HZ * 2;
var pendingEditBroadcasts = new Map();

function editPacketFlood(ws) {
	var now = Date.now();
	var sdata = ws.sdata;
	if (!sdata.editPktWindowStart || now - sdata.editPktWindowStart >= 1000) {
		sdata.editPktWindowStart = now;
		sdata.editPktCount = 1;
		return false;
	}
	sdata.editPktCount++;
	return sdata.editPktCount > EDIT_PACKET_DISCONNECT_THRESHOLD;
}

function queueEditBroadcast(worldId, resp, clientId) {
	if (!resp || !resp.length) return;
	var pending = pendingEditBroadcasts.get(worldId);
	if (!pending) {
		pending = { chunks: new Map(), clientId: clientId };
		pendingEditBroadcasts.set(worldId, pending);
	} else if (clientId !== undefined) {
		pending.clientId = clientId;
	}
	for (var i = 0; i < resp.length; i++) {
		var chunk = resp[i];
		if (!Array.isArray(chunk) || chunk.length < 5) continue;
		var key = chunk[0] + "," + chunk[1];
		var cells = pending.chunks.get(key);
		if (!cells) {
			cells = new Map();
			pending.chunks.set(key, cells);
		}
		for (var j = 2; j + 2 < chunk.length; j += 3) {
			cells.set(chunk[j + 1], [chunk[j], chunk[j + 2]]);
		}
	}
}

function flushEditBroadcasts() {
	if (!wss || pendingEditBroadcasts.size === 0) return;
	pendingEditBroadcasts.forEach(function (pending, worldId) {
		var resp = [];
		var cellsSent = 0;
		var emptyKeys = [];
		pending.chunks.forEach(function (cells, key) {
			if (cellsSent >= EDIT_BROADCAST_CELLS_PER_WORLD_PER_TICK) return;
			var parts = key.split(",");
			var obj = [+parts[0], +parts[1]];
			var sentIdx = [];
			cells.forEach(function (pair, idx) {
				if (cellsSent >= EDIT_BROADCAST_CELLS_PER_WORLD_PER_TICK) return;
				obj.push(pair[0], idx, pair[1]);
				sentIdx.push(idx);
				cellsSent++;
			});
			for (var s = 0; s < sentIdx.length; s++) cells.delete(sentIdx[s]);
			if (obj.length > 2) resp.push(obj);
			if (cells.size === 0) emptyKeys.push(key);
		});
		for (var e = 0; e < emptyKeys.length; e++) pending.chunks.delete(emptyKeys[e]);
		if (resp.length) {
			var payload = { e: { e: resp } };
			if (pending.clientId !== undefined) payload.e.clientId = pending.clientId;
			worldBroadcast(worldId, encodeMsgpack(payload));
		}
		if (pending.chunks.size === 0) pendingEditBroadcasts.delete(worldId);
	});
}

var editBroadcastInterval = setInterval(flushEditBroadcasts, Math.floor(1000 / EDIT_BROADCAST_HZ));

function command_output_broadcast(connectedWorldId, output) {
	wss.clients.forEach(function (sock) {
		if (!sock || !sock.sdata) return;
		if (String(sock.sdata.connectedWorldId) === String(connectedWorldId) && sock.sdata.command_output_enabled) {

			send(sock, encodeMsgpack({ cmd: output }));
		}
	});
}


function dumpCursors(ws) {
	wss.clients.forEach(function (sock) {
		if (!sock || !sock.sdata) return;
		if (sock == ws) return;
		if (sock.sdata.connectedWorldId == ws.sdata.connectedWorldId) {
			send(ws, encodeMsgpack({
				cu: {
					id: sock.sdata.clientId,
					l: [sock.sdata.cursorX, sock.sdata.cursorY],
					c: sock.sdata.cursorColor,
					n: sock.sdata.cursorAnon ? "" : (sock.sdata.isAuthenticated ? sock.sdata.authUser : ""),
					dn: sock.sdata.displayName || ""
				}
			}));
		}
	});
}

function encodeMsgpack(data) {
	try {
		return msgpack.encode(data);
	} catch (e) {
		return new Uint8Array([]);
	}

}



var clientRecord = {};
var chatMutesByIP = {};
var chatMutesByUserIDs = {};
var muteMutated = false;
let clients = [];
let canvasMutesByIP = {};
let canvasMutesByUserIDs = {};
let fullMuteByIP = {};
let fullMuteByUserIDs = {};
let canvasMuteMutated = false;
let fullMuteMutated = false;

function assignDN(sdata, ws, update = true) {
	if (!sdata.isAuthenticated) return;

	var hasDisplayNameDb = db.prepare("SELECT display_name FROM display_names WHERE user_id=?").get(sdata.authUserId)?.display_name;
	sdata.displayName = hasDisplayNameDb || sdata.authUser;

	if (update) dumpCursors(ws);
	if (hasDisplayNameDb) {
		send(ws, encodeMsgpack({
			dn: hasDisplayNameDb
		}));
	}
}
function clearClientRecord() {
	for (let c in clientRecord) {
		let cli = clientRecord[c];
		if (!cli.isConnected) {
			if (Date.now() - cli.connectTime > 1000 * 60 * 30) {
				delete clientRecord[c];
			}
		}
	}
}

function saveMutes() {
	fs.writeFileSync(muteDbPath, JSON.stringify({
		ip: chatMutesByIP,
		id: chatMutesByUserIDs
	}, null, "\t"));
}

function loadMutes() {
	var fileMuteData;
	try {
		fileMuteData = fs.readFileSync(muteDbPath);
	} catch (e) {
		console.error(e);
		console.log("No mutes file found");
		return; // no mutes...
	}
	var data = JSON.parse(fileMuteData);
	chatMutesByIP = data.ip;
	chatMutesByUserIDs = data.id;
}

loadMutes();
const canvasMuteDbPath = settings.db.canvasMutePath;


function saveCanvasMutes() {
	fs.writeFileSync(canvasMuteDbPath, JSON.stringify({
		ip: canvasMutesByIP,
		id: canvasMutesByUserIDs
	}, null, "\t"));
}

function loadCanvasMutes() {
	try {
		const data = JSON.parse(fs.readFileSync(canvasMuteDbPath));
		canvasMutesByIP = data.ip;
		canvasMutesByUserIDs = data.id;
	} catch (e) {
		console.error(e);
		console.log("No canvas mutes file found");
		return; // no canvas mutes...
	}
}
function canvasMuted(sdata) {
	if (!sdata) return false;

	let cli = clientRecord[sdata.clientId];
	if (!cli) return false;
	if (canvasMutesByUserIDs[cli.authUserId]) return true;
	if (canvasMutesByIP[cli.ipAddr]) return true;

	return false;
}

function fullyMuted(sdata) {
	if (!sdata) return false;

	let cli = clientRecord[sdata.clientId];
	if (!cli) return false;

	if (fullMuteByUserIDs[cli.authUserId]) return true;
	if (fullMuteByIP[cli.ipAddr]) return true;

	return false;
}
loadCanvasMutes();

let saveCanvasMuteInterval = setInterval(() => {
	if (canvasMuteMutated) {
		canvasMuteMutated = false;
		saveCanvasMutes();
	}
}, 5000);

let memClrInterval = setInterval(function () {
	clearClientRecord();
}, 1000 * 60);

let saveMuteInterval = setInterval(function () {
	if (muteMutated) {
		muteMutated = false;
		saveMutes();
	}
}, 1000 * 5);
let recentAnncInterval = setInterval(() => {
	getRecentAnnouncements();
}, 60 * 60 * 1000);
function broadcastTyping(key, channel) {
	const users = Object.values(typingUsers[key] || {}).map(u => ({
		id: u.id,
		name: u.name
	}));

	const packet = encodeMsgpack({
		typing: { users, channel }
	});

	if (channel === "global") {

		broadcast(packet);
	} else {

		worldBroadcast(key, packet, null);
	}
}
let torBlacklist = new Set();

function updateTorExitNodes() {
	http_2.get("https://check.torproject.org/exit-addresses", function (res) {
		let rawData = "";
		res.on("data", (chunk) => { rawData += chunk; });

		res.on("end", () => {
			const regex = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
			const foundIps = rawData.match(regex);

			if (foundIps) {
				torBlacklist = new Set(foundIps);
			}
		});
	}).on("error", (err) => {
		console.error("Error fetching Tor list:", err.message);
	});
}

updateTorExitNodes();
setInterval(updateTorExitNodes, 1 * 60 * 60 * 1000);

function init_ws() {
	wss = new ws.Server({ server: httpServer });

	wss.on("connection", function (ws, req) {
		var ipAddr = clientIpFromReq(req);
		if (!ipAddr && ws._socket && ws._socket.remoteAddress) {
			ipAddr = normalizeIp(ws._socket.remoteAddress);
		}
		if (!ipAddr) return;

		if (!ipConnLim[ipAddr]) {
			ipConnLim[ipAddr] = [0, 0, 0]; // connections, blocks placed in current second period, second period
		}

		var connObj = ipConnLim[ipAddr];

		if (connObj[0] >= 15) {
			ws.close(1000, "Too many connections from your IP");
			return;
		}
		if (torBlacklist.has(ipAddr)) {
			ws.close(1000, "Connections from Tor exit nodes are not allowed");
			return;
		};

		if (req.headers["sec-websocket-protocol"] !== "3.0.7") {
			ws.close(1000, "Version mismatch");
			return;
		}

		if (settings.maintenance) {
			let msg = settings.maintenanceMsg ? `Maintenance: ${settings.maintenanceMsg}` : "Maintenance";
			if (msg.length > 123) {
				msg = msg.substring(0, 120) + "...";
			}

			ws.close(1000, msg);
		}

		console.log("New client:", ipAddr);
		connObj[0]++;


		onlineCount++;

		let clientId = Math.floor(Math.random() * 1000000000).toString();

		var sdata = {
			connectTime: Date.now(),
			ipAddr: ipAddr,
			isConnected: false,
			isAuthenticated: false,
			isMember: false,
			authUser: "",
			authUserId: 0,
			authToken: "",
			connectedWorldNamespace: "",
			connectedWorldName: "",
			connectedWorldId: 0,
			clientId: clientId,
			cursorX: 0,
			cursorY: 0,
			cursorColor: 0,
			cursorAnon: false,
			worldAttr: {},
			isAdmin: false,
			isModerator: false,
			displayName: "",
			chatChannel: "world",
			command_output_enabled: false
		};

		clientRecord[clientId] = sdata;
		ws.sdata = sdata;
		send(ws, encodeMsgpack({ id: clientId }));
		sdata.isAdmin = settings.adminList.includes(sdata.authUser);
		send(ws, encodeMsgpack({ admin: sdata.isAdmin }));

		clients[ws.sdata.clientId] = ws;

		ws.on("message", function (message, binary) {

			if (!binary) return;


			var per = Math.floor(Date.now() / 1000);
			if (connObj[2] == per) {
				if (connObj[1] >= 100) return;
			} else {
				connObj[1] = 0;
			}
			connObj[2] = per;
			connObj[1]++;


			var data;
			try {
				data = msgpack.decode(message);
			} catch (e) {
				return;
			}

			if (data == null) return;
			if (typeof data != "object") return;
			if (Array.isArray(data)) return;

			let packetType = Object.keys(data)[0];
			if (!packetType) return;
			if (packetType !== "e" && isRateLimited(ipAddr, packetType)) {
				return;
			}

			assignDN(sdata, ws, false);


			if ("j" == packetType) {
				var world = data.j;

				if (!Array.isArray(world)) return;

				var namespace = world[0];
				var pathname = world[1];
				if (typeof namespace != "string") return;
				if (typeof pathname != "string") return;
				if (namespace.length > 64) return;
				if (pathname.length > 64) return;

				sdata.isMember = false;
				sdata.isConnected = false;
				sdata.worldAttr = {};
				const adminList = settings.adminList.map(a => a.toLowerCase());

				if (adminList.includes(namespace.toLowerCase())) {

					if (!sdata.isAuthenticated || sdata.authUser.toLowerCase() !== namespace.toLowerCase()) {
						send(ws, encodeMsgpack({ alert: "You are viewing an admin's wall." }));
					}

				}
				if (sdata.isAuthenticated && adminList.includes(sdata.authUser.toLowerCase())) {
					sendOwnerStuff(ws, sdata.connectedWorldId, sdata.connectedWorldNamespace);
				}
				send(ws, encodeMsgpack({
					online: onlineCount
				}));
				send(ws, encodeMsgpack({ worldid: sdata.connectedWorldId }));
				broadcast(encodeMsgpack({
					online: onlineCount
				}), ws);

				if (sdata.connectedWorldId) {
					worldBroadcast(sdata.connectedWorldId, encodeMsgpack({
						rc: sdata.clientId
					}), ws);
				}


				var world = db.prepare("SELECT * FROM worlds WHERE namespace=? COLLATE NOCASE AND name=? COLLATE NOCASE").get(namespace, pathname);
				if (!world) {
					if (sdata.isAuthenticated && namespace.toLowerCase() == sdata.authUser.toLowerCase()) {
						var insertInfo = db.prepare("INSERT INTO 'worlds' VALUES(null, ?, ?, ?)").run(sdata.authUser, pathname, JSON.stringify({
							readonly: false,
							private: false,
							hideCursors: false,
							disableChat: false,
							disableColor: false,
							disableBraille: false,
							unlisted: false,
							nsfw: false,
							regonly: false,
							webhook: [false, null],
							theme: null
						})).lastInsertRowid;
						var worldInfo = db.prepare("SELECT * FROM worlds WHERE rowid=?").get(insertInfo);
						sdata.connectedWorldNamespace = worldInfo.namespace;
						sdata.connectedWorldName = worldInfo.name;
						sdata.connectedWorldId = worldInfo.id;
						send(ws, encodeMsgpack({
							j: [sdata.connectedWorldNamespace, sdata.connectedWorldName]
						}));
						send(ws, encodeMsgpack({
							perms: 2
						}));
						sdata.isMember = true;
						sdata.isConnected = true;
						sendOwnerStuff(ws, sdata.connectedWorldId, sdata.connectedWorldNamespace);
						send(ws, encodeMsgpack({
							b: [-Infinity, Infinity, -Infinity, Infinity]
						}));
						sendWorldAttrs(ws, worldInfo);
						dumpCursors(ws);



						return;
					} else {
						evictClient(ws);
						return;
					}
				}

				var attr = JSON.parse(world.attributes);
				sdata.worldAttr = attr;


				if (sdata.worldAttr.nsfw) {
					send(ws, {
						nsfw: true
					})
				}

				if (sdata.worldAttr.theme) {
					send(ws, {
						changeTheme: sdata.worldAttr.theme
					})
				}




				sdata.connectedWorldNamespace = world.namespace;
				sdata.connectedWorldName = world.name;
				sdata.connectedWorldId = world.id;
				
				var rows = db.prepare(`
    SELECT * FROM (
        SELECT username, message, isAdmin, isAuth, channel, tag, timestamp, color 
        FROM chathistory 
        WHERE world_id = ? AND channel != 'global'
        ORDER BY timestamp DESC 
        LIMIT 200
    )
    UNION ALL
    SELECT * FROM (
        SELECT username, message, isAdmin, isAuth, channel, tag, timestamp, color 
        FROM chathistory 
        WHERE channel = 'global'
        ORDER BY timestamp DESC 
        LIMIT 200
    )
    ORDER BY timestamp DESC
`).all(sdata.connectedWorldId);
				const chathistory = rows.reverse().map(row => {
					let colorValue = row.color;
					if (typeof colorValue === "string" && colorValue.includes(",")) {
						colorValue = colorValue.split(",").map(Number);
					}

					return [
						row.username,           // nickName
						colorValue,             // colorIndex / RGB Array
						row.message,            // msgText
						!!row.isAuth,           // !!isAuthFlag
						!!row.isAdmin,          // !!isAdminFlag
						row.channel,            // channelName
						row.username,           // displayNick
						row.timestamp,          // timestamp
						row.tag                 // tag
					];
				});
				send(ws, encodeMsgpack({
					chathistory
				}));

				send(ws, encodeMsgpack({
					j: [sdata.connectedWorldNamespace, sdata.connectedWorldName]
				}));

				var isOwner = sdata.isAuthenticated && (
					(sdata.connectedWorldNamespace && sdata.connectedWorldNamespace.toLowerCase() == sdata.authUser.toLowerCase()) ||
					(settings.adminList && settings.adminList.includes(sdata.authUser))
				);
				if (isOwner) {
					send(ws, encodeMsgpack({
						perms: 2
					}));
					sdata.isMember = true;

					sendOwnerStuff(ws, sdata.connectedWorldId, sdata.connectedWorldNamespace);
				} else if (sdata.isAuthenticated) {
					var memberCheck = db.prepare("SELECT * FROM members WHERE username=? COLLATE NOCASE AND world_id=?").get(sdata.authUser, sdata.connectedWorldId);
					if (memberCheck) {
						send(ws, encodeMsgpack({
							perms: 1
						}));
						sdata.isMember = true;
					}
					else if (sdata.isModerator) {
						send(ws, encodeMsgpack({
							perms: 1
						}));
						sdata.isMember = true;
					} else {
						if (attr.private) {
							evictClient(ws);
							return;
						}
						send(ws, encodeMsgpack({
							perms: 0
						}));
					}
					sendWorldList(ws, sdata.connectedWorldId, sdata.connectedWorldNamespace, true);
				} else {
					if (attr.private) {
						evictClient(ws);
						return;
					}
					send(ws, encodeMsgpack({
						perms: 0
					}));
					sendWorldList(ws, sdata.connectedWorldId, sdata.connectedWorldNamespace, true);
				}

				sendWorldAttrs(ws, world);

				send(ws, encodeMsgpack({
					b: [-Infinity, Infinity, -Infinity, Infinity]
				}));
				assignDN(sdata, ws, false);
				dumpCursors(ws);
				function normalizeWorldName(name) {
					if (typeof name !== "string") return "";
					return name.replace(/\//g, "_");
				}

				var worldScriptsDir = path.join(
					__dirname,
					"../world-scripts",
					normalizeWorldName(sdata.connectedWorldNamespace) + "_" + normalizeWorldName(sdata.connectedWorldName) + "/"
				);
				fs.readdir(worldScriptsDir, (err, files) => {
					if (err) {
						return;
					}
					const scriptFiles = files.filter(f => f.endsWith(".js"));
					const scriptNames = scriptFiles.map(f => f.slice(0, -3));
					send(ws, encodeMsgpack({ owsc: scriptNames }));
				});
				sdata.isConnected = true;
			} else if ("r" == packetType) {
				if (!sdata.isConnected) return;
				if (sdata.worldAttr.regonly && !sdata.isAuthenticated) return;
				var regions = data.r;

				if (sdata.worldAttr.private && !sdata.isMember) return;

				if (!Array.isArray(regions)) return;

				var len = Math.floor(regions.length / 2);
				var chunks = [];
				if (len > 10 * 10 * 3) return;
				for (var i = 0; i < len; i++) {
					var x = san_nbr(regions[i * 2]);
					var y = san_nbr(regions[i * 2 + 1]);
					var cd = getChunk(sdata.connectedWorldId, x, y);
					var char = cd.char;
					var color = cd.color;
					var color2 = "";
					for (var z = 0; z < color.length; z++) {
						var colorVal = color[z];

						if (Array.isArray(colorVal)) {

							color2 += "[";
							color2 += String.fromCharCode(192 + (colorVal[0] >> 6)) + String.fromCharCode(192 + ((colorVal[0] >> 0) & 63));
							color2 += String.fromCharCode(192 + (colorVal[1] >> 6)) + String.fromCharCode(192 + ((colorVal[1] >> 0) & 63));
							color2 += String.fromCharCode(192 + (colorVal[2] >> 6)) + String.fromCharCode(192 + ((colorVal[2] >> 0) & 63));
							color2 += String.fromCharCode(192 + (colorVal[3] || 0));
							color2 += "]";


						} else {

							color2 += String.fromCharCode(colorVal + 192);
						}
					}
					var prot = cd.protected;
					var textProt = "";
					for (var z = 0; z < cd.textProtected.length; z++) {
						textProt += cd.textProtected[z] ? "1" : "0";
					}

					chunks.push(x, y, char, color2, prot, textProt);
				}
				send(ws, encodeMsgpack({
					chunks: chunks
				}));
			} else if ("ce" == packetType) { // cursor
				if (anonymous.includes(sdata.clientId.toLowerCase())) return;
				if (sdata.worldAttr.private && !sdata.isMember) return;
				if (!isWhitelisted(sdata.authUser)) {
					return;
				}
				if (!sdata.isAuthenticated && sdata.worldAttr.regonly) return;
				if (!sdata.isAuthenticated && adminSettings.l) return;

				if ("l" in data.ce) {
					var x = data.ce.l[0];
					var y = data.ce.l[1];
					sdata.cursorX = san_nbr(x);
					sdata.cursorY = san_nbr(y);
				}
				if ("c" in data.ce) {
					var col = san_nbr(data.ce.c);
					if (col >= 0 && col <= 31) {
						sdata.cursorColor = col;
					}
					if (Array.isArray(data.ce.c)) {
						if (data.ce.c.length >= 3 && data.ce.c.every(c => typeof c === "number" && c >= 0 && c <= 255)) {
							sdata.cursorColor = data.ce.c.slice(0, 3);
						}
					}
				}
				if ("n" in data.ce) {
					sdata.cursorAnon = Boolean(data.ce.n);
				}
				worldBroadcast(sdata.connectedWorldId, encodeMsgpack({
					cu: {
						id: sdata.clientId,
						l: [sdata.cursorX, sdata.cursorY],
						c: sdata.cursorColor,
						n: sdata.cursorAnon ? "" : (sdata.isAuthenticated ? sdata.authUser : ""),
						dn: sdata.displayName || ""
					}
				}), ws);


			} else if ("e" == packetType) { // write edit
				if (editPacketFlood(ws)) {
					ws.close(1008, "Too many edit packets");
					return;
				}
				if (!sdata.isConnected) return;
				if (!isWhitelisted(sdata.authUser)) return;
				var edits = data.e;
				if (!Array.isArray(edits)) return;
				if (edits.length > 64) return;

				if (canvasMuted(sdata) && !settings.adminList.includes(sdata.authUser) && sdata.authUser !== "textwall") {
					send(ws, encodeMsgpack({ alert: "You are muted in canvas" }));
					return;
				}
				if (sdata.worldAttr.regonly && !sdata.isAuthenticated) return;
				if (!sdata.isAuthenticated && adminSettings.l) {
					send(ws, encodeMsgpack({
						alert: "Log in to type/edit or send message."
					}))
					return;
				}

				if (sdata.worldAttr.readonly && !sdata.isMember) return;
				if (sdata.worldAttr.private && !sdata.isMember) return;

				var resp = [];
				var ecount = 0;

				for (var i = 0; i < edits.length; i++) {
					var chunk = edits[i];
					if (!Array.isArray(chunk)) continue;
					if (chunk.length < 5 || chunk.length > 602) return;

					var x = chunk[0], y = chunk[1];
					if (!Number.isInteger(x) || !Number.isInteger(y)) return;

					var obj = [x, y];
					resp.push(obj);

					for (var j = 0; j < Math.floor((chunk.length - 2) / 3); j++) {
					var chr = chunk[j * 3 + 2];
					var idx = chunk[j * 3 + 3];
					var colfmt = chunk[j * 3 + 4];

					if (!Number.isInteger(chr) || !Number.isInteger(idx)) return;
					if (idx > 200) continue;

					if (sdata.worldAttr.disableColor) {
						var isOwner = sdata.isAuthenticated && (
							(sdata.connectedWorldNamespace && sdata.connectedWorldNamespace.toLowerCase() === sdata.authUser.toLowerCase()) ||
							(settings.adminList && settings.adminList.includes(sdata.authUser))
						);
					if (sdata.isMember || isOwner || sdata.isModerator) {
						return;
					}
					colfmt = 0;
					}

						if (chr > 1114111) continue;
						if (chr < 0) continue;
						if (sdata.worldAttr.disableBraille && chr >= 0x2800 && chr <= 0x28FF) continue;
						if (chr >= 0xD800 && chr <= 0xDFFF) continue;

						if (typeof colfmt === "number") {
							if (colfmt > 992) continue;
						}
						else if (Array.isArray(colfmt)) {
						if (colfmt.length < 3 || colfmt.length > 4) continue;
						if (colfmt.length < 4) colfmt.push(0);
						if (typeof colfmt[3] !== "number") continue;
						if (colfmt[3] > 0b1111) continue;
						if (colfmt.some(c => typeof c !== "number" || c < 0 || c > 255)) continue;
						}
						else continue;

						var stat = writeChunk(sdata.connectedWorldId, x, y, idx, chr, colfmt, sdata.isMember, sdata.authUserId || 0, sdata.authUser || "", sdata.clientId, sdata.ipAddr);
						if (stat) {
							obj.push(chr, idx, colfmt);
							ecount++;
						}
					}
				}

				queueEditBroadcast(sdata.connectedWorldId, resp, sdata.clientId);
			}
			else if (packetType === "msg") {
				const rawMsg = data.msg;
				let messageText;
				let channel = "world";
				if (!sdata.isConnected) return;
				if (!isWhitelisted(sdata.authUser)) return;

				if (typeof rawMsg === "string") {
					messageText = rawMsg;
				} else if (Array.isArray(rawMsg)) {
					messageText = rawMsg[0];
					const supplied = rawMsg[1];
					channel = (typeof supplied === "string" && supplied.toLowerCase() === "global") ? "global" : "world";
				} else {
					return;
				}

				if (typeof messageText !== "string" || messageText.length > 256) return;

				let nick = sdata.isAuthenticated ? sdata.authUser : sdata.clientId;
				var isAdmin = settings.adminList.includes(sdata.authUser);

				if (sdata.worldAttr.disableChat && !sdata.isMember && sdata.worldAttr.readonly) return;
				if (!sdata.isAuthenticated && sdata.worldAttr.regonly) return;
				if (!sdata.isAuthenticated && adminSettings.l) {
					send(ws, encodeMsgpack({
						alert: "Log in to type/edit or send message."
					}));
					return;
				}

				const isMuted = chatMutesByIP[sdata.ipAddr] || (sdata.isAuthenticated && chatMutesByUserIDs[sdata.authUserId]);
				if (isMuted && sdata.authUser !== "textwall" && !isAdmin) {
					return send(ws, encodeMsgpack({ msg: ["[SERVER]", 4, "You are muted", true, false, "selected_tab", "", Date.now()] }));
				}
				const sendChannelEncoded = (channelName, payloadObj, excludeWs = null) => {
					const encoded = encodeMsgpack(payloadObj);
					try {
						if (channelName === "global") {
							broadcast(encoded, excludeWs);
						} else {
							worldBroadcast(sdata.connectedWorldId, encoded, excludeWs);
						}

						if (payloadObj && Array.isArray(payloadObj.msg)) {
							const [broadcastNick, , broadcastMsg] = payloadObj.msg;
							const userTag = tags[sdata.authUserId.toString()] || "";
							const colorStr = Array.isArray(sdata.cursorColor) ? sdata.cursorColor.join(",") : String(sdata.cursorColor || "0");
							db.prepare(`
            INSERT INTO chathistory 
            (username, tag, isAdmin, isAuth, color, message, timestamp, world_id, channel) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
								broadcastNick,           // username
								userTag,                 // tag
								sdata.isAdmin == true ? 1 : 0,         // isAdmin
								sdata.isAuthenticated == true ? 1 : 0,              // isAuth
								colorStr,				// color
								broadcastMsg,            // message
								Date.now(),              // timestamp
								sdata.connectedWorldId,  // world_id
								channelName              // channel
							);
						}
					} catch (err) {
						console.error(`sendChannelEncoded ${channelName} error:`, err);
					}
				};
				var tag = "";
				if (sdata.isAuthenticated) {
					const userTags = Object.entries(tags).filter(([userId, _]) => userId === sdata.authUserId.toString()).map(([_, tag]) => tag);
					if (userTags.length > 0) {
						tag = userTags.join(" ");
					}
				}
				const chatPayload = (nickName, colorIndex, msgText, isAuthFlag, isAdminFlag, channelName, displayNick = "") => ({
					msg: [nickName, colorIndex, msgText, !!isAuthFlag, !!isAdminFlag, channelName, displayNick, Date.now(), tag]
				});

				let isCommand = false;
				let commandResponse = "***";

				if (messageText.startsWith("/") && sdata.isAuthenticated && (isAdmin || (sdata.authUser === "textwall" || sdata.isModerator))) {
					isCommand = true;
					const parts = messageText.trim().split(/\s+/);
					const command = parts[0].slice(1).toLowerCase();
					const args = parts.slice(1);
					const target = args[0] ? args[0].toLowerCase() : "";

					const muteCommands = ["mute", "muteuser", "unmute", "unmuteuser", "canvasmute", "canvasmuteuser", "canvasunmute", "canvasunmuteuser", "fullmute", "fullmuteuser", "fullunmute", "fullunmuteuser"];
					const adminOnlyCommands = ["anonymous", "deanonymous", "announcement", "newid", "fakemsg"];

					if (muteCommands.includes(command)) {
						let foundCli = false;
						const isUserCmd = command.includes("user");
						const isUnmute = command.includes("unmute");
						const doChat = !command.includes("canvas");
						const doCanvas = command.includes("canvas") || command.includes("full");

						if (!target) {
							commandResponse = "MUTE NOBODY? OKAY, MUTING NOBODY!";
						} else if (target === sdata.authUser.toLowerCase()) {
							commandResponse = "MUTE YOURSELF? OKAY, SUIT YOURSELF!";
						} else if (target === "textwall" || settings.adminList.includes(target)) {
							commandResponse = "MUTE AN ADMIN? OKAY, SUIT YOURSELF!";
						} else {
							if (isUserCmd) {
								if (!isUnmute) {
									for (let cid in clientRecord) {
										let cli = clientRecord[cid];
										if (cli && cli.authUser.toLowerCase() === target) {
											if (doChat) { chatMutesByUserIDs[cli.authUserId] = [Date.now(), cli.authUser]; muteMutated = true; }
											if (doCanvas) { canvasMutesByUserIDs[cli.authUserId] = [Date.now(), cli.authUser]; canvasMuteMutated = true; }
											foundCli = true;
										}
									}
								} else {
									for (let m in chatMutesByUserIDs) {
										if (doChat && chatMutesByUserIDs[m][1].toLowerCase() === target) {
											delete chatMutesByUserIDs[m]; muteMutated = true; foundCli = true;
										}
									}
									for (let m in canvasMutesByUserIDs) {
										if (doCanvas && canvasMutesByUserIDs[m][1].toLowerCase() === target) {
											delete canvasMutesByUserIDs[m]; canvasMuteMutated = true; foundCli = true;
										}
									}
								}
							} else {
								if (!isUnmute) {
									let cli = clientRecord[target];
									if (cli) {
										if (doChat) { chatMutesByIP[cli.ipAddr] = [Date.now(), cli.clientId]; muteMutated = true; }
										if (doCanvas) { canvasMutesByIP[cli.ipAddr] = [Date.now(), cli.clientId]; canvasMuteMutated = true; }
										foundCli = true;
									}
								} else {
									for (let m in chatMutesByIP) {
										if (doChat && chatMutesByIP[m][1] === target) {
											delete chatMutesByIP[m]; muteMutated = true; foundCli = true;
										}
									}
									for (let m in canvasMutesByIP) {
										if (doCanvas && canvasMutesByIP[m][1] === target) {
											delete canvasMutesByIP[m]; canvasMuteMutated = true; foundCli = true;
										}
									}
								}
							}
							const typeStr = command.includes("canvas") ? "Canvas" : command.includes("full") ? "Fully" : "Chat";
							commandResponse = foundCli ? `${typeStr}-${isUnmute ? "unmuted" : "muted"} - ${target}` : `Client not found - ${target}`;
						}

					} else if (command === "help" || command === "online") {
						if (command === "help") {
							commandResponse = isAdmin
								? `Commands: /mute [id]; /muteuser [name]; /unmute [id]; /unmuteuser [name]; /canvasmute [id]; /canvasmuteuser [name]; /canvasunmute [id]; /canvasunmuteuser [name]; /fullmute [id]; /fullmuteuser [name]; /fullunmute [id]; /fullunmuteuser [name]; /listmutes; /fakemsg [nick] [colorindex] [auth] [msg]; /help; /anonymous; /deanonymous; /announcement [message]; /newid [id]`
								: `Commands: /mute [id]; /muteuser [name]; /unmute [id]; /unmuteuser [name]; /canvasmute [id]; /canvasmuteuser [name]; /canvasunmute [id]; /canvasunmuteuser [name]; /fullmute [id]; /fullmuteuser [name]; /fullunmute [id]; /fullunmuteuser [name]; /listmutes; /help`;
						} else {
							const onlineUsers = Object.values(clients)
								.map(c => c.sdata)
								.filter(c => c?.isConnected)
								.map(c => ({
									n: c.isAuthenticated ? c.authUser : c.clientId,
									w: c.connectedWorldNamespace,
									wn: c.connectedWorldName
								}));

							send(ws, encodeMsgpack({ msg: ["[O]", 10, onlineUsers.length === 1 ? "Online client:" : "Online clients:", true] }));
							onlineUsers.forEach(u => {
								send(ws, encodeMsgpack({ msg: ["[O]", 10, !isAdmin ? u.n : `${u.n} ~${u.w} (${u.wn})`, true] }));
							});
						}

					} else if (adminOnlyCommands.includes(command) && isAdmin) {
						switch (command) {
							case "anonymous":
								if (!settings.adminList.map(a => a.toLowerCase()).includes(sdata.authUser.toLowerCase())) {
									commandResponse = "HAHA NO, YOU CANNOT GO ANONYMOUS!";
								} else {
									onlineCount--;
									try { broadcast(encodeMsgpack({ online: onlineCount }), ws); } catch (e) { console.error(e); }
									try { worldBroadcast(sdata.connectedWorldId, encodeMsgpack({ rc: sdata.clientId }), ws); } catch (e) { console.error(e); }
									delete clients[sdata.clientId];
									setTimeout(() => { anonymous.push(sdata.clientId.toLowerCase()); }, 100);
									commandResponse = "ANONYMOUS MODE: ON";
								}
								break;

							case "deanonymous":
								const idx = anonymous.indexOf(sdata.clientId.toLowerCase());
								if (idx !== -1) {
									onlineCount++;
									try { broadcast(encodeMsgpack({ online: onlineCount }), ws); } catch (e) { console.error(e); }
									clients[sdata.clientId] = ws;
									anonymous.splice(idx, 1);
									commandResponse = "ANONYMOUS MODE: OFF";
								} else {
									commandResponse = "HEY, DUDE DON'T TRY TO BE SLICK!";
								}
								break;

							case "announcement":
								const msg = args.join(" ").trim();
								if (!msg) {
									commandResponse = "SERIOUSLY?! WHAT DO YOU WANNA ANNOUNCE IF YOU DON'T GIVE ME A MESSAGE?";
								} else {
									try {
										broadcast(encodeMsgpack({ msg: ["[ANNOUNCEMENT]", 2, msg, false, false, "global"] }));
										broadcast(encodeMsgpack({ msg: ["[ANNOUNCEMENT]", 2, msg, false, false, "world"] }));
										broadcast(encodeMsgpack({ alert: msg }));
										saveToRecentAnnouncements(msg);
										commandResponse = "Announcement sent";
									} catch (err) {
										console.error(err);
										commandResponse = "ERROR: FAILED TO SEND ANNOUNCEMENT!";
									}
								}
								break;

							case "newid":
								const newId = args[0];
								if (!newId) {
									commandResponse = "HEY! YOU DIDN'T GIVE ME AN ID!"
								} else {
									const oldId = sdata.clientId;
									delete clients[sdata.clientId];
									sdata.clientId = newId.toString();
									sdata[sdata.clientId] = sdata
									clientRecord[sdata.clientId] = sdata;
									delete clientRecord[oldId];
									try { worldBroadcast(sdata.connectedWorldId, encodeMsgpack({ rc: oldId }), ws); } catch (e) { console.error(e); }
									dumpCursors(ws);
									send(ws, encodeMsgpack({ id: sdata.clientId }));
									commandResponse = `Your ID has changed to ${sdata.clientId}`;
								}
								break;
						}
					}

					else if (command === "listmutes") {
						isCommand = true;

						let chatMuteList = [];
						for (let ip in chatMutesByIP) {
							let masked = mask_ip(ip)
							let entry = chatMutesByIP[ip];
							chatMuteList.push(`IP: ${masked} (ID: ${entry[1]})`);
						}
						for (let uid in chatMutesByUserIDs) {
							let entry = chatMutesByUserIDs[uid];
							chatMuteList.push(`UserID: ${uid} (Name: ${entry[1]})`);
						}

						let canvasMuteList = [];
						for (let ip in canvasMutesByIP) {
							let masked = mask_ip(ip)
							let entry = canvasMutesByIP[ip];
							canvasMuteList.push(`IP: ${masked} (ID: ${entry[1]})`);
						}
						for (let uid in canvasMutesByUserIDs) {
							let entry = canvasMutesByUserIDs[uid];
							canvasMuteList.push(`UserID: ${uid} (Name: ${entry[1]})`);
						}
						// compose
						send(ws, encodeMsgpack({ msg: ["[M]", 10, "Chat mutes:", true] }));
						if (chatMuteList.length === 0) {
							send(ws, encodeMsgpack({ msg: ["[M]", 10, "(none)", true] }));
						} else {
							chatMuteList.forEach(m => send(ws, encodeMsgpack({ msg: ["[M]", 10, m, true] })));
						}
						send(ws, encodeMsgpack({ msg: ["[M]", 10, "Canvas mutes:", true] }));
						if (canvasMuteList.length === 0) {
							send(ws, encodeMsgpack({ msg: ["[M]", 10, "(none)", true] }));
						} else {
							canvasMuteList.forEach(m => send(ws, encodeMsgpack({ msg: ["[M]", 10, m, true] })));
						}
						commandResponse = "***";
					}
				}



				if (!isCommand) {
					var isAdmin = settings.adminList.map(a => a.toLowerCase()).includes(sdata.authUser.toLowerCase());
					if (!anonymous.includes(sdata.clientId.toLowerCase())) {



						const payloadObj = chatPayload(nick, sdata.cursorColor, messageText, sdata.isAuthenticated, isAdmin, channel, sdata.displayName === nick ? null : sdata.displayName);

						sendChannelEncoded(channel, payloadObj);
					} else {
						const payloadObj = chatPayload("???", 0, messageText, false, false, channel);
						sendChannelEncoded(channel, payloadObj);
					}
				} else if (commandResponse) {
					send(ws, encodeMsgpack({
						msg: ["[SERVER]", 4, commandResponse, true, false, "selected_tab", "", Date.now()]
					}));
				}
			}
			else if ("register" == packetType) {
				if (sdata.isAuthenticated) return;
				if (!sdata.isAuthenticated && adminSettings.regclosed) {
					send(ws, encodeMsgpack({
						noreg: true
					}))
					return
				}
				var cred = data.register;

				if (!Array.isArray(cred)) return;

				var user = cred[0];
				var pass = cred[1];

				if (typeof user != "string") return;
				if (typeof pass != "string") return;
				if (user.length > 64) return;
				if (pass.length > 64) return;


				var isValid = validateUsername(user);
				if (!isValid) {
					send(ws, encodeMsgpack({
						alert: "Bad username - it must be 1-64 chars and have the following chars: A-Z a-z 0-9 - _ ."
					}));
					return;
				}

				var userObj = db.prepare("SELECT * FROM 'users' WHERE username=? COLLATE NOCASE").get(user);
				if (userObj) {
					send(ws, encodeMsgpack({
						nametaken: true
					}));
				} else {
					var rowid = db.prepare("INSERT INTO users (username, password, date_joined) VALUES (?, ?, ?)").run(user, encryptHash(pass), Date.now()).lastInsertRowid;
					sdata.isAuthenticated = true;
					sdata.authUser = user;
					sdata.authUserId = db.prepare("SELECT id FROM 'users' WHERE rowid=?").get(rowid).id;
					var newToken = generateToken();
					db.prepare("INSERT INTO 'tokens' VALUES(?, ?, ?)").run(newToken, sdata.authUser, sdata.authUserId);
					recordUserLastIp(sdata.authUserId, sdata.ipAddr);
					send(ws, encodeMsgpack({
						token: [user, newToken]
					}));
					sdata.authToken = newToken;

					db.prepare("INSERT INTO 'worlds' VALUES(null, ?, ?, ?)").run(sdata.authUser, "main", JSON.stringify({
						readonly: false,
						private: false,
						hideCursors: false,
						disableChat: false,
						disableColor: false,
						disableBraille: false
					}));
				}



			} else if ("login" == packetType) {
				var cred = data.login;

				if (!Array.isArray(cred)) return;

				var user = cred[0];
				var pass = cred[1];

				if (typeof user != "string") return;
				if (typeof pass != "string") return;
				if (user.length > 64) return;
				if (pass.length > 64) return;

				var userObj = db.prepare("SELECT * FROM 'users' WHERE username=? COLLATE NOCASE").get(user);
				if (userObj) {
					const ban = db.prepare(
						"SELECT * FROM bans WHERE uid=?"
					).get(userObj.id);

					if (ban) {
						if (ban.expires_at !== 0 && Date.now() > ban.expires_at) {
							db.prepare("DELETE FROM bans WHERE uid=?").run(userObj.id);

						} else {
							send(ws, encodeMsgpack({
								accbanned: {
									expiresAt: ban.expires_at,
									reason: ban.reason,
									issuer: ban.issuer
								}
							}));
							return;
						}
					}

					var db_user = userObj.username;
					var db_id = userObj.id;
					var db_pass = userObj.password;
					var isValid = checkHash(db_pass, pass);
					if (isValid) {
						sdata.isAuthenticated = true;
						sdata.authUser = db_user;
						sdata.authUserId = db_id;
						var newToken = generateToken();
						db.prepare("INSERT INTO 'tokens' VALUES(?, ?, ?)").run(newToken, sdata.authUser, sdata.authUserId);
						send(ws, encodeMsgpack({
							token: [sdata.authUser, newToken]
						}));
						sdata.authToken = newToken;
						recordUserLastIp(sdata.authUserId, sdata.ipAddr);
						sdata.isAdmin = settings.adminList.includes(sdata.authUser)
						sdata.isModerator = settings.moderatorList.includes(sdata.authUser)
						send(ws, encodeMsgpack({ admin: sdata.isAdmin }));
						send(ws, encodeMsgpack({ mod: sdata.isModerator }));
						if (sdata.connectedWorldId) {
							var isOwner = sdata.isAuthenticated && (
								(sdata.connectedWorldNamespace && sdata.connectedWorldNamespace.toLowerCase() == sdata.authUser.toLowerCase()) ||
								(settings.adminList && settings.adminList.includes(sdata.authUser))
							);
							if (isOwner) {
								send(ws, encodeMsgpack({
									perms: 2
								}));
								sdata.isMember = true;
								sendOwnerStuff(ws, sdata.connectedWorldId, sdata.connectedWorldNamespace);
							} else {
								/*var world = db.prepare("SELECT * FROM worlds WHERE id=?").get(sdata.connectedWorldId);
								var attr = JSON.parse(world.attributes);*/
								if (sdata.worldAttr.private) {
									evictClient(ws);
									return;
								}
								var memberCheck = db.prepare("SELECT * FROM members WHERE username=? COLLATE NOCASE AND world_id=?").get(sdata.authUser, sdata.connectedWorldId);
								if (memberCheck) {
									send(ws, encodeMsgpack({
										perms: 1
									}));
									sdata.isMember = true;
								}
								if (sdata.isModerator) {
									send(ws, encodeMsgpack({
										perms: 1
									}));
									sdata.isMember = true;
								}
							}
						}

					} else {
						send(ws, encodeMsgpack({
							loginfail: true
						}));
					}
				} else {
					send(ws, encodeMsgpack({
						loginfail: true
					}));
				}
				worldBroadcast(sdata.connectedWorldId, encodeMsgpack({
					cu: {
						id: sdata.clientId,
						l: [sdata.cursorX, sdata.cursorY],
						c: sdata.cursorColor,
						n: sdata.cursorAnon ? "" : (sdata.isAuthenticated ? sdata.authUser : ""),
						dn: sdata.displayName || "",
					}
				}), ws);
			} else if ("token" == packetType) {
				var token = data.token;

				if (!Array.isArray(token)) return;

				var tokenUser = token[0];
				var tokenToken = token[1];

				if (typeof tokenUser != "string") return;
				if (typeof tokenToken != "string") return;
				if (tokenUser.length > 64) return;
				if (tokenToken.length > 128) return;


				var tokenData = db.prepare("SELECT * FROM tokens WHERE token=?").get(tokenToken);
				if (tokenData) {
					var userId = tokenData.user_id;
					send(ws, encodeMsgpack({
						token: [tokenData.username, tokenData.token]
					}));
					sdata.isAuthenticated = true;
					sdata.authUser = tokenData.username;
					sdata.displayName = db.prepare("SELECT display_name FROM display_names WHERE user_id=?")?.get(userId)?.display_name || "";
					sdata.authUserId = userId;
					sdata.authToken = tokenData.token;
					recordUserLastIp(sdata.authUserId, sdata.ipAddr);
					sdata.isAdmin = settings.adminList.includes(sdata.authUser)
					sdata.isModerator = settings.moderatorList.includes(sdata.authUser)
					send(ws, encodeMsgpack({ admin: sdata.isAdmin }));
					send(ws, encodeMsgpack({ mod: sdata.isModerator }));

					dumpCursors(ws);
				} else {
					send(ws, encodeMsgpack({
						tokenfail: true
					}));
				}
			} else if ("logout" == packetType) {
				if (sdata.authToken) {
					db.prepare("DELETE FROM tokens WHERE token=?").run(sdata.authToken);
				}
				send(ws, encodeMsgpack({
					perms: 0
				}));
				sdata.isAdmin = false;
				sdata.isModerator = false;
				send(ws, encodeMsgpack({ admin: false }));
				send(ws, encodeMsgpack({ mod: false }));
				sdata.isAuthenticated = false;
				sdata.authUser = "";
				sdata.authUserId = 0;
				sdata.isMember = false;
				sdata.displayName = "";
				worldBroadcast(sdata.connectedWorldId, encodeMsgpack({
					cu: {
						id: sdata.clientId,
						l: [sdata.cursorX, sdata.cursorY],
						c: sdata.cursorColor,
						n: sdata.cursorAnon ? "" : (sdata.isAuthenticated ? sdata.authUser : ""),
						dn: "",
					}
				}), ws);

			} else if ("addmem" == packetType) {
				var member = data.addmem;

				if (typeof member != "string") return;
				if (member.length > 64) return;

				if (sdata.isAuthenticated && sdata.connectedWorldNamespace && sdata.connectedWorldNamespace.toLowerCase() == sdata.authUser.toLowerCase()) {
					var exists = db.prepare("SELECT * FROM members WHERE username=? AND world_id=? COLLATE NOCASE").get(member, sdata.connectedWorldId);
					if (!exists) {
						db.prepare("INSERT INTO members VALUES(?, ?)").run(sdata.connectedWorldId, member);
						send(ws, encodeMsgpack({
							addmem: member
						}));
					}
				}
			} else if ("rmmem" == packetType) {
				var member = data.rmmem;

				if (typeof member != "string") return;
				if (member.length > 64) return;

				if (sdata.isAuthenticated && sdata.connectedWorldNamespace && sdata.connectedWorldNamespace.toLowerCase() == sdata.authUser.toLowerCase()) {
					db.prepare("DELETE FROM members WHERE world_id=? AND username=? COLLATE NOCASE").run(sdata.connectedWorldId, member);
				}
			} else if ("deleteaccount" == packetType) {
				var pass = data.deleteaccount;

				if (typeof pass != "string") return;
				if (pass.length > 64) return;

				var tokenData = db.prepare("SELECT * FROM tokens WHERE token=?").get(sdata.authToken);
				if (tokenData) {
					var user_id = tokenData.user_id;
					var account = db.prepare("SELECT * FROM users WHERE id=?").get(user_id);
					if (account) {
						var db_pass = account.password;
						var isValid = checkHash(db_pass, pass);
						if (isValid) {
							db.prepare("DELETE FROM users WHERE id=?").run(account.id);
							db.prepare("UPDATE worlds SET namespace=? WHERE namespace=?").run("del-" + Math.random() + "-" + account.username, account.username);
							db.prepare("DELETE FROM tokens WHERE token=?").run(sdata.authToken);
							send(ws, encodeMsgpack({
								accountdeleted: true
							}));
							sdata.authToken = "";
							sdata.isAuthenticated = false;
							sdata.authUser = "";
							sdata.authUserId = 0;
							sdata.isMember = false;
							sdata.connectedWorldNamespace = "textwall";
							sdata.connectedWorldName = "main";
							sdata.connectedWorldId = 1;
							send(ws, encodeMsgpack({
								perms: 0
							}));
						} else {
							send(ws, encodeMsgpack({
								wrongpass: true
							}));
						}
					}
				}
			} else if ("ro" == packetType) { // readonly
				var isOwner = sdata.isAuthenticated && (
					(sdata.connectedWorldNamespace && sdata.connectedWorldNamespace.toLowerCase() == sdata.authUser.toLowerCase()) ||
					(settings.adminList && settings.adminList.includes(sdata.authUser))
				);
				if (!isOwner) return;
				editWorldAttr(sdata.connectedWorldId, "readonly", Boolean(data.ro));
				worldBroadcast(sdata.connectedWorldId, encodeMsgpack({
					ro: Boolean(data.ro)
				}));
			} else if ("priv" == packetType) { // private
				var isOwner = sdata.isAuthenticated && (
					(sdata.connectedWorldNamespace && sdata.connectedWorldNamespace.toLowerCase() == sdata.authUser.toLowerCase()) ||
					(settings.adminList && settings.adminList.includes(sdata.authUser))
				);
				if (!isOwner) return;
				editWorldAttr(sdata.connectedWorldId, "private", Boolean(data.priv));
				worldBroadcast(sdata.connectedWorldId, encodeMsgpack({
					priv: Boolean(data.priv)
				}));
			} else if ("ch" == packetType) { // hide cursors
				var isOwner = sdata.isAuthenticated && (
					(sdata.connectedWorldNamespace && sdata.connectedWorldNamespace.toLowerCase() == sdata.authUser.toLowerCase()) ||
					(settings.adminList && settings.adminList.includes(sdata.authUser))
				);
				if (!isOwner) return;
				editWorldAttr(sdata.connectedWorldId, "hideCursors", Boolean(data.ch));
				worldBroadcast(sdata.connectedWorldId, encodeMsgpack({
					ch: Boolean(data.ch)
				}));
			} else if ("dc" == packetType) { // disable chat
				var isOwner = sdata.isAuthenticated && (
					(sdata.connectedWorldNamespace && sdata.connectedWorldNamespace.toLowerCase() == sdata.authUser.toLowerCase()) ||
					(settings.adminList && settings.adminList.includes(sdata.authUser))
				);
				if (!isOwner) return;
				editWorldAttr(sdata.connectedWorldId, "disableChat", Boolean(data.dc));
				worldBroadcast(sdata.connectedWorldId, encodeMsgpack({
					dc: Boolean(data.dc)
				}));
			} else if ("dcl" == packetType) { // disable color
				var isOwner = sdata.isAuthenticated && (
					(sdata.connectedWorldNamespace && sdata.connectedWorldNamespace.toLowerCase() == sdata.authUser.toLowerCase()) ||
					(settings.adminList && settings.adminList.includes(sdata.authUser))
				);
				if (!isOwner) return;
				editWorldAttr(sdata.connectedWorldId, "disableColor", Boolean(data.dcl));
				worldBroadcast(sdata.connectedWorldId, encodeMsgpack({
					dcl: Boolean(data.dcl)
				}));
			} else if ("db" == packetType) { // disable braille
				var isOwner = sdata.isAuthenticated && (
					(sdata.connectedWorldNamespace && sdata.connectedWorldNamespace.toLowerCase() == sdata.authUser.toLowerCase()) ||
					(settings.adminList && settings.adminList.includes(sdata.authUser))
				);
				if (!isOwner) return;
				editWorldAttr(sdata.connectedWorldId, "disableBraille", Boolean(data.db));
				worldBroadcast(sdata.connectedWorldId, encodeMsgpack({
					db: Boolean(data.db)
				}));
			} else if ("un" == packetType) { // unlisted
				var isOwner = sdata.isAuthenticated && (
					(sdata.connectedWorldNamespace && sdata.connectedWorldNamespace.toLowerCase() == sdata.authUser.toLowerCase()) ||
					(settings.adminList && settings.adminList.includes(sdata.authUser))
				);
				if (!isOwner) return;
				editWorldAttr(sdata.connectedWorldId, "unlisted", Boolean(data.un));
				worldBroadcast(sdata.connectedWorldId, encodeMsgpack({
					un: Boolean(data.un)
				}));
			} else if ("nsfw" == packetType) { // nsfw
				var isOwner = sdata.isAuthenticated && (
					(sdata.connectedWorldNamespace && sdata.connectedWorldNamespace.toLowerCase() == sdata.authUser.toLowerCase()) ||
					(settings.adminList && settings.adminList.includes(sdata.authUser))
				);
				if (!isOwner) return;
				editWorldAttr(sdata.connectedWorldId, "nsfw", Boolean(data.nsfw));
				worldBroadcast(sdata.connectedWorldId, encodeMsgpack({
					nsfw: Boolean(data.nsfw)
				}));
			} else if ("regonly" == packetType) { // registered users only

				var isOwner = sdata.isAuthenticated && (
					(sdata.connectedWorldNamespace && sdata.connectedWorldNamespace.toLowerCase() == sdata.authUser.toLowerCase()) ||
					(settings.adminList && settings.adminList.includes(sdata.authUser))
				);
				if (!isOwner) return;
				editWorldAttr(sdata.connectedWorldId, "regonly", Boolean(data.regonly));
				worldBroadcast(sdata.connectedWorldId, encodeMsgpack({
					regonly: Boolean(data.regonly)
				}));
			} else if ("theme" === packetType) { // webhook
				var themeData = data.theme;
				if (!Array.isArray(themeData)) themeData = [false, null, null];

				editWorldAttr(sdata.connectedWorldId, "theme", themeData);
				worldBroadcast(sdata.connectedWorldId, encodeMsgpack({ theme: themeData }));

			} else if ("webhook" == packetType) { // webhook
				var isOwner = sdata.isAuthenticated && (
					(sdata.connectedWorldNamespace && sdata.connectedWorldNamespace.toLowerCase() == sdata.authUser.toLowerCase()) ||
					(settings.adminList && settings.adminList.includes(sdata.authUser))
				);
				if (!isOwner) return;
				var checked = Boolean(data.webhook);
				if (checked) {
					var newApiKey = generateWebhookToken();
					db.prepare("INSERT INTO webhooks VALUES(?, ?)").run(sdata.connectedWorldId, newApiKey);
					send(ws, encodeMsgpack({
						webhook: [checked, newApiKey]
					}));
					editWorldAttr(sdata.connectedWorldId, "webhook", [checked, newApiKey]);
				} else {
					db.prepare("DELETE FROM webhooks WHERE world_id=?").run(sdata.connectedWorldId);
					send(ws, encodeMsgpack({
						webhook: [checked, null]
					}));
					editWorldAttr(sdata.connectedWorldId, "webhook", [checked, null]);
				}
				worldBroadcast(sdata.connectedWorldId, encodeMsgpack({
					webhook: [checked, null]
				}), ws);
			} if ("p" == packetType) { // protect
				var pos = data.p;
				if (typeof pos != "string") return;
				pos = pos.split(",");
				if (pos.length != 2) return;
				x = san_nbr(pos[0]);
				y = san_nbr(pos[1]);
				if (x % 20 != 0) return;
				if (y % 10 != 0) return;
				x /= 20;
				y /= 10;
				if (!sdata.isMember && !sdata.isModerator) {
					return;
				}
				var prot = toggleProtection(sdata.connectedWorldId, x, y);
				if (settings.log.enabled) {
					fs.appendFile(settings.log.path, `protect;time=${new Date().toLocaleString()};newstate=${prot};worldid=${sdata.connectedWorldId};x=${x};y=${y};ip=${ipAddr};user=${sdata.authUser};worldnamespace=${sdata.connectedWorldNamespace};worldname=${sdata.connectedWorldName}\n`, function () { });
				}
				worldBroadcast(sdata.connectedWorldId, encodeMsgpack({
					p: [(x * 20) + "," + (y * 10), Boolean(prot)]
				}));
			} else if ("tp" == packetType) { // text protect
				/*
				var pos = data.tp;
				if (typeof pos != "string") return;
				
				pos = pos.split(",");
				// console.log(pos);
				if (pos.length != 2) return;
				
				x = san_nbr(pos[0]);
				y = san_nbr(pos[1]);
				y += 1;
				
				if (!sdata.isMember) return;
				
				var chunkX = Math.floor(x / 20);
				var chunkY = Math.floor(y / 10);
				
				var tileX = x % 20;
				var tileY = y % 10;
				
				var idx = tileY * 20 + tileX;
				
				var prot = toggleCellProtection(
					sdata.connectedWorldId,
					chunkX,
					chunkY,
					idx
				);
				
				if (settings.log.enabled) {
					fs.appendFile(
						settings.log.path,
						`textprotect;time=${new Date().toLocaleString()};newstate=${prot};worldid=${sdata.connectedWorldId};x=${x};y=${y};idx=${idx};ip=${ipAddr};user=${sdata.authUser};worldnamespace=${sdata.connectedWorldNamespace};worldname=${sdata.connectedWorldName}\n`,
						function () { }
					);
				}
				
				worldBroadcast(
					sdata.connectedWorldId,
					encodeMsgpack({
						tp: [x + "," + y, Boolean(prot)]
					})
				);
				*/
				send(ws, encodeMsgpack({
					not_implemented: "Text protection is not implemented yet."
				}));
			} else if ("dw" == packetType) {
				var isOwner = sdata.isAuthenticated && (
					(sdata.connectedWorldNamespace && sdata.connectedWorldNamespace.toLowerCase() == sdata.authUser.toLowerCase()) ||
					(settings.adminList && settings.adminList.includes(sdata.authUser))
				);
				if (!isOwner) return;
				db.prepare("UPDATE worlds SET namespace=? WHERE id=?").run("del-" + Math.random(), sdata.connectedWorldId);
				var kWorld = sdata.connectedWorldId;
				wss.clients.forEach(function (sock) {
					if (!sock || !sock.sdata) return;
					if (sock.sdata.connectedWorldId == kWorld) {
						evictClient(sock);
					}
				});
			} else if ("namechange" == packetType) {
				var set = data.namechange;

				if (!Array.isArray(set)) return;

				var newUser = set[0];
				var pass = set[1];

				if (typeof newUser != "string") return;
				if (typeof pass != "string") return;
				if (newUser.length > 64) return;
				if (pass.length > 128) return;

				var isValid = validateUsername(newUser);
				if (!isValid) {
					send(ws, encodeMsgpack({
						alert: "Bad username - it must be 1-64 chars and have the following chars: A-Z a-z 0-9 - _ ."
					}));
					return;
				}


				var tokenData = db.prepare("SELECT * FROM tokens WHERE token=?").get(sdata.authToken);
				if (tokenData) {
					var user_id = tokenData.user_id;
					var account = db.prepare("SELECT * FROM users WHERE id=?").get(user_id);
					if (account) {
						var db_pass = account.password;
						var isValidHash = checkHash(db_pass, pass);
						if (isValidHash) {
							var userCheck = db.prepare("SELECT * FROM users WHERE username=? COLLATE NOCASE").get(newUser);
							if (userCheck) {
								send(ws, encodeMsgpack({
									nametaken: true
								}));
							} else {
								var oldUser = account.username;
								db.prepare("UPDATE users SET username=? WHERE id=?").run(newUser, sdata.authUserId);
								sdata.authUser = newUser;
								send(ws, encodeMsgpack({
									namechanged: newUser
								}));
								db.prepare("UPDATE worlds SET namespace=? WHERE namespace=? COLlATE NOCASE").run(newUser, oldUser);
								db.prepare("UPDATE tokens SET username=? WHERE user_id=?").run(newUser, account.id);
								var kWorld = sdata.connectedWorldId;
								wss.clients.forEach(function (sock) {
									if (!sock || !sock.sdata) return;
									if (sock.sdata.connectedWorldNamespace && sock.sdata.connectedWorldNamespace.toLowerCase() == oldUser.toLowerCase()) {
										evictClient(sock);
									}
								});
							}
						} else {
							send(ws, encodeMsgpack({
								wrongpass: true
							}));
						}
					}
				}
			} else if ("passchange" == packetType) {
				var set = data.passchange;

				if (!Array.isArray(set)) return;

				var oldPass = set[0];
				var newPass = set[1];

				if (typeof oldPass != "string") return;
				if (typeof newPass != "string") return;
				if (oldPass.length > 64) return;
				if (newPass.length > 128) return;


				var tokenData = db.prepare("SELECT * FROM tokens WHERE token=?").get(sdata.authToken);
				if (tokenData) {
					var user_id = tokenData.user_id;
					var account = db.prepare("SELECT * FROM users WHERE id=?").get(user_id);
					if (account) {
						var db_pass = account.password;
						var isValid = checkHash(db_pass, oldPass);
						if (isValid) {
							db.prepare("UPDATE users SET password=? WHERE id=?").run(encryptHash(newPass), user_id);
							send(ws, encodeMsgpack({
								passchanged: true
							}));
						}
					} else {
						send(ws, encodeMsgpack({
							wrongpass: true
						}));
					}
				}
			} else if ("c" == packetType) {
				var pos = data.c;

				if (!Array.isArray(pos)) return;

				var x = pos[0];
				var y = pos[1];

				if (!Number.isInteger(x)) return;
				if (!Number.isInteger(y)) return;

				if (x % 20 != 0) return;
				if (y % 10 != 0) return;
				x /= 20;
				y /= 10;
				x = Math.floor(x);
				y = Math.floor(y);
				if (!sdata.isMember && !sdata.isModerator) {
					return;
				}
				clearChunk(sdata.connectedWorldId, x, y);
				if (settings.log.enabled) {
					fs.appendFile(settings.log.path, `clearchunk;time=${new Date().toLocaleString()};worldid=${sdata.connectedWorldId};x=${x};y=${y};ip=${ipAddr};user=${sdata.authUser};worldnamespace=${sdata.connectedWorldNamespace};worldname=${sdata.connectedWorldName}\n`, function () { });
				}
				worldBroadcast(sdata.connectedWorldId, encodeMsgpack({
					c: [x * 20, y * 10, x * 20 + 20 - 1, y * 10 + 10 - 1]
				}));
			} else if ("ping" == packetType) {
				// Pong!
				send(ws, encodeMsgpack({
					pong: true
				}));
			} else if ("nick" == packetType) {
				var newNick = data.nick.trim();
				if (typeof newNick != "string") return;
				if (newNick.length > 64) return;

				// make new nick for user
				db.prepare("INSERT OR REPLACE INTO display_names (user_id, display_name) VALUES ((SELECT id FROM users WHERE username=? COLLATE NOCASE), ?)").run(sdata.authUser, newNick);
				sdata.displayName = newNick;
				send(ws, encodeMsgpack({
					dn: newNick
				}));
				dumpCursors(ws);
			} else
				if (packetType === "type") {
					const userId = sdata.userId;
					const channel = data.chatChannel || "world";
					const key = (channel === "global") ? "global" : sdata.connectedWorldId;
					const isTyping = Boolean(data.typing);

					if (!typingUsers[key]) typingUsers[key] = {};

					if (typingUsers[key][userId]?.timeoutId) {
						clearTimeout(typingUsers[key][userId].timeoutId);
					}

					if (isTyping) {

						const displayName = (sdata.displayName && sdata.displayName.trim() !== "")
							? sdata.displayName
							: (sdata.authUser || `${sdata.clientId}`);

						typingUsers[key][userId] = {
							id: userId,
							name: displayName,
							timeoutId: setTimeout(() => {
								delete typingUsers[key][userId];
								broadcastTyping(key, channel);
							}, 5000)
						};
					} else {
						delete typingUsers[key][userId];
					}

					broadcastTyping(key, channel);
				}

				else if ("cmd" == packetType) {
					const cmd = data.cmd;
					const id = cmd.sendId || true;
					const cmdData = cmd.data;
					if (typeof cmdData != "string") return;
					const payload = {
						cmd: {
							data: cmdData
						}
					};
					if (id) {
						payload.cmd.id = sdata.clientId;
					}
					if (sdata.connectedWorldId) {
						command_output_broadcast(sdata.connectedWorldId, payload);
					}
				} else if ("cmd_opt" == packetType) {
					const enabled = data.cmd_opt;
					sdata.command_output_enabled = enabled;
				} else if (packetType === "ban") {
					if (!sdata.isAdmin) return;

					const banData = data.ban;

					if (!Array.isArray(banData)) return;
					if (banData.length < 5) return;

					const [expiresAt, reason, issuer, type, value] = banData;

					if (typeof reason !== "string") return;
					if (typeof issuer !== "string") return;
					if (typeof value !== "string") return;

					if (type !== "username" && type !== "userId") return;

					let uidToBan = null;

					if (type === "username") {
						const user = db.prepare(
							"SELECT * FROM users WHERE username=? COLLATE NOCASE"
						).get(value);

						if (!user) return;
						uidToBan = user.id;
					} else {
						const user = db.prepare(
							"SELECT * FROM users WHERE id=?"
						).get(value);

						if (!user) return;
						uidToBan = user.id;
					}

					db.prepare(`
        INSERT INTO bans (uid, expires_at, reason, issuer)
        VALUES (?, ?, ?, ?)
    `).run(uidToBan, expiresAt, reason, issuer);

					wss.clients.forEach(sock => {
						if (!sock?.sdata) return;
						if (sock.sdata.authUserId === uidToBan) {
							evictClient(sock);
						}
					});
				}
				else if (packetType === "unban") {
					if (!sdata.isAdmin) return;

					const unbanData = data.unban;
					if (!Array.isArray(unbanData)) return;
					if (unbanData.length < 2) return;

					const [type, value] = unbanData;

					if (type !== "username" && type !== "userId") return;
					if (typeof value !== "string") return;

					let user = null;

					if (type === "username") {
						user = db.prepare(
							"SELECT id FROM users WHERE username=? COLLATE NOCASE"
						).get(value);
					} else {
						const id = Number(value);
						if (!Number.isInteger(id)) return;

						user = db.prepare(
							"SELECT id FROM users WHERE id=?"
						).get(id);
					}

					if (!user) return;

					db.prepare(
						"DELETE FROM bans WHERE uid=?"
					).run(user.id);
				}


				else {
					//console.log(data);
				}

		});

		ws.on("close", function () {
			closed = true;
			onlineCount--;
			anonymous = anonymous.filter(a => a != sdata.clientId);

			broadcast(encodeMsgpack({
				online: onlineCount
			}), ws);

			delete clients[sdata.clientId];
			// admin couldve changed their id
			delete clients[sdata.newClientId]
			if (sdata && sdata.isConnected) {
				worldBroadcast(sdata.connectedWorldId, encodeMsgpack({
					rc: sdata.clientId
				}), ws);

			}


			connObj[0]--;
		});
		ws.on("error", function () {
			console.log("Client error");
		});

	});
}


async function initServer() {
	function ensureTable(name, sql) {
		const exists = db.prepare(`
        SELECT name
        FROM sqlite_master
        WHERE type='table' AND name=?
    `).get(name);

		if (!exists) {
			db.prepare(sql).run();
		}
	}

	function ensureColumn(table, column, type) {
		const cols = db.prepare(`PRAGMA table_info(${table})`).all();
		if (!cols.some(c => c.name === column)) {
			db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`).run();
		}
	}

	function ensureIndex(name, sql) {
		const exists = db.prepare(`
        SELECT name
        FROM sqlite_master
        WHERE type='index' AND name=?
    `).get(name);

		if (!exists) {
			db.prepare(sql).run();
		}
	}

	/* =========================
	   TABLES
	========================= */

	ensureTable("display_names", `
    CREATE TABLE display_names (
        user_id INTEGER PRIMARY KEY,
        display_name TEXT
    )
`);

	ensureTable("admin_sessions", `
    CREATE TABLE admin_sessions (
        username TEXT,
        token TEXT,
        expires_at INTEGER
    )
`);

	ensureTable("server_info", `
    CREATE TABLE server_info (
        name TEXT,
        value TEXT
    )
`);

	ensureTable("worlds", `
    CREATE TABLE worlds (
        id INTEGER PRIMARY KEY,
        namespace TEXT,
        name TEXT,
        attributes TEXT
    )
`);

	ensureTable("users", `
    CREATE TABLE users (
        id INTEGER PRIMARY KEY,
        username TEXT,
        password TEXT,
        date_joined INTEGER,
        last_ip TEXT,
        last_ip_at INTEGER
    )
`);
	ensureColumn("users", "last_ip", "TEXT");
	ensureColumn("users", "last_ip_at", "INTEGER");

	ensureTable("tokens", `
    CREATE TABLE tokens (
        token TEXT,
        username TEXT,
        user_id INTEGER NOT NULL
    )
`);

	ensureTable("members", `
    CREATE TABLE members (
        world_id INTEGER,
        username TEXT
    )
`);

	ensureTable("chunks", `
    CREATE TABLE chunks (
        world_id INTEGER NOT NULL,
        x INTEGER NOT NULL,
        y INTEGER NOT NULL,
        text TEXT,
        colorFmt TEXT,
        protected INTEGER,
        text_protected TEXT,
        editors TEXT
    )
`);
	ensureColumn("chunks", "editors", "TEXT");

	ensureTable("edit_history", `
    CREATE TABLE edit_history (
        id INTEGER PRIMARY KEY,
        ts INTEGER NOT NULL,
        world_id INTEGER NOT NULL,
        chunk_x INTEGER NOT NULL,
        chunk_y INTEGER NOT NULL,
        cell_idx INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        username TEXT,
        prev_char INTEGER NOT NULL,
        prev_color TEXT NOT NULL,
        new_char INTEGER NOT NULL,
        new_color TEXT NOT NULL,
        client_id TEXT,
        ip TEXT
    )
`);
	ensureColumn("edit_history", "client_id", "TEXT");
	ensureColumn("edit_history", "ip", "TEXT");

	ensureTable("bans", `
    CREATE TABLE bans (
        uid INTEGER PRIMARY KEY,
        expires_at INTEGER,
        reason TEXT,
        issuer TEXT
    )
`);
	ensureTable("chathistory", `
    CREATE TABLE chathistory (
        username TEXT NOT NULL,
        tag TEXT NOT NULL,
        isAdmin INTEGER NOT NULL,
        isAuth INTEGER NOT NULL,
        color TEXT NOT NULL,
        message TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        world_id INTEGER NOT NULL,
        channel TEXT NOT NULL
    )
`);
	ensureTable("webhooks", `
		CREATE TABLE webhooks (
		world_id INTEGER PRIMARY KEY,
		api_key TEXT NOT NULL
	)
		`)

	/* =========================
	   INDEXES
	========================= */

	ensureIndex("ic", `
    CREATE INDEX ic ON chunks (world_id, x, y)
`);

	ensureIndex("ieh_ts", `
    CREATE INDEX ieh_ts ON edit_history (ts)
`);

	ensureIndex("ieh_user_ts", `
    CREATE INDEX ieh_user_ts ON edit_history (user_id, ts)
`);

	ensureIndex("ieh_client_ts", `
    CREATE INDEX ieh_client_ts ON edit_history (client_id, ts)
`);

	ensureIndex("iu", `
    CREATE INDEX iu ON users (username)
`);

	ensureIndex("it", `
    CREATE INDEX it ON tokens (token)
`);

	ensureIndex("im", `
    CREATE INDEX im ON members (world_id)
`);

	ensureIndex("im2", `
    CREATE INDEX im2 ON members (world_id, username)
`);

	ensureIndex("iw", `
    CREATE INDEX iw ON worlds (namespace)
`);

	ensureIndex("iw2", `
    CREATE INDEX iw2 ON worlds (namespace, name)
`);

	const mainWorld = db.prepare(`
    SELECT id FROM worlds
    WHERE namespace=? AND name=?
`).get("textwall", "main");

	if (!mainWorld) {
		db.prepare(`
        INSERT INTO worlds
        VALUES (null, ?, ?, ?)
    `).run(
			"textwall",
			"main",
			JSON.stringify({
				readonly: false,
				private: false,
				hideCursors: false,
				disableChat: false,
				disableColor: false,
				disableBraille: false
			})
		);
	}
	schemaReady = true;
	runserver();
}
initServer();
function writeText(text, startX, startY, color, wid, isMember = true) {
	const CHUNK_WIDTH = 20;
	const CHUNK_HEIGHT = 10;
	const resp = [];

	for (let i = 0; i < text.length; i++) {
		const x = startX + i;
		const y = startY;
		const chr = text.charCodeAt(i);
		if (chr === 0 || (chr >= 0xD800 && chr <= 0xDFFF)) continue;

		const chunkX = Math.floor(x / CHUNK_WIDTH);
		const chunkY = Math.floor(y / CHUNK_HEIGHT);

		const localX = x % CHUNK_WIDTH;
		const localY = y % CHUNK_HEIGHT;
		const idx = localY * CHUNK_WIDTH + localX;

		const stat = writeChunk(wid, chunkX, chunkY, idx, chr, color, isMember, 0, "system");
		if (!stat) continue;
		let chunk = resp.find(c => c[0] === chunkX && c[1] === chunkY);
		if (!chunk) {
			chunk = [chunkX, chunkY];
			resp.push(chunk);
		}
		chunk.push(chr, idx, color);
	}

	queueEditBroadcast(wid, resp);

	return true;
}
function toggleProtectionV2(worldId, chunkX, chunkY) {

	chunkX = Math.floor(chunkX);
	chunkY = Math.floor(chunkY);

	const tuple = `${worldId},${chunkX},${chunkY}`;
	const chunk = getChunk(worldId, chunkX, chunkY, true);
	chunk.protected = !chunk.protected;
	modifiedChunks[tuple] = true;
	const broadcastX = chunkX * 20;
	const broadcastY = chunkY * 10;
	worldBroadcast(worldId, encodeMsgpack({
		p: [`${broadcastX},${broadcastY}`, Boolean(chunk.protected)]
	}));

	return chunk.protected;
}
function clearChunkV2(worldId, chunkX, chunkY, isMember = true) {
	chunkX = Math.floor(chunkX);
	chunkY = Math.floor(chunkY);
	const chunk = getChunk(worldId, chunkX, chunkY, true);
	if (!chunk) return false;
	if (!isMember && chunk.protected) return false;
	chunk.char = Array(20 * 10).fill(String.fromCodePoint(32)); // empty space
	chunk.color = Array(20 * 10).fill(0); // default color
	modifiedChunks[`${worldId},${chunkX},${chunkY}`] = true;
	worldBroadcast(worldId, encodeMsgpack({
		c: [
			chunkX * 20,
			chunkY * 10,
			chunkX * 20 + 19, // max x in chunk
			chunkY * 10 + 9   // max y in chunk
		]
	}));

	return true;
}
var banInt = setInterval(() => {
	const now = Date.now();
	db.prepare(`
        DELETE FROM bans
        WHERE expires_at > 0 AND expires_at <= ?
    `).run(now);

	const activeBans = db.prepare("SELECT uid FROM bans").all().map(b => b.uid);

	wss.clients.forEach(ws => {
		if (!ws.sdata) return;

		if (ipBans.includes(ws.sdata.ipAddr)) {
			ws.close(1000, "IP-banned");
			return;
		}

		if (ws.sdata.isAuthenticated && activeBans.includes(ws.sdata.authUserId)) {
			send(ws, encodeMsgpack({
				alert: "Your account has been banned."
			}))
		}
	});
}, 1000);


process.once("SIGINT", function () {
	console.log("Server is closing, saving...");

	clearInterval(memClrInterval);
	clearInterval(saveMuteInterval);
	clearInterval(banInt);
	clearInterval(editBroadcastInterval);
	flushEditBroadcasts();
	commitChunks();
	if (wss && wss.clients) {
		wss.clients.forEach(e => e.close(1000, "Server shutting down"));
	}
	process.exit();
});

loadAdminSessions();
