'use client';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Divider,
  Input,
  Label,
  List,
  ShadSelect,
  Table,
} from '@zipper/tw/ui';
import { useOrganization } from '~/hooks/use-organization';
import { UserRole } from '@zipper/types';
import { Avatar } from '~/components/avatar';
import { HiEnvelope } from 'react-icons/hi2';
import { useUser } from '~/hooks/use-user';
import { trpc } from '~/utils/trpc';
import { toast } from 'sonner';
import { ReloadIcon } from '@radix-ui/react-icons';
import { Show } from '@zipper/tw/ui/modules/show';

/* -------------------------------------------- */
/* Types                                        */
/* -------------------------------------------- */

type UserListItem = {
  id?: string;
  role: string;
  name?: string | null;
  email: string;
  username?: string | null;
  createdAt?: Date;
  isInvite: boolean;
};

/* -------------------------------------------- */
/* Main                                         */
/* -------------------------------------------- */

const ManageMembers = () => {
  /* ------------------- Hooks ------------------ */
  const context = trpc.useContext();
  const { membershipList, role, invitationList, invite } = useOrganization({
    invitationList: {},
    membershipList: {},
  });

  const { user } = useUser();

  /* ------------------ States ------------------ */
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [invitedMemberEmail, setInvitedMemberEmail] = useState('');
  const [invitedMemberRole, setInvitedMemberRole] = useState<UserRole>(
    '' as UserRole,
  );
  const [isSubmitingInvite, setIsSubmitingInvite] = useState(false);

  /* ----------------- Mutations ---------------- */
  const updateMemberMutation = trpc.organization.updateMember.useMutation({
    onSuccess: () => {
      context.organization.getMemberships.invalidate();
    },
  });

  /* ----------------- Callbacks ---------------- */
  const onInviteMember = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitingInvite(true);

    await invite(invitedMemberEmail, invitedMemberRole);

    /** reseting form */
    return (
      setInvitedMemberEmail(''),
      setInvitedMemberRole('' as UserRole),
      setIsSubmitingInvite(false)
    );
  };

  const onChangeMemberRole = useCallback(
    async (value: string, member: UserListItem) => {
      if (member) {
        await updateMemberMutation.mutateAsync(
          {
            userId: member.id as string,
            data: {
              role: value as UserRole,
            },
          },
          {
            onSuccess: () => {
              toast('Member updated', {
                description: `${member.username}'s role has been updated`,
                duration: 5000,
              });
            },
            onError: (e) => {
              toast('Error', {
                description: e.message,
                duration: 5000,
              });
            },
          },
        );
      }
    },
    [],
  );

  /* ------------------- Memos ------------------ */
  const isInvitationDisabled = useMemo(
    () =>
      invitedMemberEmail === '' ||
      invitedMemberRole === ('' as UserRole) ||
      isSubmitingInvite,
    [invitedMemberRole, invitedMemberEmail],
  );

  const members = useMemo(() => {
    let members: UserListItem[] = [];
    let invites: UserListItem[] = [];

    if (membershipList) {
      members = membershipList?.map((m) => {
        return {
          name: m.user.name,
          username: m.user.slug,
          email: m.user.email,
          isInvite: false,
          id: m.user.id,
          createdAt: m.createdAt,
          role: m.role,
        };
      });
    }

    if (invitationList) {
      invites = invitationList.map((i) => {
        return {
          email: i.email,
          role: i.role,
          isInvite: true,
        };
      });
    }

    return members
      .concat(invites)
      .filter(
        (m) =>
          m.name?.includes(memberSearchTerm) ||
          m.username?.includes(memberSearchTerm) ||
          m.email.includes(memberSearchTerm),
      );
  }, [memberSearchTerm, membershipList, invitationList]);

  const isCurrentUserAdmin = useMemo(() => role === UserRole.Admin, [role]);

  /* ------------------ Render ------------------ */
  return (
    <div className="grid grid-cols-4 gap-9">
      <article className="flex flex-col col-span-1 gap-2">
        <h3 className="font-medium text-3xl">People</h3>
        <p>Manage people in this organization.</p>
      </article>

      <section className="flex col-span-3 flex-col gap-9 items-start">
        <Show when={isCurrentUserAdmin}>
          <section className="w-full flex flex-col gap-3">
            <h3 className="text-xl font-medium">Invite Member</h3>

            <span className="text-sm">
              Invite new members to this organization by email address.
            </span>

            <form className="w-full" onSubmit={onInviteMember}>
              <div className="w-full flex items-end gap-3">
                <div className="flex flex-col gap-3 flex-1">
                  <Label>Email address</Label>
                  <Input
                    placeholder="name@company.com"
                    onChange={(event) =>
                      setInvitedMemberEmail(event.target.value)
                    }
                  />
                </div>
                <div className="flex flex-col gap-3">
                  <Label>Role</Label>
                  <ShadSelect
                    onValueChange={(value: UserRole) =>
                      setInvitedMemberRole(value)
                    }
                  >
                    <ShadSelect.Trigger className="w-32">
                      <ShadSelect.Value placeholder="Select a role" />
                    </ShadSelect.Trigger>
                    <ShadSelect.Content>
                      <ShadSelect.Item value="member">Member</ShadSelect.Item>
                      <ShadSelect.Item value="admin">Admin</ShadSelect.Item>
                    </ShadSelect.Content>
                  </ShadSelect>
                </div>
                <Button
                  disabled={isInvitationDisabled}
                  type="submit"
                  className="flex items-center gap-3"
                >
                  <Show when={isSubmitingInvite} fallback={'Send Invitation'}>
                    <ReloadIcon className="animate-spin" />
                    Sending...
                  </Show>
                </Button>
              </div>
            </form>
          </section>
          <Divider />
        </Show>

        <section className="flex flex-col gap-3 w-full">
          <h3 className="text-xl font-medium">Team Members</h3>
          <Input
            placeholder="Search for team members"
            value={memberSearchTerm}
            onChange={(e) => setMemberSearchTerm(e.target.value)}
          />
          <Table>
            <Table.Header>
              <Table.Row className="hover:bg-background">
                <Table.Head>User</Table.Head>
                <Table.Head>Joined</Table.Head>
                <Table.Head>Role</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              <List data={members}>
                {(member) => {
                  const isLoggedUser = member.username === user?.username;
                  const isMemberRoleSelectDisabled =
                    !isCurrentUserAdmin || isLoggedUser || member.isInvite;

                  return (
                    <Table.Row>
                      <Table.Cell>
                        <div className="flex items-center gap-3">
                          <Avatar userId={member.id} />
                          <article>
                            <div className="flex items-center gap-3">
                              <Show when={member.isInvite}>
                                <React.Fragment>
                                  <HiEnvelope className="fill-foreground" />
                                  <p>{member.email}</p>
                                </React.Fragment>
                              </Show>
                              <p>{member.name ?? member.username}</p>
                              <Show when={isLoggedUser}>
                                <Badge variant="secondary">You</Badge>
                              </Show>
                            </div>
                            <i className="text-gray-400">{member.email}</i>
                          </article>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        {member.createdAt?.toLocaleDateString() ?? 'Invited'}
                      </Table.Cell>
                      <Table.Cell>
                        <ShadSelect
                          onValueChange={(value) =>
                            onChangeMemberRole(value, member)
                          }
                          disabled={isMemberRoleSelectDisabled}
                          value={member.role}
                        >
                          <ShadSelect.Trigger className="w-32">
                            <ShadSelect.Value />
                          </ShadSelect.Trigger>
                          <ShadSelect.Content>
                            <ShadSelect.Item value="basic_member">
                              Member
                            </ShadSelect.Item>
                            <ShadSelect.Item value="admin">
                              Admin
                            </ShadSelect.Item>
                          </ShadSelect.Content>
                        </ShadSelect>
                      </Table.Cell>
                    </Table.Row>
                  );
                }}
              </List>
            </Table.Body>
          </Table>
        </section>
      </section>
    </div>
  );
};

export default ManageMembers;
