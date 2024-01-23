'use client';
import Link from 'next/link';
import DashboardLayout from '../layout';
import { useOrganization } from '~/hooks/use-organization';
import { PiArrowLeftLight, PiCode } from 'react-icons/pi';
import { NextPageWithLayout } from '~/pages/_app';
import Header from '~/components/app-dir/layouts/header';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Tabs,
  Divider,
  Label,
  Input,
  Form,
  Switch,
  Button,
  List,
  cn,
  Textarea,
  Show,
} from '@zipper/ui';
import { generateDefaultSlug } from '~/utils/generate-default';
import { useForm } from 'react-hook-form';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import { HiLockClosed, HiLockOpen } from 'react-icons/hi';
import { trpc } from '~/utils/trpc';
import { MIN_SLUG_LENGTH, useAppSlug } from '~/hooks/use-app-slug';
import { HiExclamationTriangle } from 'react-icons/hi2';
import { CheckIcon } from '@radix-ui/react-icons';
import { useEditorContext } from '~/components/context/editor-context';
import { useOrganizationList } from '~/hooks/use-organization-list';
import { useRouter } from 'next/router';
import { getEditAppletLink } from '@zipper/utils';
import { toast } from 'sonner';

const getDefaultCreateAppFormValues = () => ({
  name: generateDefaultSlug(),
  description: '',
  isPublic: false,
  requiresAuthToRun: false,
});

const DEFAULT_TEMPLATES = [
  {
    id: 'hello-world',
    name: 'Hello World',
    description: '👋',
    shouldFork: false,
  },
  {
    id: 'ai',
    name: 'AI Generated Code',
    description: '🤖✨',
    shouldFork: false,
  },
];

const CreateFormSchema = z.object({
  name: z.string().min(2, {
    message: 'applet-name must be at least 2 characters.',
  }),
  description: z.string().optional(),
  isPublic: z.boolean().default(false),
  requiresAuthToRun: z.boolean().default(false),
});

const DashboardCreateZiplet: NextPageWithLayout = () => {
  /* ------------------- Hooks ------------------ */
  const createAppForm = useForm<z.infer<typeof CreateFormSchema>>({
    resolver: zodResolver(CreateFormSchema),
    defaultValues: getDefaultCreateAppFormValues(),
  });

  const { organization } = useOrganization();
  const { setActive } = useOrganizationList();
  const router = useRouter();
  const utils = trpc.useContext();
  const { scripts } = useEditorContext();

  const { slugExists, appSlugQuery } = useAppSlug(createAppForm.watch('name'));

  /* ------------------ States ------------------ */
  const [currentTab, setCurrentTab] = useState('first-step');
  const [currentSelectedTemplate, setCurrentSelectedTemplate] = useState<
    (typeof DEFAULT_TEMPLATES)[number] | undefined
  >(undefined);
  const [templates, setTemplates] = useState<
    (typeof DEFAULT_TEMPLATES)[number][]
  >([]);

  /* ------------------ Queries ----------------- */
  const templatesQuery = trpc.app.templates.useQuery();

  /* ----------------- Mutation ----------------- */
  const addScript = trpc.script.add.useMutation();
  const generateCodeWithAI = trpc.ai.pipeline.useMutation();

  const addApp = trpc.app.add.useMutation({
    async onSuccess() {
      // refetches posts after a post is added
      await utils.app.byAuthedUser.invalidate();
      if (router.query['resource-owner']) {
        await utils.app.byResourceOwner.invalidate({
          resourceOwnerSlug: router.query['resource-owner'] as string,
        });
      }
    },
  });

  const forkTemplate = trpc.app.fork.useMutation({
    async onSuccess() {
      // refetches posts after a post is added
      await utils.app.byAuthedUser.invalidate();
      if (router.query['resource-owner']) {
        await utils.app.byResourceOwner.invalidate({
          resourceOwnerSlug: router.query['resource-owner'] as string,
        });
      }
    },
  });

  /* ----------------- Callbacks ---------------- */
  const runAddAppMutation = useCallback(async () => {
    const { name, description, isPublic, requiresAuthToRun } = {
      name: createAppForm.getValues('name'),
      description: createAppForm.getValues('description'),
      isPublic: createAppForm.getValues('isPublic'),
      requiresAuthToRun: createAppForm.getValues('requiresAuthToRun'),
    };

    const aiOutput =
      currentSelectedTemplate?.name === 'AI Generated Code' && description
        ? await generateCodeWithAI.mutateAsync({
            userRequest: description,
          })
        : undefined;

    const mainCode = aiOutput?.find(
      (output) => output.filename === 'main.ts',
    )?.code;

    await addApp.mutateAsync(
      {
        description,
        name,
        isPrivate: !isPublic,
        requiresAuthToRun,
        organizationId: organization?.id,
        aiCode: mainCode,
      },
      {
        onSuccess: async (applet) => {
          createAppForm.reset(getDefaultCreateAppFormValues());

          if (
            (organization?.id ?? null) !== (organization?.id ?? null) &&
            setActive
          ) {
            await setActive(organization?.id || null);
          }
          if (aiOutput) {
            const otherFiles = aiOutput.filter(
              (output) =>
                output.filename !== 'main.ts' && output.filename !== 'main.tsx',
            );

            await Promise.allSettled(
              otherFiles.map((output) => {
                return addScript.mutateAsync({
                  filename: output.filename,
                  appId: applet!.id,
                  order: scripts.length + 1,
                  code: output.code,
                });
              }),
            );
          }

          toast('Ziplet has been created', {
            description: 'Redirecting you to playground...',
            duration: 9999,
          });

          router.push(
            getEditAppletLink(applet!.resourceOwner!.slug, applet!.slug),
          );
        },
      },
    );
  }, []);

  const onSubmit = useCallback(async (data: any) => {
    const selectedTemplate = templates.find(
      (t) => t.id === currentSelectedTemplate?.id,
    );

    if (selectedTemplate?.shouldFork) {
      await forkTemplate.mutateAsync(
        {
          id: selectedTemplate.id,
          name: data.name,
          connectToParent: false,
        },
        {
          onSuccess: (applet) => {
            createAppForm.reset();

            toast('Ziplet has been created', {
              description: 'Redirecting you to playground...',
              duration: 9999,
            });

            router.push(
              getEditAppletLink(applet!.resourceOwner!.slug, applet!.slug),
            );
          },
        },
      );
    } else {
      await runAddAppMutation();
    }
  }, []);

  /* ------------------- Memos ------------------ */
  const isSlugValid = useMemo(() => {
    const slug = createAppForm.watch('name');
    console.log('query', appSlugQuery.isFetched);
    console.log(
      'slug',
      appSlugQuery.isFetched && slug.length >= MIN_SLUG_LENGTH,
    );
    return appSlugQuery.isFetched && slug.length >= MIN_SLUG_LENGTH;
  }, [appSlugQuery.isFetched, createAppForm.watch]);

  const isSubmitDisabled = useMemo(
    () =>
      !currentSelectedTemplate ||
      (currentSelectedTemplate.name === 'AI Generated Code' &&
        !createAppForm.getValues().description) ||
      slugExists ||
      createAppForm.getValues().name.length < MIN_SLUG_LENGTH ||
      addApp.isLoading ||
      generateCodeWithAI.isLoading ||
      createAppForm.formState.isSubmitting,
    [
      createAppForm,
      currentSelectedTemplate,
      addApp.isLoading,
      generateCodeWithAI,
    ],
  );

  /* ------------------ Effects ----------------- */
  useEffect(() => {
    if (templatesQuery.data) {
      const mappedQueryTemplates = templatesQuery.data.map((template) => {
        return {
          id: template.id,
          name: template.name,
          description: template.description,
          shouldFork: true,
        } as (typeof DEFAULT_TEMPLATES)[number];
      });

      setTemplates([...DEFAULT_TEMPLATES, ...mappedQueryTemplates]);
    }
  }, [templatesQuery.data]);

  return (
    <DashboardLayout showNav={false}>
      <div className="w-full flex flex-col gap-6 items-center justify-center h-[calc(100vh_-_86px)] relative">
        <Link
          href={`/dashboard-tw/`}
          className="flex items-center gap-1 transition-all group text-sm absolute left-0 top-0"
        >
          <PiArrowLeftLight className="transition-all group-hover:-translate-x-1" />
          Back to Dashboard
        </Link>

        <Tabs
          value={currentTab}
          defaultValue="first-step"
          className="lg:w-[920px] lg:h-[600px]"
        >
          <Tabs.List className="rounded-sm gap-6 relative bg-background w-full flex items-center justify-between">
            <Tabs.Trigger
              value="first-step"
              onClick={() => setCurrentTab('first-step')}
              className="bg-background group flex items-center gap-3 px-0 data-[state=active]:shadow-none"
            >
              <span className="border w-8 h-8 flex items-center text-primary justify-center rounded-full border-primary text-md font-semibold group-data-[state=active]:bg-primary group-data-[state=active]:text-white-50">
                1
              </span>
              <article className="flex flex-col items-start">
                <strong className="font-normal">First</strong>
                <p className="text-gray-400 text-sm">Configuration</p>
              </article>
            </Tabs.Trigger>
            <Divider />
            <Tabs.Trigger
              value="second-step"
              onClick={() => setCurrentTab('second-step')}
              className="bg-background group flex items-center gap-3 px-0 data-[state=active]:shadow-none"
            >
              <span className="border w-8 h-8 flex items-center justify-center rounded-full border-primary text-md text-primary font-semibold group-data-[state=active]:bg-primary group-data-[state=active]:text-white-50">
                2
              </span>
              <article className="flex flex-col items-start">
                <strong className="font-normal">Second</strong>
                <p className="text-gray-400 text-sm">Initialization</p>
              </article>
            </Tabs.Trigger>
          </Tabs.List>
          <Form {...createAppForm}>
            <form onSubmit={createAppForm.handleSubmit(onSubmit)}>
              <Tabs.Content
                value="first-step"
                className="flex items-start flex-col gap-6 mt-6"
              >
                <section className="w-full">
                  <Form.Field
                    control={createAppForm.control}
                    name="name"
                    render={({ field }) => (
                      <Form.Item>
                        <Form.Label htmlFor="applet-name" aria-required>
                          Applet Name
                        </Form.Label>
                        <div className="flex items-center gap-3 mt-3">
                          <span className="px-3 bg-muted/50 text-sm whitespace-nowrap rounded-sm h-9 flex items-center">
                            {organization?.name}
                          </span>
                          <span>/</span>
                          <Form.Control>
                            <Input id="applet-name" autoFocus {...field} />
                          </Form.Control>
                          <Show
                            when={
                              (slugExists as boolean) === false &&
                              isSlugValid === true
                            }
                            fallback={
                              <HiExclamationTriangle
                                className="fill-brand-red"
                                size={24}
                              />
                            }
                          >
                            <CheckIcon className="fill-green-600 w-6 h-6 text-green-600" />
                          </Show>
                        </div>
                        <Form.Description>{`Your app will be available at https://${field.value}.zipper.run`}</Form.Description>
                      </Form.Item>
                    )}
                  ></Form.Field>
                </section>

                <Divider />

                <section className="w-full flex flex-col gap-3">
                  <Label htmlFor="isPlublic">Visibility</Label>
                  <Form.Field
                    control={createAppForm.control}
                    name="isPublic"
                    render={({ field }) => (
                      <Form.Item className="p-3 border border-border flex items-center justify-between">
                        <Form.Label className="flex items-center gap-3 font-normal">
                          <PiCode />
                          Is this code public?
                        </Form.Label>
                        <Form.Control>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </Form.Control>
                      </Form.Item>
                    )}
                  />

                  <Form.Field
                    control={createAppForm.control}
                    name="requiresAuthToRun"
                    render={({ field }) => (
                      <Form.Item className="p-3 border border-border flex items-center justify-between">
                        <Form.Label className="flex items-center gap-3 font-normal">
                          {field.value === true ? (
                            <HiLockClosed />
                          ) : (
                            <HiLockOpen />
                          )}
                          Require sign in to run?
                        </Form.Label>
                        <Form.Control>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </Form.Control>
                      </Form.Item>
                    )}
                  />
                </section>

                <footer className="flex items-center gap-3 justify-end w-full">
                  <Button variant="ghost" asChild>
                    <Link href={`/dashboard-tw/`}>Cancel</Link>
                  </Button>
                  <Button onClick={() => setCurrentTab('second-step')}>
                    Next
                  </Button>
                </footer>
              </Tabs.Content>
              <Tabs.Content
                value="second-step"
                className="mt-6 flex flex-col gap-6"
              >
                <Form.Item className="flex flex-col gap-3 transition-all">
                  <Form.Label>Start from a Template</Form.Label>
                  <section className="w-full grid grid-cols-3 gap-3 mt-3">
                    <List data={templates}>
                      {(template) => (
                        <div
                          onClick={() =>
                            setCurrentSelectedTemplate((prev) =>
                              prev?.id === template.id ? undefined : template,
                            )
                          }
                          className={cn(
                            'h-32 hover:-translate-y-1 cursor-pointer border border-background hover:border-muted transition-all flex flex-col justify-center p-6 shadow bg-background',
                            currentSelectedTemplate?.id === template.id &&
                              'border-primary hover:border-primary',
                          )}
                        >
                          <h4 className="font-medium">{template.name}</h4>
                          <p>{template.description}</p>
                        </div>
                      )}
                    </List>
                  </section>
                </Form.Item>

                <Show
                  when={currentSelectedTemplate?.name === 'AI Generated Code'}
                >
                  <Form.Field
                    control={createAppForm.control}
                    name="description"
                    render={({ field }) => (
                      <Form.Item
                        className={cn(`flex flex-col gap-3 transition-all`)}
                      >
                        <Form.Label>Generate code using AI</Form.Label>
                        <Form.Description>
                          Tell us what you'd like your applet to do and we'll
                          use the magic of AI to autogenerate some code to get
                          you started.{' '}
                          <strong>This process can take up to a minute.</strong>
                        </Form.Description>
                        <Form.Control>
                          <Textarea
                            autoFocus
                            className="font-mono h-28 w-full"
                            {...field}
                          />
                        </Form.Control>
                        <Form.Message />
                      </Form.Item>
                    )}
                  />
                </Show>

                <footer className="flex items-center gap-3 justify-end w-full">
                  <Button variant="ghost" asChild>
                    <Link href={`/dashboard-tw/`}>Cancel</Link>
                  </Button>
                  <Button type="submit" disabled={isSubmitDisabled}>
                    Create
                  </Button>
                </footer>
              </Tabs.Content>
            </form>
          </Form>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

DashboardCreateZiplet.header = () => (
  <Header showDivider={false} showNav showOrgSwitcher />
);

export default DashboardCreateZiplet;
