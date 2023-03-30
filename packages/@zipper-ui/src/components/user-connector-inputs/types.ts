import { UserAuthConnector } from '@zipper/types';

export type ConnectorInputProps = {
  connector: UserAuthConnector;
  onDelete: () => void;
  authUrl: string;
};
