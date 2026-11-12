import { MarkupGuildNavigationTypes, MarkupTimestampStyles } from '../constants';


export const Strings = Object.freeze({
  BOLD: '**',
  CODEBLOCK: '```',
  CODESTRING: '`',
  CODESTRING_DOUBLE: '``',
  ESCAPE: '\\',
  HEADER: '#',
  ITALICS: '_',
  LIST: '-',
  QUOTE: '>',
  SPOILER: '||',
  STRIKE: '~~',
  SUBTEXT: '-#',
  UNDERLINE: '__',
});

export const Regexes = Object.freeze({
  [Strings.BOLD]: /\*\*/g,
  [Strings.CODEBLOCK]: new RegExp(Strings.CODEBLOCK, 'g'),
  [Strings.CODESTRING]: new RegExp(Strings.CODESTRING, 'g'),
  [Strings.ESCAPE]: /\\/g,
  // `m` so every line's start gets escaped, not just the text's
  [Strings.HEADER]: /^(\s*)#/gm,
  [Strings.ITALICS]: /(_|\*)/g,
  [Strings.LIST]: /(-|\*)/g,
  [Strings.QUOTE]: />/g,
  [Strings.SPOILER]: /\|\|/g,
  [Strings.STRIKE]: new RegExp(Strings.STRIKE, 'g'),
  [Strings.SUBTEXT]: /^(\s*)(-?#)/gm,
  [Strings.UNDERLINE]: new RegExp(Strings.UNDERLINE, 'g'),
  EVERYONE: /@(everyone|here)/g,
  LINK: /\]\(/g,
  // list markers at the start of a line (`- `, `* `, `1. `)
  LIST_LINE_START: /^(\s*)([-*]|\d+\.)(?=\s)/gm,
  MENTION: /<@([!&]?[0-9]{16,21})>/g,
  MENTION_HARDCORE: /@/g,
  // a `_` that isn't part of a `__`
  UNDERSCORE_LONE: /(?<!_)_(?!_)/g,
  // a lone `|`/`~` next to the closing marker would leave one outside of it
  PIPES: /\|\|?/g,
  // only a `>` at the start of a line is a quote, the rest are emojis/channels/timestamps
  QUOTE_LINE_START: /^(\s*)>/gm,
  TILDES: /~~?/g,
  // anything that would end the link's url early (`\` escapes the `)`, `>` gets read as `<url>`'s end)
  URL: /[()<>\s\\]/g,
  // how discord autolinks, markdown inside these isn't parsed so escaping them only puts backslashes in the link
  URL_BARE: /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g,
});

export const Replacements = Object.freeze({
  [Strings.BOLD]: '\\*\\*',
  [Strings.CODEBLOCK]: '``\u200b`',
  [Strings.CODESTRING]: '\\`',
  [Strings.ESCAPE]: '\\\\',
  [Strings.HEADER]: '$1\\#',
  [Strings.ITALICS]: '\\$1',
  [Strings.LIST]: '\\$1',
  [Strings.QUOTE]: '\\>',
  QUOTE_LINE_START: '$1\\>',
  [Strings.SPOILER]: '\\|\\|',
  [Strings.STRIKE]: '\\~\\~',
  [Strings.SUBTEXT]: '$1\\$2',
  [Strings.UNDERLINE]: '\\_\\_',
  MENTION: '\u200b',
});


export interface MarkupFilter {
  limit: number,
  links: boolean,
  mentions: boolean,
  mentionEscapeCharacter: string,
  replacement: string,
  urls?: boolean,
}

export interface MarkupFilterOptions {
  limit?: number,
  links?: boolean,
  mentions?: boolean,
  mentionEscapeCharacter?: string,
  replacement?: string,
  // `escape.all` only, stops urls (and the invite/store previews discord makes out of them) from working
  urls?: boolean,
}

const defaultMarkupFilter: MarkupFilter = Object.freeze({
  limit: 2000,
  links: true,
  mentions: true,
  mentionEscapeCharacter: '\u200b',
  replacement: '',
});


// `limit` is for the whole output (it's 4000 sometimes), so take out what the wrapper adds around the text
function textLimit(options: MarkupFilterOptions, wrapping: number = 0): number {
  const limit = (options.limit === undefined) ? defaultMarkupFilter.limit : options.limit;
  return Math.max(limit - wrapping, 0);
}

// puts a zero width space after the text when its end would get read as part of the marker that comes right after it
// (a backslash can't do this, strikes/spoilers/headers match their markers without looking at escapes)
function guardEnd(text: string, limit: number, needsGuard: (text: string) => boolean): string {
  if (!needsGuard(text)) {
    return text;
  }
  if (limit <= text.length) {
    // make room for it
    text = trueSlice(text, Math.max(limit - 1, 0));
    if (!needsGuard(text)) {
      return text;
    }
  }
  return text + Replacements.MENTION;
}

const endsWithHeader = (text: string): boolean => /#\s*$/.test(text);
const endsWithPipe = (text: string): boolean => text.endsWith('|');
const endsWithStrike = (text: string): boolean => text.endsWith(Strings.STRIKE);
const endsWithTilde = (text: string): boolean => text.endsWith('~');

// prefixes every line, cutting the text so the whole output (prefixes and newlines included) stays within `limit`
// `finishLine` gets each line after it was cut, with how much room it has
function prefixLines(
  text: string,
  limit: number,
  getPrefix: (index: number, line: string) => string,
  finishLine?: (line: string, room: number) => string,
): string {
  const lines = text.split('\n');
  const output: Array<string> = [];
  let length = 0;
  for (let i = 0; i < lines.length; i++) {
    const prefix = getPrefix(i, lines[i]);
    const newline = (i) ? 1 : 0;
    const room = limit - length - newline - prefix.length;
    if (room <= 0) {
      break;
    }
    const cut = trueSlice(lines[i], room);
    const line = (finishLine) ? finishLine(cut, room) : cut;
    output.push(prefix + line);
    length += newline + prefix.length + line.length;
    if (cut.length < lines[i].length) {
      break;
    }
  }
  return output.join('\n');
}



const defaultBoldFilter: MarkupFilter = Object.freeze(Object.assign({}, defaultMarkupFilter, {
  limit: 1996,
  replacement: Replacements[Strings.BOLD],
}));

export function bold(text: string, options: MarkupFilterOptions = {}): string {
  text = escape.bold(text, Object.assign({}, options, {limit: textLimit(options, Strings.BOLD.length * 2)}));
  return Strings.BOLD + text + Strings.BOLD;
}



export interface CodeblockFilter extends MarkupFilter {
  language: string,
}

export interface CodeblockFilterOptions extends MarkupFilterOptions {
  language?: string,
}

const defaultCodeblockFilter: CodeblockFilter = Object.freeze(Object.assign({}, defaultMarkupFilter, {
  language: '',
  limit: 1990,
  replacement: Replacements[Strings.CODEBLOCK],
}));

// nothing inside of code gets parsed (backslashes included), so don't put `escape.all()` text in it, the backslashes get shown
export function codeblock(text: string, options: CodeblockFilterOptions = {}): string {
  // discord only reads these as a language, anything else makes the whole line part of the code
  const language = (options.language || defaultCodeblockFilter.language).replace(/[^a-z0-9_+\-.#]/gi, '');
  // ```language\n and \n```
  const wrapping = Strings.CODEBLOCK.length * 2 + language.length + 2;
  text = escape.codeblock(text, Object.assign({}, options, {language, limit: textLimit(options, wrapping)}));
  if (!/[^\n]/.test(text)) {
    // a codeblock needs something other than newlines in it, or the backticks get shown
    text = Replacements.MENTION;
  }
  return [
    Strings.CODEBLOCK + language,
    text,
    Strings.CODEBLOCK,
  ].join('\n');
}



const defaultCodestringFilter: MarkupFilter = Object.freeze(Object.assign({}, defaultMarkupFilter, {
  limit: 1998,
  replacement: Replacements[Strings.CODESTRING],
}));

// nothing inside of code gets parsed (backslashes included), so don't put `escape.all()` text in it, the backslashes get shown
export function codestring(text: string, options: MarkupFilterOptions = {}): string {
  if (!text) {
    // an empty `` shows as two backticks, a zero width space keeps it a code string
    text = Replacements.MENTION;
  }
  let wrap: string = Strings.CODESTRING;
  if (text.includes(Strings.CODESTRING)) {
    // the `` wraps plus the two spaces that might get added below
    options = Object.assign({
      replacement: Strings.CODESTRING + Replacements.MENTION,
    }, options, {limit: textLimit(options, Strings.CODESTRING_DOUBLE.length * 2 + 2)});
    text = escape.codestring(text, options);
    wrap = Strings.CODESTRING_DOUBLE;
    // a backtick next to the `` wrap would turn it into a ``` run, put a space between them instead
    // (discord strips a space that's next to a backtick inside inline code)
    if (text.endsWith(Strings.CODESTRING + Replacements.MENTION)) {
      text = text.slice(0, -Replacements.MENTION.length) + ' ';
    } else if (text.endsWith(Strings.CODESTRING)) {
      text += ' ';
    }
    if (text.startsWith(Strings.CODESTRING)) {
      text = ' ' + text;
    }
  } else {
    text = escape.codestring(text, Object.assign({}, options, {limit: textLimit(options, Strings.CODESTRING.length * 2)}));
  }
  return `${wrap}${text}${wrap}`;
}


// the name can have a sub command group and a sub command in it (`ban add`), like how it's typed
export function commandMention(name: string, commandId: string): string {
  return `</${name}:${commandId}>`;
}


// a link to one of the guild's own pages, `itemId` is for the ones that take one (like a linked role's id)
export function guildNavigation(type: MarkupGuildNavigationTypes | string, itemId?: string): string {
  return (itemId) ? `<id:${type}:${itemId}>` : `<id:${type}>`;
}


export interface HeaderFilter extends MarkupFilter {
  multiline?: boolean,
}

export interface HeaderFilterOptions extends MarkupFilterOptions {
  multiline?: boolean,
}

const defaultHeaderFilter: HeaderFilter = Object.freeze(Object.assign({}, defaultMarkupFilter, {
  limit: 1998,
  replacement: Replacements[Strings.HEADER],
}));

// discord strips the `#`s a header ends with (`# C#` shows `C`)
function headerLine(line: string, room: number): string {
  return guardEnd(line, room, endsWithHeader);
}

// a header needs text, without any discord shows the `#`s, so empty lines are left empty
function headerPrefix(level: number): (index: number, line: string) => string {
  const prefix = `${Strings.HEADER.repeat(level)} `;
  return (index: number, line: string) => (line.trim()) ? prefix : '';
}

export function headerBig(text: string, options: HeaderFilterOptions = {}): string {
  text = escape.header(text, Object.assign({}, options, {limit: textLimit(options)}));
  // without multiline the newlines are already gone, so this is a single line
  return prefixLines(text, textLimit(options), headerPrefix(1), headerLine);
}


export function headerMedium(text: string, options: HeaderFilterOptions = {}): string {
  text = escape.header(text, Object.assign({}, options, {limit: textLimit(options)}));
  return prefixLines(text, textLimit(options), headerPrefix(2), headerLine);
}


export function headerSmall(text: string, options: HeaderFilterOptions = {}): string {
  text = escape.header(text, Object.assign({}, options, {limit: textLimit(options)}));
  return prefixLines(text, textLimit(options), headerPrefix(3), headerLine);
}


const defaultItalicsFilter: MarkupFilter = Object.freeze(Object.assign({}, defaultMarkupFilter, {
  limit: 1998,
  replacement: Replacements[Strings.ITALICS],
}));

export function italics(text: string, options: MarkupFilterOptions = {}): string {
  const limit = textLimit(options, Strings.ITALICS.length * 2);
  text = escape.italics(text, Object.assign({}, options, {limit}));
  // discord doesn't close a strike that's followed by a `_`
  text = guardEnd(text, limit, endsWithStrike);
  return Strings.ITALICS + text + Strings.ITALICS;
}


export interface ListFilter extends MarkupFilter {
  indent?: number,
  multiline?: boolean,
  ordered?: boolean | number,
}

export interface ListFilterOptions extends MarkupFilterOptions {
  indent?: number,
  multiline?: boolean,
  ordered?: boolean | number,
}

const defaultListFilter: ListFilter = Object.freeze(Object.assign({}, defaultMarkupFilter, {
  limit: 1998,
  replacement: Replacements[Strings.LIST],
}));

export function list(text: string, options: ListFilterOptions = {}): string {
  text = escape.list(text, Object.assign({}, options, {limit: textLimit(options)}));
  const indent = (options.indent) ? '  '.repeat(options.indent) : '';
  if (options.ordered || typeof(options.ordered) === 'number') {
    const listStart = (typeof(options.ordered) === 'number') ? options.ordered : 1;
    return prefixLines(text, textLimit(options), (i) => `${indent}${listStart + i}. `);
  }
  return prefixLines(text, textLimit(options), () => `${indent}${Strings.LIST} `);
}


export interface QuoteFilter extends MarkupFilter {
  multiline?: boolean,
}

export interface QuoteFilterOptions extends MarkupFilterOptions {
  multiline?: boolean,
}

const defaultQuoteFilter: QuoteFilter = Object.freeze(Object.assign({}, defaultMarkupFilter, {
  limit: 1998,
  replacement: Replacements.QUOTE_LINE_START,
}));

export function quote(text: string, options: QuoteFilterOptions = {}): string {
  text = escape.quote(text, Object.assign({}, options, {limit: textLimit(options)}));
  // apparently you can do `>>>` at the beginning of the text, but the client does not do this
  return prefixLines(text, textLimit(options), () => `${Strings.QUOTE} `);
}


const defaultQuoteBlockFilter: QuoteFilter = Object.freeze(Object.assign({}, defaultMarkupFilter, {
  limit: 1996,
}));

// quotes everything after it, the rest of the message included, so this has to be the last thing in it
export function quoteBlock(text: string, options: MarkupFilterOptions = {}): string {
  const filter: MarkupFilter = Object.assign({}, defaultQuoteBlockFilter, options);
  if (filter.mentions) {
    text = escape.mentions(text, filter.mentionEscapeCharacter);
  }
  const prefix = `${Strings.QUOTE}${Strings.QUOTE}${Strings.QUOTE} `;
  return prefix + trueSlice(text, textLimit(options, prefix.length));
}


// default sounds don't belong to a guild, their guild id is `0`
export function soundboardSound(soundId: string, guildId: string = '0'): string {
  return `<sound:${guildId}:${soundId}>`;
}


const defaultSpoilerFilter: MarkupFilter = Object.freeze(Object.assign({}, defaultMarkupFilter, {
  limit: 1996,
  replacement: Replacements[Strings.SPOILER],
}));

export function spoiler(text: string, options: MarkupFilterOptions = {}): string {
  const limit = textLimit(options, Strings.SPOILER.length * 2);
  text = escape.spoiler(text, Object.assign({}, options, {limit}));
  // a `|` at the end would pair up with the closing marker even when it's escaped
  text = guardEnd(text, limit, endsWithPipe);
  return Strings.SPOILER + text + Strings.SPOILER;
}



const defaultStrikeFilter: MarkupFilter = Object.freeze(Object.assign({}, defaultMarkupFilter, {
  limit: 1996,
  replacement: Replacements[Strings.STRIKE],
}));

export function strike(text: string, options: MarkupFilterOptions = {}): string {
  const limit = textLimit(options, Strings.STRIKE.length * 2);
  text = escape.strike(text, Object.assign({}, options, {limit}));
  // a `~` at the end would pair up with the closing marker even when it's escaped
  text = guardEnd(text, limit, endsWithTilde);
  return Strings.STRIKE + text + Strings.STRIKE;
}


export interface SubtextFilter extends MarkupFilter {
  multiline?: boolean,
}

export interface SubtextFilterOptions extends MarkupFilterOptions {
  multiline?: boolean,
}

const defaultSubtextFilter: SubtextFilter = Object.freeze(Object.assign({}, defaultMarkupFilter, {
  limit: 1998,
  replacement: Replacements[Strings.SUBTEXT],
}));

export function subtext(text: string, options: SubtextFilterOptions = {}): string {
  text = escape.subtext(text, Object.assign({}, options, {limit: textLimit(options)}));
  return prefixLines(text, textLimit(options), () => `${Strings.SUBTEXT} `);
}


export function timestamp(timestamp: Date | number | string | null, format?: MarkupTimestampStyles): string {
  let unixTimestamp: number;
  if (timestamp || timestamp === 0) {
    if (typeof(timestamp) === 'string') {
      // numeric strings are treated as milliseconds, anything else gets parsed as a date string
      if (/^-?\d+$/.test(timestamp.trim())) {
        timestamp = parseInt(timestamp);
      }
    }
    if (typeof(timestamp) === 'number' || typeof(timestamp) === 'string') {
      timestamp = new Date(timestamp);
    }
    unixTimestamp = Math.floor(timestamp.getTime() / 1000);
    if (isNaN(unixTimestamp)) {
      throw new Error('Invalid Date');
    }
  } else {
    unixTimestamp = Math.floor(Date.now() / 1000)
  }
  if (format) {
    return `<t:${unixTimestamp}:${format}>`;
  }
  return `<t:${unixTimestamp}>`;
}



const defaultUnderlineFilter: MarkupFilter = Object.freeze(Object.assign({}, defaultMarkupFilter, {
  limit: 1996,
  replacement: Replacements[Strings.UNDERLINE],
}));

export function underline(text: string, options: MarkupFilterOptions = {}): string {
  const limit = textLimit(options, Strings.UNDERLINE.length * 2);
  text = escape.underline(text, Object.assign({}, options, {limit}));
  // discord doesn't close a strike that's followed by a `_`
  text = guardEnd(text, limit, endsWithStrike);
  return Strings.UNDERLINE + text + Strings.UNDERLINE;
}


// discord's link text can only hold a `[` that has a `]` after it, and a lone `]` that has no `[` after it
// there's no escaping them (a backslash in link text is shown as one), so the ones that would break the link become their fullwidth lookalikes
function balanceLinkText(text: string): string {
  let output = '';
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '[') {
      const end = text.indexOf(']', i + 1);
      if (end === -1) {
        output += '\uff3b';
      } else {
        output += text.slice(i, end + 1);
        i = end;
      }
    } else if (char === ']' && text.indexOf('[', i + 1) !== -1) {
      output += '\uff3d';
    } else {
      output += char;
    }
  }
  return output;
}

// markdown in the link's text still gets rendered (bold, italics, ..) and there's no way to stop it
// discord doesn't read backslash escapes in there, so don't put `escape.all()` text in it, the backslashes get shown
export function url(text: string, url: string, comment?: string): string {
  // discord doesn't read backslash escapes inside of link text (they get shown), so the brackets are only balanced
  // quotes in the comment would end it early
  text = balanceLinkText(text);
  url = escape.url(url);
  if (comment) {
    return `[${text}](${url} "${comment.replace(/[\\"]/g, '\\$&')}")`;
  }
  return `[${text}](${url})`;
}



// a link that doesn't get an embed
// (invite and store links still get their preview, discord makes those out of the message's text)
export function urlNoEmbed(url: string): string {
  url = escape.url(url);
  return (url.startsWith('<') && url.endsWith('>')) ? url : `<${url}>`;
}



export function trueSlice(
  text: string,
  limit?: number,
  escapes: boolean = true,
): string {
  // slices by UTF-16 code units (how discord counts message length) without splitting a surrogate pair
  // (a limit of 0 is a real limit, the wrappers can end up with no room left for the text)
  if (typeof(limit) === 'number' && text.length > limit) {
    const code = text.charCodeAt(limit - 1);
    if (0xD800 <= code && code <= 0xDBFF) {
      limit--;
    }
    text = text.slice(0, limit);
    // backslashes don't escape anything inside of code, so there's nothing to fix up
    if (!escapes) {
      return text;
    }
    // an odd number of backslashes at the cut would leave one escaping whatever comes after the text
    let backslashes = 0;
    while (backslashes < text.length && text.charCodeAt(text.length - 1 - backslashes) === 92) {
      backslashes++;
    }
    if (backslashes % 2) {
      text = text.slice(0, -1);
    }
    return text;
  }
  return text;
}


// code spans, links and custom emojis get parsed before a wrapper's closing marker could be found in them, so they
// can't end the wrapper early. A backslash put in them gets shown (code) or breaks them (`\` is read as `/` in links)
const PROTECTED_PARTS = /(?<!\\)(`+)[\s\S]*?[^`]\1(?!`)|<a?:\w+:\d+>|<[a-z][a-z0-9+.\-]*:[^\s>]+>|(?:https?|steam):\/\/[^\s<]+[^<.,:;"')\]\s]/gi;

function outsideProtectedParts(text: string, escape: (part: string) => string): string {
  let output = '';
  let last = 0;
  for (const match of text.matchAll(PROTECTED_PARTS)) {
    output += escape(text.slice(last, match.index)) + match[0];
    last = match.index! + match[0].length;
  }
  return output + escape(text.slice(last));
}

// escapes a wrapper's own marker but leaves escapes that are already there alone, so nesting works
// (`bold(italics('a_b'))` keeps italics' `\_`, doubling every backslash would turn it into `\\_` and free the `_`)
// only a lone backslash at the very end gets doubled, it would escape the closing marker
function escapeMarker(text: string, marker: RegExp, replace: (match: string) => string): string {
  const regex = new RegExp(`\\\\[\\s\\S]|\\\\$|${marker.source}`, 'g');
  return outsideProtectedParts(text, (part) => {
    return part.replace(regex, (match: string) => {
      if (match.startsWith(Strings.ESCAPE)) {
        return (match.length === 1) ? Replacements[Strings.ESCAPE] : match;
      }
      return replace(match);
    });
  });
}


function escapeAllMarkdown(text: string): string {
  text = text.replace(Regexes[Strings.ESCAPE], Replacements[Strings.ESCAPE]);
  text = text.replace(Regexes[Strings.ITALICS], Replacements[Strings.ITALICS]);
  text = text.replace(Regexes[Strings.BOLD], Replacements[Strings.BOLD]);
  text = text.replace(Regexes[Strings.CODESTRING], Replacements[Strings.CODESTRING]);
  text = text.replace(Regexes[Strings.SPOILER], Replacements[Strings.SPOILER]);
  text = text.replace(Regexes[Strings.STRIKE], Replacements[Strings.STRIKE]);
  text = text.replace(Regexes[Strings.UNDERLINE], Replacements[Strings.UNDERLINE]);

  text = text.replace(Regexes[Strings.QUOTE], Replacements[Strings.QUOTE]);
  text = text.replace(Regexes[Strings.SUBTEXT], Replacements[Strings.SUBTEXT]); // this includes header
  // `\-`/`\*` for bullets, numbered ones escape the dot (`1\.`), a backslash before a digit isn't an escape and would show
  text = text.replace(Regexes.LIST_LINE_START, (match: string, space: string, marker: string) => {
    return (marker.endsWith('.')) ? `${space}${marker.slice(0, -1)}\\.` : `${space}\\${marker}`;
  });
  return text;
}


// stops urls from being links, for text that already had its markdown escaped (the backslashes get shown otherwise)
// discord also makes invite/store previews out of the raw text, those only need a `//`, a `www.`, or one of its own domains
function escapeUrls(text: string): string {
  text = text.replace(/:\/\//g, '\\:/\\/');
  text = text.replace(/\/\//g, '/\\/');
  text = text.replace(/\b(www|discord|discordapp)\.(?=\w)/gi, '$1\\.');
  // `<scheme:/anything>` is a link too, whatever is inside of it
  text = text.replace(/</g, '\\<');
  return text;
}


export const escape = Object.freeze({
  all: (text: string, options: MarkupFilterOptions = {}): string => {
    const filter: MarkupFilter = Object.assign({}, defaultMarkupFilter, options);

    if (filter.urls) {
      text = escapeUrls(escapeAllMarkdown(text));
    } else {
      // urls are left alone, the backslashes would end up in the link
      // (the parts after a url get their line-start escapes too, which shows the same)
      text = text.split(Regexes.URL_BARE).map((part, i) => {
        return (i % 2) ? part : escapeAllMarkdown(part);
      }).join('');
    }

    if (filter.links) {
      // not `mentionEscapeCharacter`, setting that to '' would leave links working
      text = escape.links(text);
    }
    if (filter.mentions) {
      text = escape.mentions(text, filter.mentionEscapeCharacter);
    }
    return trueSlice(text, filter.limit);
  },
  bold: (text: string, options: MarkupFilterOptions = {}): string => {
    const filter: MarkupFilter = Object.assign({}, defaultBoldFilter, options);

    text = escapeMarker(text, Regexes[Strings.BOLD], (match: string) => {
      return match.replace(Regexes[Strings.BOLD], filter.replacement);
    });
    if (filter.mentions) {
      text = escape.mentions(text, filter.mentionEscapeCharacter);
    }
    return trueSlice(text, filter.limit);
  },
  codeblock: (text: string, options: CodeblockFilterOptions = {}): string => {
    const filter: CodeblockFilter = Object.assign({}, defaultCodeblockFilter, options);

    while (text.includes(Strings.CODEBLOCK)) {
      text = text.replace(Regexes[Strings.CODEBLOCK], filter.replacement);
    }

    if (options.limit === undefined) {
      filter.limit -= filter.language.length;
    }
    return trueSlice(text, filter.limit, false);
  },
  codestring: (text: string, options: MarkupFilterOptions = {}): string => {
    const filter: MarkupFilter = Object.assign({}, defaultCodestringFilter, options);

    text = text.replace(Regexes[Strings.CODESTRING], filter.replacement);
    if (filter.mentions) {
      text = escape.mentions(text, filter.mentionEscapeCharacter);
    }
    return trueSlice(text, filter.limit, false);
  },
  header: (text: string, options: HeaderFilterOptions = {}): string => {
    const filter: HeaderFilter = Object.assign({}, defaultHeaderFilter, options);

    text = text.replace(Regexes[Strings.HEADER], filter.replacement);
    if (!filter.multiline) {
      text = text.replace(/\n/g, ' ');
    }
    if (filter.mentions) {
      text = escape.mentions(text, filter.mentionEscapeCharacter);
    }
    return trueSlice(text, filter.limit);
  },
  italics: (text: string, options: MarkupFilterOptions = {}): string => {
    const filter: MarkupFilter = Object.assign({}, defaultItalicsFilter, options);

    // only a lone `_` can end the italics early, `*`s and `__`s are left alone so bold/underline can be nested in it
    text = escapeMarker(text, Regexes.UNDERSCORE_LONE, () => {
      return (options.replacement === undefined) ? '\\_' : options.replacement;
    });
    if (filter.mentions) {
      text = escape.mentions(text, filter.mentionEscapeCharacter);
    }
    return trueSlice(text, filter.limit);
  },
  links: (text: string, replacement: string = Replacements.MENTION): string => {
    text = text.replace(Regexes.LINK, `]${replacement}(`);
    return text;
  },
  list: (text: string, options: ListFilterOptions = {}): string => {
    const filter: ListFilter = Object.assign({}, defaultListFilter, options);

    // only a marker at the start of a line makes another item, the rest of the `-`s and `*`s are left alone
    // (escaping those would break any bold/italics in it, and text that's already escaped would get escaped twice)
    text = text.replace(Regexes.LIST_LINE_START, (match: string, space: string, marker: string) => {
      return (marker.endsWith('.')) ? `${space}${marker.slice(0, -1)}\\.` : `${space}\\${marker}`;
    });
    if (!filter.multiline) {
      text = text.replace(/\n/g, ' ');
    }
    if (filter.mentions) {
      text = escape.mentions(text, filter.mentionEscapeCharacter);
    }
    return trueSlice(text, filter.limit);
  },
  mentions: (text: string, replacement: string = Replacements.MENTION): string => {
    // a zero width space in a url stops it from being a link (`youtube.com/@name`), so links only get their pings escaped
    // (a `<@id>` can't be in one, the url ends at the `<`)
    return text.split(Regexes.URL_BARE).map((part, i) => {
      if (i % 2) {
        return part.replace(Regexes.EVERYONE, `@${replacement}$1`);
      }
      return part.replace(Regexes.MENTION_HARDCORE, `@${replacement}`);
    }).join('');
  },
  quote: (text: string, options: QuoteFilterOptions = {}): string => {
    const filter: QuoteFilter = Object.assign({}, defaultQuoteFilter, options);

    text = text.replace(Regexes.QUOTE_LINE_START, filter.replacement);
    if (!filter.multiline) {
      text = text.replace(/\n/g, ' ');
    }
    if (filter.mentions) {
      text = escape.mentions(text, filter.mentionEscapeCharacter);
    }
    return trueSlice(text, filter.limit);
  },
  spoiler: (text: string, options: MarkupFilterOptions = {}): string => {
    const filter: MarkupFilter = Object.assign({}, defaultSpoilerFilter, options);

    // a lone `|` gets escaped too so it can't pair up with another one (`spoiler()` handles one at the very end)
    text = escapeMarker(text, Regexes.PIPES, (match: string) => {
      return (match === Strings.SPOILER) ? filter.replacement : '\\|';
    });
    if (filter.mentions) {
      text = escape.mentions(text, filter.mentionEscapeCharacter);
    }
    return trueSlice(text, filter.limit);
  },
  strike: (text: string, options: MarkupFilterOptions = {}): string => {
    const filter: MarkupFilter = Object.assign({}, defaultStrikeFilter, options);

    // same as spoilers, a lone `~` gets escaped (`strike()` handles one at the very end)
    text = escapeMarker(text, Regexes.TILDES, (match: string) => {
      return (match === Strings.STRIKE) ? filter.replacement : '\\~';
    });
    if (filter.mentions) {
      text = escape.mentions(text, filter.mentionEscapeCharacter);
    }
    return trueSlice(text, filter.limit);
  },
  subtext: (text: string, options: SubtextFilterOptions = {}): string => {
    const filter: SubtextFilter = Object.assign({}, defaultSubtextFilter, options);

    text = text.replace(Regexes[Strings.SUBTEXT], filter.replacement);
    if (!filter.multiline) {
      text = text.replace(/\n/g, ' ');
    }
    if (filter.mentions) {
      text = escape.mentions(text, filter.mentionEscapeCharacter);
    }
    return trueSlice(text, filter.limit);
  },
  underline: (text: string, options: MarkupFilterOptions = {}): string => {
    const filter: MarkupFilter = Object.assign({}, defaultUnderlineFilter, options);

    text = escapeMarker(text, Regexes[Strings.UNDERLINE], (match: string) => {
      return match.replace(Regexes[Strings.UNDERLINE], filter.replacement);
    });
    if (filter.mentions) {
      text = escape.mentions(text, filter.mentionEscapeCharacter);
    }
    return trueSlice(text, filter.limit);
  },
  url: (text: string, options: MarkupFilterOptions = {}): string => {
    // a `<url>` wrap (no embed) is the caller's, only encode what's inside of it
    const wrapped = (text.length >= 2 && text.startsWith('<') && text.endsWith('>'));
    if (wrapped) {
      text = text.slice(1, -1);
    }
    // encodes the utf-8 bytes, a char code is wrong for anything past ascii (`\u2028` isn't `%2028`)
    text = text.replace(Regexes.URL, (match: string) => {
      return (match === '(' || match === ')') ? '%' + match.charCodeAt(0).toString(16).toUpperCase() : encodeURIComponent(match);
    });
    return (wrapped) ? `<${text}>` : text;
  },
});
