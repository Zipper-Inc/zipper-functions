type StyleObject = Record<string, string | number>;

const makeToken = (color: string) => `$__PRETTY_LOG_COLOR(${color})`;

export const PRETTY_LOG_TOKENS: Record<string, string> = {
  blue: makeToken('blue'),
  purple: makeToken('purple'),
  purpleAlt: makeToken('purpleAlt'),
  'fg.50': makeToken('fg.50'),
  'fg.600': makeToken('fg.600'),
  fgText: makeToken('fgText'),
  bgColor: makeToken('bgColor'),
};

const getStringFromStyleObject = (obj: StyleObject) =>
  Object.entries(obj)
    .map((pair) => pair.join(': '))
    .join('; ');

const DEFAULT_BADGE_STYLE = {
  'font-weight': 800,
  color: PRETTY_LOG_TOKENS.bgColor,
  background: PRETTY_LOG_TOKENS.blue,
  'text-transform': 'uppercase',
};

const DEFAULT_TOPIC_STYLE = {
  'font-weight': 500,
  color: PRETTY_LOG_TOKENS['fg.600'],
  background: PRETTY_LOG_TOKENS['fg.50'],
};

const DEFAULT_SUBTOPIC_STYLE = {
  'font-weight': 200,
  color: PRETTY_LOG_TOKENS.purpleAlt,
  'text-transform': 'uppercase',
};

export const prettyLog = (
  {
    topic,
    subtopic,
    badge,
    msg,
  }: {
    badge?: string;
    topic?: string;
    subtopic?: string;
    msg?: string;
  },
  styles: {
    badgeStyle: StyleObject;
    topicStyle?: StyleObject;
    subtopicStyle?: StyleObject;
  } = { badgeStyle: {}, topicStyle: {}, subtopicStyle: {} },
) => {
  const data: Zipper.Serializable[] = [];
  const titleParts = [badge, topic, subtopic].filter((truthy) => !!truthy);

  if (titleParts.length) {
    const title = titleParts.map((part) => `%c ${part}`).join(' ');
    data.push(title);

    // Add any styles for each part
    if (badge)
      data.push(
        getStringFromStyleObject({
          ...DEFAULT_BADGE_STYLE,
          ...styles.badgeStyle,
        } as StyleObject),
      );

    if (topic)
      data.push(
        getStringFromStyleObject({
          ...DEFAULT_TOPIC_STYLE,
          ...styles.topicStyle,
        } as StyleObject),
      );

    if (subtopic)
      data.push(
        getStringFromStyleObject({
          ...DEFAULT_SUBTOPIC_STYLE,
          ...styles.subtopicStyle,
        } as StyleObject),
      );
  }

  if (msg) data.push(msg);

  return data;
};
