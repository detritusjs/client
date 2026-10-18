import { MarkupTimestampStyles } from '../constants';


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
  LINK_TEXT: /[\[\]]/g,
  // list markers at the start of a line (`- `, `* `, `1. `)
  LIST_LINE_START: /^(\s*)([-*]|\d+\.)(?=\s)/gm,
  MENTION: /<@([!&]?[0-9]{16,21})>/g,
  MENTION_HARDCORE: /@/g,
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
  LINK_TEXT: '\\$&',
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
}

export interface MarkupFilterOptions {
  limit?: number,
  links?: boolean,
  mentions?: boolean,
  mentionEscapeCharacter?: string,
  replacement?: string,
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

// prefixes every line, cutting the text so the whole output (prefixes and newlines included) stays within `limit`
function prefixLines(text: string, limit: number, getPrefix: (index: number) => string): string {
  const lines = text.split('\n');
  const output: Array<string> = [];
  let length = 0;
  for (let i = 0; i < lines.length; i++) {
    const prefix = getPrefix(i);
    const newline = (i) ? 1 : 0;
    const room = limit - length - newline - prefix.length;
    if (room <= 0) {
      break;
    }
    const line = trueSlice(lines[i], room);
    output.push(prefix + line);
    length += newline + prefix.length + line.length;
    if (line.length < lines[i].length) {
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

export function codeblock(text: string, options: CodeblockFilterOptions = {}): string {
  // a backtick or newline in the language would end the opening line early
  const language = (options.language || defaultCodeblockFilter.language).replace(/[`\s]/g, '');
  // ```language\n and \n```
  const wrapping = Strings.CODEBLOCK.length * 2 + language.length + 2;
  text = escape.codeblock(text, Object.assign({}, options, {language, limit: textLimit(options, wrapping)}));
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

export function headerBig(text: string, options: HeaderFilterOptions = {}): string {
  text = escape.header(text, Object.assign({}, options, {limit: textLimit(options)}));
  // without multiline the newlines are already gone, so this is a single line
  return prefixLines(text, textLimit(options), () => `${Strings.HEADER} `);
}


export function headerMedium(text: string, options: HeaderFilterOptions = {}): string {
  text = escape.header(text, Object.assign({}, options, {limit: textLimit(options)}));
  return prefixLines(text, textLimit(options), () => `${Strings.HEADER}${Strings.HEADER} `);
}


export function headerSmall(text: string, options: HeaderFilterOptions = {}): string {
  text = escape.header(text, Object.assign({}, options, {limit: textLimit(options)}));
  return prefixLines(text, textLimit(options), () => `${Strings.HEADER}${Strings.HEADER}${Strings.HEADER} `);
}


const defaultItalicsFilter: MarkupFilter = Object.freeze(Object.assign({}, defaultMarkupFilter, {
  limit: 1998,
  replacement: Replacements[Strings.ITALICS],
}));

export function italics(text: string, options: MarkupFilterOptions = {}): string {
  text = escape.italics(text, Object.assign({}, options, {limit: textLimit(options, Strings.ITALICS.length * 2)}));
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


const defaultSpoilerFilter: MarkupFilter = Object.freeze(Object.assign({}, defaultMarkupFilter, {
  limit: 1996,
  replacement: Replacements[Strings.SPOILER],
}));

export function spoiler(text: string, options: MarkupFilterOptions = {}): string {
  text = escape.spoiler(text, Object.assign({}, options, {limit: textLimit(options, Strings.SPOILER.length * 2)}));
  return Strings.SPOILER + text + Strings.SPOILER;
}



const defaultStrikeFilter: MarkupFilter = Object.freeze(Object.assign({}, defaultMarkupFilter, {
  limit: 1996,
  replacement: Replacements[Strings.STRIKE],
}));

export function strike(text: string, options: MarkupFilterOptions = {}): string {
  text = escape.strike(text, Object.assign({}, options, {limit: textLimit(options, Strings.STRIKE.length * 2)}));
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
  text = escape.underline(text, Object.assign({}, options, {limit: textLimit(options, Strings.UNDERLINE.length * 2)}));
  return Strings.UNDERLINE + text + Strings.UNDERLINE;
}


export function url(text: string, url: string, comment?: string): string {
  // brackets in the text would end it early (and a trailing backslash would escape the `]`), so would quotes in the comment
  text = escapeMarker(text, Regexes.LINK_TEXT, (match: string) => match.replace(Regexes.LINK_TEXT, Replacements.LINK_TEXT));
  url = escape.url(url);
  if (comment) {
    return `[${text}](${url} '${comment.replace(/[\\']/g, '\\$&')}')`;
  }
  return `[${text}](${url})`;
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


// escapes a wrapper's own marker but leaves escapes that are already there alone, so nesting works
// (`bold(italics('a_b'))` keeps italics' `\_`, doubling every backslash would turn it into `\\_` and free the `_`)
// only a lone backslash at the very end gets doubled, it would escape the closing marker
function escapeMarker(text: string, marker: RegExp, replace: (match: string) => string): string {
  const regex = new RegExp(`\\\\[\\s\\S]|\\\\$|${marker.source}`, 'g');
  return text.replace(regex, (match: string) => {
    if (match.startsWith(Strings.ESCAPE)) {
      return (match.length === 1) ? Replacements[Strings.ESCAPE] : match;
    }
    return replace(match);
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


export const escape = Object.freeze({
  all: (text: string, options: MarkupFilterOptions = {}): string => {
    const filter: MarkupFilter = Object.assign({}, defaultMarkupFilter, options);

    // urls are left alone, the backslashes would end up in the link
    // (the parts after a url get their line-start escapes too, which shows the same)
    text = text.split(Regexes.URL_BARE).map((part, i) => {
      return (i % 2) ? part : escapeAllMarkdown(part);
    }).join('');

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

    text = escapeMarker(text, Regexes[Strings.ITALICS], (match: string) => {
      return match.replace(Regexes[Strings.ITALICS], filter.replacement);
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

    text = text.replace(Regexes[Strings.LIST], filter.replacement);
    if (!filter.multiline) {
      text = text.replace(/\n/g, ' ');
    }
    if (filter.mentions) {
      text = escape.mentions(text, filter.mentionEscapeCharacter);
    }
    return trueSlice(text, filter.limit);
  },
  mentions: (text: string, replacement: string = Replacements.MENTION): string => {
    text = text.replace(Regexes.MENTION_HARDCORE, `@${replacement}`);
    return text;
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

    // a lone `|` gets escaped too, `||secret|||` would leave the last one outside of the spoiler
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

    // same as spoilers, a lone trailing `~` would end up outside of the strike
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
    // encodes the utf-8 bytes, a char code is wrong for anything past ascii (`\u2028` isn't `%2028`)
    text = text.replace(Regexes.URL, (match: string) => {
      return (match === '(' || match === ')') ? '%' + match.charCodeAt(0).toString(16).toUpperCase() : encodeURIComponent(match);
    });
    return text;
  },
});
