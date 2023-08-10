import { safeJSONParse } from './safe-json';

type SettingEntry = {
  settingName: string;
  settingValue: string;
};

export function parseSettings(settings: SettingEntry[]) {
  return settings.reduce<Record<string, any>>(
    (_settings, { settingName, settingValue }) => ({
      ..._settings,
      [settingName]: safeJSONParse(settingValue, undefined, settingValue),
    }),
    {},
  );
}

export function getSetting<T = any>(
  settings: SettingEntry[],
  key: string,
): T | undefined;

export function getSetting<T = any>(
  settings: SettingEntry[],
  key: string,
  defaultValue: T,
): T;

export function getSetting<T = any>(
  settings: SettingEntry[],
  key: string,
  defaultValue?: T,
) {
  return (parseSettings(settings)[key] as T) || defaultValue;
}
