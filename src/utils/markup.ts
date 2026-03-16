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
  [Strings.HEADER]: /^(\s*)?#/g, // maybe support the other markup types with the spaces?
  [Strings.ITALICS]: /(_|\*)/g,
  [Strings.LIST]: /(-|\*)/g,
  [Strings.QUOTE]: />/g,
  [Strings.SPOILER]: /\|\|/g,
  [Strings.STRIKE]: new RegExp(Strings.STRIKE, 'g'),
  [Strings.SUBTEXT]: /^(\s*)?(-?#)/g, // maybe support the other markup types with the spaces?
  [Strings.UNDERLINE]: new RegExp(Strings.UNDERLINE, 'g'),
  EVERYONE: /@(everyone|here)/g,
  LINK: /\]\(/g,
  MENTION: /<@([!&]?[0-9]{16,21})>/g,
  MENTION_HARDCORE: /@/g,
  URL: /\)/g,
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



const defaultBoldFilter: MarkupFilter = Object.freeze(Object.assign({}, defaultMarkupFilter, {
  limit: 1996,
  replacement: Replacements[Strings.BOLD],
}));

export function bold(text: string, options: MarkupFilterOptions = {}): string {
  text = escape.bold(text, options);
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
  text = escape.codeblock(text, options);
  return [
    Strings.CODEBLOCK + (options.language || defaultCodeblockFilter.language),
    text,
    Strings.CODEBLOCK,
  ].join('\n');
}



const defaultCodestringFilter: MarkupFilter = Object.freeze(Object.assign({}, defaultMarkupFilter, {
  limit: 1998,
  replacement: Replacements[Strings.CODESTRING],
}));

export function codestring(text: string, options: MarkupFilterOptions = {}): string {
  let wrap: string = Strings.CODESTRING;
  if (text.includes(Strings.CODESTRING)) {
    options = Object.assign({
      limit: 1995,
      replacement: Strings.CODESTRING + Replacements.MENTION,
    }, options);
    text = escape.codestring(text, options);
    wrap = Strings.CODESTRING_DOUBLE;
    if (text.endsWith(Strings.CODESTRING)) {
      text += Replacements.MENTION;
    }
  } else {
    text = escape.codestring(text, options);
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
  text = escape.header(text, options);
  if (options.multiline) {
    // todo: include each line to the above limit
    return text.split('\n').map((x) => {
      return `${Strings.HEADER} ${x}`;
    }).join('\n');
  }
  return `${Strings.HEADER} ${text}`;
}


export function headerMedium(text: string, options: HeaderFilterOptions = {}): string {
  text = escape.header(text, Object.assign({limit: 1997}, options));
  if (options.multiline) {
    // todo: include each line to the above limit
    return text.split('\n').map((x) => {
      return `${Strings.HEADER}${Strings.HEADER} ${x}`;
    }).join('\n');
  }
  return `${Strings.HEADER}${Strings.HEADER} ${text}`;
}


export function headerSmall(text: string, options: HeaderFilterOptions = {}): string {
  text = escape.header(text, Object.assign({limit: 1996}, options));
  if (options.multiline) {
    // todo: include each line to the above limit
    return text.split('\n').map((x) => {
      return `${Strings.HEADER}${Strings.HEADER}${Strings.HEADER} ${x}`;
    }).join('\n');
  }
  return `${Strings.HEADER}${Strings.HEADER}${Strings.HEADER} ${text}`;
}


const defaultItalicsFilter: MarkupFilter = Object.freeze(Object.assign({}, defaultMarkupFilter, {
  limit: 1998,
  replacement: Replacements[Strings.ITALICS],
}));

export function italics(text: string, options: MarkupFilterOptions = {}): string {
  text = escape.italics(text, options);
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
  replacement: Replacements[Strings.QUOTE],
}));

export function list(text: string, options: ListFilterOptions = {}): string {
  text = escape.list(text, options);
  const indent = (options.indent) ? '  '.repeat(options.indent) : '';
  if (options.ordered || typeof(options.ordered) === 'number') {
    const listStart = (typeof(options.ordered) === 'number') ? options.ordered : 1;
    if (options.multiline) {
      // todo: include each line to the above limit
      return text.split('\n').map((x, i) => {
        return `${indent}${listStart + i}. ${x}`;
      }).join('\n');
    }
    return `${indent}${listStart}. ${text}`;
  }
  if (options.multiline) {
    // todo: include each line to the above limit
    // apparently you can do `>>>` at the beginning of the text, but the client does not do this
    return text.split('\n').map((x) => {
      return `${indent}${Strings.LIST} ${x}`;
    }).join('\n');
  }
  return `${indent}${Strings.LIST} ${text}`;
}


export interface QuoteFilter extends MarkupFilter {
  multiline?: boolean,
}

export interface QuoteFilterOptions extends MarkupFilterOptions {
  multiline?: boolean,
}

const defaultQuoteFilter: QuoteFilter = Object.freeze(Object.assign({}, defaultMarkupFilter, {
  limit: 1998,
  replacement: Replacements[Strings.QUOTE],
}));

export function quote(text: string, options: QuoteFilterOptions = {}): string {
  text = escape.quote(text, options);
  if (options.multiline) {
    // todo: include each line to the above limit
    // apparently you can do `>>>` at the beginning of the text, but the client does not do this
    return text.split('\n').map((x) => {
      return `${Strings.QUOTE} ${x}`;
    }).join('\n');
  }
  return `${Strings.QUOTE} ${text}`;
}


const defaultSpoilerFilter: MarkupFilter = Object.freeze(Object.assign({}, defaultMarkupFilter, {
  limit: 1996,
  replacement: Replacements[Strings.SPOILER],
}));

export function spoiler(text: string, options: MarkupFilterOptions = {}): string {
  text = escape.spoiler(text, options);
  return Strings.SPOILER + text + Strings.SPOILER;
}



const defaultStrikeFilter: MarkupFilter = Object.freeze(Object.assign({}, defaultMarkupFilter, {
  limit: 1996,
  replacement: Replacements[Strings.STRIKE],
}));

export function strike(text: string, options: MarkupFilterOptions = {}): string {
  text = escape.strike(text, options);
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
  text = escape.subtext(text, options);
  if (options.multiline) {
    // todo: include each line to the above limit
    return text.split('\n').map((x) => {
      return `${Strings.SUBTEXT} ${x}`;
    }).join('\n');
  }
  return `${Strings.SUBTEXT} ${text}`;
}


export function timestamp(timestamp: Date | number | string | null, format?: MarkupTimestampStyles): string {
  let unixTimestamp: number;
  if (timestamp) {
    if (typeof(timestamp) === 'number' || typeof(timestamp) === 'string') {
      const timestampNumber = parseInt(timestamp as any);
      if (!isNaN(timestampNumber)) {
        timestamp = timestampNumber;
      }
      timestamp = new Date(timestamp);
    }
    unixTimestamp = Math.floor(timestamp.getTime() / 1000);
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
  text = escape.underline(text, options);
  return Strings.UNDERLINE + text + Strings.UNDERLINE;
}


export function url(text: string, url: string, comment?: string): string {
  url = escape.url(url);
  if (comment) {
    return `[${text}](${url} '${comment}')`;
  }
  return `[${text}](${url})`;
}



export function trueSlice(
  text: string,
  limit?: number,
): string {
  if (limit) {
    return Buffer.from(text).slice(0, limit).toString();
  }
  return text;
}


export const escape = Object.freeze({
  all: (text: string, options: MarkupFilterOptions = {}): string => {
    const filter: MarkupFilter = Object.assign({}, defaultMarkupFilter, options);

    text = text.replace(Regexes[Strings.ESCAPE], Replacements[Strings.ESCAPE]);
    text = text.replace(Regexes[Strings.ITALICS], Replacements[Strings.ITALICS]);
    text = text.replace(Regexes[Strings.BOLD], Replacements[Strings.BOLD]);
    text = text.replace(Regexes[Strings.CODESTRING], Replacements[Strings.CODESTRING]);
    text = text.replace(Regexes[Strings.SPOILER], Replacements[Strings.SPOILER]);
    text = text.replace(Regexes[Strings.STRIKE], Replacements[Strings.STRIKE]);
    text = text.replace(Regexes[Strings.UNDERLINE], Replacements[Strings.UNDERLINE]);

    text = text.replace(Regexes[Strings.QUOTE], Replacements[Strings.QUOTE]);
    text = text.replace(Regexes[Strings.SUBTEXT], Replacements[Strings.SUBTEXT]); // this includes header

    if (filter.links) {
      text = escape.links(text, filter.mentionEscapeCharacter);
    }
    if (filter.mentions) {
      text = escape.mentions(text, filter.mentionEscapeCharacter);
    }
    return trueSlice(text, filter.limit);
  },
  bold: (text: string, options: MarkupFilterOptions = {}): string => {
    const filter: MarkupFilter = Object.assign({}, defaultBoldFilter, options);

    text = text.replace(Regexes[Strings.BOLD], filter.replacement);
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
    return trueSlice(text, filter.limit);
  },
  codestring: (text: string, options: MarkupFilterOptions = {}): string => {
    const filter: MarkupFilter = Object.assign({}, defaultCodestringFilter, options);

    text = text.replace(Regexes[Strings.CODESTRING], filter.replacement);
    if (filter.mentions) {
      text = escape.mentions(text, filter.mentionEscapeCharacter);
    }
    return trueSlice(text, filter.limit);
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

    text = text.replace(Regexes[Strings.ITALICS], filter.replacement);
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
    const filter: ListFilter = Object.assign({}, defaultSubtextFilter, options);

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

    text = text.replace(Regexes[Strings.QUOTE], filter.replacement);
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

    text = text.replace(Regexes[Strings.SPOILER], filter.replacement);
    if (filter.mentions) {
      text = escape.mentions(text, filter.mentionEscapeCharacter);
    }
    return trueSlice(text, filter.limit);
  },
  strike: (text: string, options: MarkupFilterOptions = {}): string => {
    const filter: MarkupFilter = Object.assign({}, defaultStrikeFilter, options);

    text = text.replace(Regexes[Strings.STRIKE], filter.replacement);
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

    text = text.replace(Regexes[Strings.UNDERLINE], filter.replacement);
    if (filter.mentions) {
      text = escape.mentions(text, filter.mentionEscapeCharacter);
    }
    return trueSlice(text, filter.limit);
  },
  url: (text: string, options: MarkupFilterOptions = {}): string => {
    text = text.replace(Regexes.URL, (match: string) => {
      return '%' + match.charCodeAt(0).toString(16);
    });
    return text;
  },
});
