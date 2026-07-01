"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Copy, Eye, EyeOff, Plus, Trash2, UserRound } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { subscribeProjects } from "@/lib/projects";
import {
  assignProject,
  COGNITO_PASSWORD_HINT,
  createUser,
  deleteUser,
  getCognitoPasswordError,
  getUsers,
  unassignProject,
} from "@/lib/users";
import { authErrorMessage } from "@/lib/authErrors";
import type { Project, UserProfile } from "@/lib/types";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/EmptyState";
import { FieldError, Input, Label } from "@/components/ui/Field";

export default function AdminUsersPage() {
  return (
    <AdminShell>
      <UsersManager />
    </AdminShell>
  );
}

function UsersManager() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [manageUser, setManageUser] = useState<UserProfile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserProfile | null>(null);

  const reload = useCallback(async () => {
    const list = await getUsers();
    setUsers(list.sort((a, b) => b.createdAt - a.createdAt));
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    if (!user) return;
    return subscribeProjects(user.uid, setProjects);
  }, [user]);

  async function handleCreateUser(email: string, password: string) {
    await createUser(email, password);
    await reload();
    setCreateOpen(false);
  }

  async function handleDeleteUser() {
    if (!deleteTarget) return;
    await deleteUser(deleteTarget.uid);
    await reload();
    setDeleteTarget(null);
    if (manageUser?.uid === deleteTarget.uid) setManageUser(null);
  }

  async function handleToggleProject(uid: string, projectId: string, assigned: boolean) {
    if (assigned) {
      await unassignProject(uid, projectId);
    } else {
      await assignProject(uid, projectId);
    }
    // Refresh the manage modal data and user list.
    await reload();
    setManageUser((prev) => {
      if (!prev || prev.uid !== uid) return prev;
      const ids = assigned
        ? prev.assignedProjectIds.filter((id) => id !== projectId)
        : [...prev.assignedProjectIds, projectId];
      return { ...prev, assignedProjectIds: ids };
    });
  }

  return (
    <>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            User Accounts
          </h1>
          <p className="mt-1 text-muted">
            Create accounts for your team and assign them projects.
          </p>
        </div>
        <Button size="lg" onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" /> Create User
        </Button>
      </div>

      <div className="mt-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner className="size-8" />
          </div>
        ) : users.length === 0 ? (
          <EmptyState
            icon={UserRound}
            title="No users yet"
            description="Create a user account and assign projects to give your team access."
            action={
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="size-4" /> Create User
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {users.map((u) => (
              <UserCard
                key={u.uid}
                user={u}
                projects={projects}
                onManage={() => setManageUser(u)}
                onDelete={() => setDeleteTarget(u)}
              />
            ))}
          </div>
        )}
      </div>

      <CreateUserModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreateUser}
      />

      {manageUser && (
        <ManageUserModal
          user={manageUser}
          projects={projects}
          open={!!manageUser}
          onClose={() => setManageUser(null)}
          onToggleProject={handleToggleProject}
          onDelete={() => {
            setDeleteTarget(manageUser);
            setManageUser(null);
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteUser}
        title="Delete user?"
        description={
          deleteTarget
            ? `"${deleteTarget.email}" will be permanently removed from both Cognito and the database.`
            : ""
        }
        confirmLabel="Delete user"
      />
    </>
  );
}

/* ----------------------------------------------------------------- */

function UserCard({
  user,
  projects,
  onManage,
  onDelete,
}: {
  user: UserProfile;
  projects: Project[];
  onManage: () => void;
  onDelete: () => void;
}) {
  const assignedCount = user.assignedProjectIds.length;
  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">{user.email}</p>
          <p className="mt-0.5 text-xs text-muted">
            {assignedCount === 0
              ? "No projects assigned"
              : `${assignedCount} project${assignedCount !== 1 ? "s" : ""} assigned`}
          </p>
        </div>
        <button
          type="button"
          aria-label="Delete user"
          onClick={onDelete}
          className="rounded-lg p-2 text-muted transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
      <div className="mt-4">
        <Button variant="outline" className="w-full" onClick={onManage}>
          Manage Projects
        </Button>
      </div>
    </Card>
  );
}

/* ----------------------------------------------------------------- */

function CreateUserModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (email: string, password: string) => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const passwordError = getCognitoPasswordError(password);
  const showPasswordError =
    passwordTouched && password.length > 0 ? passwordError ?? undefined : undefined;

  useEffect(() => {
    if (open) return;
    setEmail("");
    setPassword("");
    setShowPassword(false);
    setCopied(false);
    setPasswordTouched(false);
    setError("");
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordTouched(true);
    setError("");
    if (passwordError) return;
    setSubmitting(true);
    try {
      await onCreate(email, password);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  function copyPassword() {
    if (!password) return;
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create User Account"
      description="The user will sign in with these credentials."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            form="create-user-form"
            type="submit"
            loading={submitting}
            disabled={!password || !!passwordError}
          >
            Create Account
          </Button>
        </>
      }
    >
      <form id="create-user-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="new-email">Email</Label>
          <Input
            id="new-email"
            type="email"
            autoComplete="off"
            placeholder="user@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="new-password">Password</Label>
          <div className="relative">
            <Input
              id="new-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Enter a secure password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setPasswordTouched(true)}
              className="pr-19 font-mono tracking-wide"
              required
            />
            <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="grid size-9 place-items-center rounded-lg text-muted transition-colors hover:bg-stone-100 hover:text-ink"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
              <button
                type="button"
                onClick={copyPassword}
                disabled={!password}
                className="grid size-9 place-items-center rounded-lg text-muted transition-colors hover:bg-brand-50 hover:text-brand-700 disabled:opacity-40"
                aria-label="Copy password"
              >
                {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
              </button>
            </div>
          </div>
          <p className="mt-1.5 text-xs text-muted">{COGNITO_PASSWORD_HINT}</p>
          <FieldError>{showPasswordError}</FieldError>
        </div>
        <FieldError>{error}</FieldError>
      </form>
    </Modal>
  );
}

/* ----------------------------------------------------------------- */

function ManageUserModal({
  user,
  projects,
  open,
  onClose,
  onToggleProject,
  onDelete,
}: {
  user: UserProfile;
  projects: Project[];
  open: boolean;
  onClose: () => void;
  onToggleProject: (uid: string, projectId: string, assigned: boolean) => Promise<void>;
  onDelete: () => void;
}) {
  const [toggling, setToggling] = useState<string | null>(null);

  async function handleToggle(projectId: string, assigned: boolean) {
    setToggling(projectId);
    await onToggleProject(user.uid, projectId, assigned);
    setToggling(null);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={user.email}
      description="Toggle which projects this user can access."
      footer={
        <>
          <Button
            variant="outline"
            className="border-red-200 text-red-600 hover:bg-red-50"
            onClick={onDelete}
          >
            <Trash2 className="size-4" /> Delete User
          </Button>
          <Button onClick={onClose}>Done</Button>
        </>
      }
    >
      {projects.length === 0 ? (
        <p className="text-sm text-muted">
          You have no projects yet. Create one from the Dashboard first.
        </p>
      ) : (
        <ul className="space-y-2">
          {projects.map((project) => {
            const assigned = user.assignedProjectIds.includes(project.id);
            const busy = toggling === project.id;
            return (
              <li key={project.id}>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleToggle(project.id, assigned)}
                  className="flex w-full items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-left transition-colors hover:bg-brand-50 disabled:opacity-60"
                >
                  <span
                    className={`grid size-5 shrink-0 place-items-center rounded-md border-2 transition-colors ${
                      assigned
                        ? "border-brand-600 bg-brand-600"
                        : "border-stone-300 bg-white"
                    }`}
                  >
                    {assigned && <Check className="size-3 text-white" />}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">
                      {project.name}
                    </p>
                    <p className="font-mono text-xs text-muted">
                      {project.shareKey}
                    </p>
                  </div>
                  {busy && <Spinner className="ml-auto size-4 shrink-0" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
}
