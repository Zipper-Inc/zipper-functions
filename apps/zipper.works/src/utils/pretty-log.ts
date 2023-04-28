import { baseColors, brandColors } from '@zipper/ui';

type StyleObject = Record<string, string | number>;
const getStringFromObject = (obj: StyleObject) =>
  Object.entries(obj)
    .map((pair) => pair.join(': '))
    .join('; ');

const DEFAULT_TOPIC_STYLE = {
  'font-weight': 800,
  color: 'white',
  background: brandColors.brandBlue,
  'text-transform': 'uppercase',
};

const DEFAULT_SUBTOPIC_STYLE = {
  'font-weight': 500,
  color: baseColors.gray[600],
  background: baseColors.gray[50],
};

const DEFAULT_BADGE_STYLES = {
  'font-weight': 200,
  'font-size': 'smaller',
  height: '100%',
  color: brandColors.brandDarkPurple,
  'text-transform': 'uppercase',
};

export const prettyLog = (
  {
    topic,
    subtopic,
    badge,
    msg,
  }: {
    topic?: string;
    subtopic?: string;
    badge?: string;
    msg?: string;
  },
  styles: {
    topicStyle: StyleObject;
    subtopicStyle?: StyleObject;
    badgeStyle?: StyleObject;
  } = { topicStyle: {}, subtopicStyle: {}, badgeStyle: {} },
) => {
  const data: Zipper.Serializable[] = [];
  const titleParts = [topic, subtopic, badge];

  if (titleParts.filter((truthy) => !!truthy).length) {
    const title = titleParts.map((part) => `%c ${part}`).join(' ');
    data.push(title);

    // Add any styles for each part
    if (topic)
      data.push(
        getStringFromObject({ ...DEFAULT_TOPIC_STYLE, ...styles.topicStyle }),
      );

    if (subtopic)
      data.push(
        getStringFromObject({
          ...DEFAULT_SUBTOPIC_STYLE,
          ...styles.subtopicStyle,
        }),
      );

    if (badge)
      data.push(
        getStringFromObject({ ...DEFAULT_BADGE_STYLES, ...styles.badgeStyle }),
      );
  }

  if (msg) data.push(msg);

  return data;
};
