"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type UseFormRegister } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { UserRole } from "@prisma/client";
import { createUser, updateUser } from "@/actions/users";
import type { UserListItem } from "@/actions/users";
import type { TeamOption } from "@/actions/teams";
import type { LegalServiceOption } from "@/actions/legal-services";
import {
  createUserSchema,
  updateUserSchema,
  type CreateUserInput,
  type UpdateUserInput,
} from "@/validators";
import { ROLE_LABELS } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { SearchableMultiSelect } from "@/components/ui/searchable-multi-select";

const ALL_ROLES = Object.keys(ROLE_LABELS) as UserRole[];

type UserFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: UserListItem;
  canAssignSuperAdmin: boolean;
  teams: TeamOption[];
  legalServices: LegalServiceOption[];
};

type FormValues = CreateUserInput & UpdateUserInput & { isActive?: boolean };

function PasswordField({
  id,
  label,
  placeholder,
  error,
  register,
  name,
  showPassword,
  onToggleVisibility,
}: {
  id: string;
  label: string;
  placeholder?: string;
  error?: string;
  register: UseFormRegister<FormValues>;
  name: "password" | "confirmPassword";
  showPassword: boolean;
  onToggleVisibility: () => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          placeholder={placeholder}
          className="pr-10"
          {...register(name)}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
          onClick={onToggleVisibility}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Eye className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

export function UserForm({
  open,
  onOpenChange,
  user,
  canAssignSuperAdmin,
  teams,
  legalServices,
}: UserFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const isEditing = !!user;

  const assignableRoles = canAssignSuperAdmin
    ? ALL_ROLES
    : ALL_ROLES.filter((r) => r !== "SUPER_ADMIN");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(isEditing ? updateUserSchema : createUserSchema),
    defaultValues: {
      role: "LAWYER",
      isActive: true,
      teamId: null,
      legalServiceIds: [],
    },
  });

  const role = watch("role");
  const isActive = watch("isActive");
  const teamId = watch("teamId");
  const legalServiceIds = watch("legalServiceIds") ?? [];

  useEffect(() => {
    if (!open) return;

    reset(
      user
        ? {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            role: user.role,
            isActive: user.isActive,
            teamId: user.teamId,
            legalServiceIds: user.legalServices.map((service) => service.id),
            password: "",
            confirmPassword: "",
          }
        : {
            role: "LAWYER",
            isActive: true,
            teamId: null,
            legalServiceIds: [],
            password: "",
            confirmPassword: "",
          }
    );
    setError(null);
    setShowPassword(false);
    setShowConfirmPassword(false);
  }, [open, user, reset]);

  async function onSubmit(data: FormValues) {
    setError(null);

    if (isEditing) {
      const payload: UpdateUserInput = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        role: data.role,
        isActive: data.isActive,
        teamId: data.teamId || null,
        legalServiceIds: data.legalServiceIds ?? [],
        password: data.password || "",
      };
      const result = await updateUser(user!.id, payload);
      if (result.success) {
        onOpenChange(false);
        router.refresh();
      } else {
        setError(result.error ?? "Failed to update user");
      }
    } else {
      const result = await createUser({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        role: data.role,
        password: data.password!,
        confirmPassword: data.confirmPassword!,
        teamId: data.teamId || null,
        legalServiceIds: data.legalServiceIds ?? [],
      });
      if (result.success) {
        onOpenChange(false);
        router.refresh();
      } else {
        setError(result.error ?? "Failed to create user");
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit User" : "New User"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update user account details and access role"
              : "Create a new firm user account"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" {...register("firstName")} />
              {errors.firstName && (
                <p className="text-sm text-destructive">
                  {errors.firstName.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" {...register("lastName")} />
              {errors.lastName && (
                <p className="text-sm text-destructive">
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register("email")} />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" {...register("phone")} />
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            <SearchableSelect
              value={role}
              onValueChange={(v) => setValue("role", v as UserRole)}
              options={assignableRoles.map((r) => ({
                value: r,
                label: ROLE_LABELS[r],
              }))}
              placeholder="Select role"
              searchPlaceholder="Search roles..."
            />
            {errors.role && (
              <p className="text-sm text-destructive">{errors.role.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Team</Label>
            <SearchableSelect
              value={teamId ?? "none"}
              onValueChange={(v) =>
                setValue("teamId", v === "none" ? null : v)
              }
              options={[
                { value: "none", label: "No team" },
                ...teams.map((team) => ({
                  value: team.id,
                  label: team.name,
                })),
              ]}
              placeholder="No team"
              searchPlaceholder="Search teams..."
            />
            <p className="text-xs text-muted-foreground">
              Each user can belong to only one team.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Legal Services</Label>
            <SearchableMultiSelect
              values={legalServiceIds}
              onValuesChange={(values) => setValue("legalServiceIds", values)}
              options={legalServices.map((service) => ({
                value: service.id,
                label: service.name,
              }))}
              placeholder="Select legal services"
              searchPlaceholder="Search legal services..."
            />
            <p className="text-xs text-muted-foreground">
              A user can be assigned to multiple legal services.
            </p>
          </div>

          <PasswordField
            id="password"
            label={isEditing ? "New Password (optional)" : "Password"}
            placeholder={isEditing ? "Leave blank to keep current" : undefined}
            error={errors.password?.message}
            register={register}
            name="password"
            showPassword={showPassword}
            onToggleVisibility={() => setShowPassword((current) => !current)}
          />

          {!isEditing && (
            <PasswordField
              id="confirmPassword"
              label="Confirm Password"
              error={errors.confirmPassword?.message}
              register={register}
              name="confirmPassword"
              showPassword={showConfirmPassword}
              onToggleVisibility={() =>
                setShowConfirmPassword((current) => !current)
              }
            />
          )}

          {isEditing && (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label htmlFor="isActive">Active account</Label>
                <p className="text-xs text-muted-foreground">
                  Inactive users cannot sign in
                </p>
              </div>
              <Switch
                id="isActive"
                checked={isActive ?? true}
                onCheckedChange={(checked) => setValue("isActive", checked)}
              />
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isEditing ? "Save Changes" : "Create User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
