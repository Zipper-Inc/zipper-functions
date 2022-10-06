import type { NextApiRequest, NextApiResponse } from 'next';
import { NodeVM } from 'vm2';
import appDecorator from '~/server/appDecorator';

type ResponseData = {
  message: string;
  output?: string;
  method?: string;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
) {
  const vm = new NodeVM({
    console: 'inherit',
    sandbox: {},
    require: {
      external: true,
      root: './',
    },
  });

  const functionInSandbox = vm.run(
    `
    this.zipper = { storage: {} };
    this.zipper.storage.get = (key) => {
      return "hello " + key;
    };

    return ${req.body.code}
    `,
  );

  const output = functionInSandbox();

  res
    .status(200)
    .json({ message: 'Hello from Next.js!', method: req.method, output });
}

// Sync
