export const Strings = Object.freeze({
  BOLD: '**',
  CODEBLOCK: '```',
  CODESTRING: '`',
  ESCAPE: '\\',
  ITALICS: '_',
  SPOILER: '||',
  STRIKE: '~~',
  UNDERLINE: '__',
  URL: 'URL',
});

export const Regexes = Object.freeze({
  [Strings.BOLD]: /\*\*/g,
  [Strings.CODEBLOCK]: new RegExp(Strings.CODEBLOCK, 'g'),
  [Strings.CODESTRING]: new RegExp(Strings.CODESTRING, 'g'),
  [Strings.ESCAPE]: /\\/g,
  [Strings.ITALICS]: /(_|\*)/g,
  [Strings.SPOILER]: /\|\|/g,
  [Strings.STRIKE]: new RegExp(Strings.STRIKE, 'g'),
  [Strings.UNDERLINE]: new RegExp(Strings.UNDERLINE, 'g'),
  [Strings.URL]: /\)/g,
  EVERYONE: /@(everyone|here)/g,
  MENTION: /<@([!&]?[0-9]{16,21})>/g,
});

export const Replacements = Object.freeze({
  [Strings.BOLD]: '\\*\\*',
  [Strings.CODEBLOCK]: '``\u200b`',
  [Strings.CODESTRING]: '\\`',
  [Strings.ESCAPE]: '\\\\',
  [Strings.ITALICS]: '\\$1',
  [Strings.SPOILER]: '\\|\\|',
  [Strings.STRIKE]: '\\~\\~',
  [Strings.UNDERLINE]: '\\_\\_',
});


export interface MarkupFilter {
  limit: number,
  mentions: boolean,
  mentionEscapeCharacter: string,
  replacement: string,
}

export interface MarkupFilterOptions {
  limit?: number,
  mentions?: boolean,
  mentionEscapeCharacter?: string,
  replacement?: string,
}

const defaultMarkupFilter: MarkupFilter = Object.freeze({
  limit: 2000,
  mentions: true,
  mentionEscapeCharacter: '\\',
  replacement: '',
});



const defaultBoldFilter: MarkupFilter = Object.freeze(Object.assign({}, defaultMarkupFilter, {
  limit: 1996,
  replacement: Replacements[Strings.BOLD],
}));

export function bold(text: string, options: MarkupFilterOptions = {}): string {
  text = escape.bold(text, options);
  return `**${text}**`;
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
    '```' + options.language,
    text,
    '```',
  ].join('\n');
}



const defaultCodestringFilter: MarkupFilter = Object.freeze(Object.assign({}, defaultMarkupFilter, {
  limit: 1998,
  replacement: Replacements[Strings.CODESTRING],
}));

export function codestring(text: string, options: MarkupFilterOptions = {}): string {
  text = escape.codestring(text, options);
  return `\`${text}\``;
}



const defaultItalicsFilter: MarkupFilter = Object.freeze(Object.assign({}, defaultMarkupFilter, {
  limit: 1998,
  replacement: Replacements[Strings.ITALICS],
}));

export function italics(text: string, options: MarkupFilterOptions = {}): string {
  text = escape.italics(text, options);
  return `_${text}_`;
}


const defaultSpoilerFilter: MarkupFilter = Object.freeze(Object.assign({}, defaultMarkupFilter, {
  limit: 1996,
  replacement: Replacements[Strings.SPOILER],
}));

export function spoiler(text: string, options: MarkupFilterOptions = {}): string {
  text = escape.spoiler(text, options);
  return `||${text}||`;
}



const defaultStrikeFilter: MarkupFilter = Object.freeze(Object.assign({}, defaultMarkupFilter, {
  limit: 1996,
  replacement: Replacements[Strings.STRIKE],
}));

export function strike(text: string, options: MarkupFilterOptions = {}): string {
  text = escape.strike(text, options);
  return `~~${text}~~`;
}



const defaultUnderlineFilter: MarkupFilter = Object.freeze(Object.assign({}, defaultMarkupFilter, {
  limit: 1996,
  replacement: Replacements[Strings.UNDERLINE],
}));

export function underline(text: string, options: MarkupFilterOptions = {}): string {
  text = escape.underline(text, options);
  return `__${text}__`;
}


export function url(text: string, url: string): string {
  url = escape.url(url);
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

    text = text.trim();
    text = text.replace(Regexes[Strings.ESCAPE], Replacements[Strings.ESCAPE]);
    text = text.replace(Regexes[Strings.ITALICS], Replacements[Strings.ITALICS]);
    text = text.replace(Regexes[Strings.BOLD], Replacements[Strings.BOLD]);
    text = text.replace(Regexes[Strings.CODESTRING], Replacements[Strings.CODESTRING]);
    text = text.replace(Regexes[Strings.SPOILER], Replacements[Strings.SPOILER]);
    text = text.replace(Regexes[Strings.STRIKE], Replacements[Strings.STRIKE]);
    text = text.replace(Regexes[Strings.UNDERLINE], Replacements[Strings.UNDERLINE]);

    if (filter.mentions) {
      text = escape.mentions(text, filter.mentionEscapeCharacter);
    }
    return trueSlice(text, filter.limit);
  },
  bold: (text: string, options: MarkupFilterOptions = {}): string => {
    const filter: MarkupFilter = Object.assign({}, defaultBoldFilter, options);

    text = text.trim().replace(Regexes[Strings.BOLD], filter.replacement);
    if (filter.mentions) {
      text = escape.mentions(text, filter.mentionEscapeCharacter);
    }
    return trueSlice(text, filter.limit);
  },
  codeblock: (text: string, options: CodeblockFilterOptions = {}): string => {
    const filter: CodeblockFilter = Object.assign({}, defaultCodeblockFilter, options);

    text = text.trim();
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

    text = text.trim().replace(Regexes[Strings.CODESTRING], filter.replacement);
    if (filter.mentions) {
      text = escape.mentions(text, filter.mentionEscapeCharacter);
    }
    return trueSlice(text, filter.limit);
  },
  italics: (text: string, options: MarkupFilterOptions = {}): string => {
    const filter: MarkupFilter = Object.assign({}, defaultItalicsFilter, options);

    text = text.trim().replace(Regexes[Strings.ITALICS], filter.replacement);
    if (filter.mentions) {
      text = escape.mentions(text, filter.mentionEscapeCharacter);
    }
    return trueSlice(text, filter.limit);
  },
  mentions: (text: string, replacement: string = defaultMarkupFilter.mentionEscapeCharacter): string => {
    text = text.replace(Regexes.EVERYONE, `@${replacement}$1`);
    text = text.replace(Regexes.MENTION, `<${replacement}@$1>`);
    return text;
  },
  spoiler: (text: string, options: MarkupFilterOptions = {}): string => {
    const filter: MarkupFilter = Object.assign({}, defaultSpoilerFilter, options);

    text = text.trim().replace(Regexes[Strings.SPOILER], filter.replacement);
    if (filter.mentions) {
      text = escape.mentions(text, filter.mentionEscapeCharacter);
    }
    return trueSlice(text, filter.limit);
  },
  strike: (text: string, options: MarkupFilterOptions = {}): string => {
    const filter: MarkupFilter = Object.assign({}, defaultStrikeFilter, options);

    text = text.trim().replace(Regexes[Strings.STRIKE], filter.replacement);
    if (filter.mentions) {
      text = escape.mentions(text, filter.mentionEscapeCharacter);
    }
    return trueSlice(text, filter.limit);
  },
  underline: (text: string, options: MarkupFilterOptions = {}): string => {
    const filter: MarkupFilter = Object.assign({}, defaultUnderlineFilter, options);

    text = text.trim().replace(Regexes[Strings.UNDERLINE], filter.replacement);
    if (filter.mentions) {
      text = escape.mentions(text, filter.mentionEscapeCharacter);
    }
    return trueSlice(text, filter.limit);
  },
  url: (text: string, options: MarkupFilterOptions = {}): string => {
    text = text.trim().replace(Regexes[Strings.URL], (match: string) => {
      return '%' + match.charCodeAt(0).toString(16);
    });
    return text;
  },
});
