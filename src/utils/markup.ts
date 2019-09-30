export const Strings = Object.freeze({
  BOLD: '**',
  CODEBLOCK: '```',
  CODESTRING: '`',
  ITALICS: '_',
  SPOILER: '||',
  STRIKE: '~~',
  UNDERLINE: '__',
});

export const Regexes = Object.freeze({
  [Strings.BOLD]: /\*\*/g,
  [Strings.CODEBLOCK]: new RegExp(Strings.CODEBLOCK, 'g'),
  [Strings.ITALICS]: /_|\*/g,
  [Strings.SPOILER]: /\|\|/g,
  [Strings.STRIKE]: new RegExp(Strings.STRIKE, 'g'),
  [Strings.UNDERLINE]: new RegExp(Strings.UNDERLINE, 'g'),
  EVERYONE: /@(everyone|here)/g,
  MENTION: /<@([!&]?[0-9]{16,21})>/g,
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
  replacement: '\*\*',
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
  replacement: '``\u200b`',
}));

export function codeblock(text: string, options: CodeblockFilterOptions = {}): string {
  text = escape.codeblock(text, options);
  return [
    '```' + options.language,
    text,
    '```',
  ].join('\n');
}



export function codestring(text: string): string {
  return text;
}


const defaultItalicsFilter: MarkupFilter = Object.freeze(Object.assign({}, defaultMarkupFilter, {
  limit: 1998,
  replacement: '\$1',
}));

export function italics(text: string, options: MarkupFilterOptions = {}): string {
  text = escape.italics(text, options);
  return `_${text}_`;
}


const defaultSpoilerFilter: MarkupFilter = Object.freeze(Object.assign({}, defaultMarkupFilter, {
  limit: 1996,
  replacement: '\\|\\|',
}));

export function spoiler(text: string, options: MarkupFilterOptions = {}): string {
  text = escape.spoiler(text, options);
  return `||${text}||`;
}



const defaultStrikeFilter: MarkupFilter = Object.freeze(Object.assign({}, defaultMarkupFilter, {
  limit: 1996,
  replacement: '\~\~',
}));

export function strike(text: string, options: MarkupFilterOptions = {}): string {
  text = escape.strike(text, options);
  return `~~${text}~~`;
}



const defaultUnderlineFilter: MarkupFilter = Object.freeze(Object.assign({}, defaultMarkupFilter, {
  limit: 1996,
  replacement: '\_\_',
}));

export function underline(text: string, options: MarkupFilterOptions = {}): string {
  text = escape.underline(text, options);
  return `__${text}__`;
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
});
