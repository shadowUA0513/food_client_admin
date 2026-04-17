import {
  Alert,
  Button,
  Group,
  Loader,
  Modal,
  PasswordInput,
  Select,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../store/auth";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { PhoneNumberInput } from "../../components/common/PhoneNumberInput";
import { useStaffUserById, useUpdateStaffUser } from "../../service/staff";
import type { StaffRole, StaffUser, UpdateStaffPayload } from "../../types/staff";
import {
  showErrorNotification,
  showSuccessNotification,
} from "../../utils/notifications";
import {
  hasCompleteUzbekistanPhone,
  UZBEKISTAN_PHONE_PREFIX,
} from "../../utils/phone";

interface FormErrors {
  full_name?: string;
  phone_number?: string;
  password?: string;
  role?: string;
  form?: string;
}

const MIN_PASSWORD_LENGTH = 6;

export default function EditStaff() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const companyId = useAuthStore((state) => state.company?.id);
  const { staffId } = useParams();
  const queryClient = useQueryClient();
  const updateStaffMutation = useUpdateStaffUser();
  const locationStaff = (location.state as { staff?: StaffUser } | null)?.staff;
  const {
    data: fetchedStaff,
    isLoading,
    error,
  } = useStaffUserById(staffId);
  const staff = locationStaff ?? fetchedStaff;
  const isLegacySuperAdmin = staff?.role === "super_admin";
  const [errors, setErrors] = useState<FormErrors>({});
  const [form, setForm] = useState<UpdateStaffPayload>({
    full_name: "",
    phone_number: UZBEKISTAN_PHONE_PREFIX,
    password: "",
    role: "admin",
  });

  useEffect(() => {
    if (!staff) {
      return;
    }

    setForm({
      full_name: staff.full_name,
      phone_number: staff.phone_number || UZBEKISTAN_PHONE_PREFIX,
      password: "",
      role: staff.role,
    });
    setErrors({});
  }, [staff]);

  const handleClose = () => {
    setErrors({});
    navigate("/staff");
  };

  const validateForm = () => {
    const nextErrors: FormErrors = {};

    if (!form.full_name.trim()) {
      nextErrors.full_name = t("staffPage.fullNameRequired");
    }

    if (
      !form.phone_number.trim() ||
      form.phone_number === UZBEKISTAN_PHONE_PREFIX
    ) {
      nextErrors.phone_number = t("staffPage.phoneRequired");
    } else if (!hasCompleteUzbekistanPhone(form.phone_number)) {
      nextErrors.phone_number = t("staffPage.phoneInvalid");
    }

    if (form.password && form.password.trim().length < MIN_PASSWORD_LENGTH) {
      nextErrors.password = t("staffPage.passwordTooShort");
    }

    if (!form.role) {
      nextErrors.role = t("staffPage.roleRequired");
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!staffId || !validateForm()) {
      return;
    }

    const password = form.password?.trim();
    const payload: UpdateStaffPayload = {
      full_name: form.full_name,
      phone_number: form.phone_number,
      role: form.role,
      company_id: companyId,
      ...(password ? { password } : {}),
    };

    try {
      await updateStaffMutation.mutateAsync({ id: staffId, payload });
      await queryClient.invalidateQueries({ queryKey: ["staff-users", companyId] });
      await queryClient.invalidateQueries({ queryKey: ["staff-user", staffId] });
      showSuccessNotification({
        message: "Staff member updated successfully.",
      });
      handleClose();
    } catch (updateError) {
      const message =
        updateError instanceof Error
          ? updateError.message
          : t("staffPage.updateError");

      showErrorNotification({ message });
      setErrors((current) => ({
        ...current,
        form: message,
      }));
    }
  };

  return (
    <Modal
      opened
      onClose={handleClose}
      title={t("staffPage.editModalTitle")}
      centered
    >
      {error ? (
        <Stack gap="md">
          <Alert color="red" variant="light">
            {error.message || t("staffPage.loadError")}
          </Alert>
          <Group justify="flex-end">
            <Button variant="default" onClick={handleClose}>
              {t("staffPage.cancel")}
            </Button>
          </Group>
        </Stack>
      ) : isLoading && !staff ? (
        <Stack align="center" gap="sm" py="md">
          <Loader />
          <Text c="dimmed">{t("staffPage.loading")}</Text>
        </Stack>
      ) : (
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <TextInput
            label={t("staffPage.fullNameLabel")}
            placeholder="John Doe"
            value={form.full_name}
            onChange={(event) => {
              const value = event.currentTarget.value;

              setForm((current) => ({
                ...current,
                full_name: value,
              }));
              setErrors((current) => ({
                ...current,
                full_name: undefined,
                form: undefined,
              }));
            }}
            error={errors.full_name}
            required
          />

          <PhoneNumberInput
            label={t("staffPage.phoneLabel")}
            placeholder="+998 00 000 00 00"
            value={form.phone_number}
            onChange={(value) => {
              setForm((current) => ({
                ...current,
                phone_number: value,
              }));
              setErrors((current) => ({
                ...current,
                phone_number: undefined,
                form: undefined,
              }));
            }}
            error={errors.phone_number}
            required
          />

          <PasswordInput
            label={t("staffPage.passwordLabel")}
            placeholder="Leave empty to keep current password"
            value={form.password ?? ""}
            onChange={(event) => {
              const value = event.currentTarget.value;

              setForm((current) => ({
                ...current,
                password: value,
              }));
              setErrors((current) => ({
                ...current,
                password: undefined,
                form: undefined,
              }));
            }}
            error={errors.password}
          />

          {isLegacySuperAdmin ? (
            <Alert color="blue" variant="light">
              {t("staffPage.legacySuperAdminHelp")}
            </Alert>
          ) : null}

          <Select
            label={t("staffPage.roleLabel")}
            value={form.role}
            onChange={(value) => {
              if (value === "admin" || value === "super_admin") {
                setForm((current) => ({
                  ...current,
                  role: value as StaffRole,
                }));
              }
              setErrors((current) => ({
                ...current,
                role: undefined,
                form: undefined,
              }));
            }}
            data={[
              { value: "admin", label: t("staffPage.adminRole") },
              ...(isLegacySuperAdmin
                ? [
                    {
                      value: "super_admin",
                      label: t("staffPage.superAdminRole"),
                      disabled: true,
                    },
                  ]
                : []),
            ]}
            error={errors.role}
            allowDeselect={false}
            required
          />

          {errors.form ? (
            <Alert color="red" variant="light">
              {errors.form}
            </Alert>
          ) : null}

          <Group justify="flex-end">
            <Button variant="default" onClick={handleClose}>
              {t("staffPage.cancel")}
            </Button>
            <Button type="submit" loading={updateStaffMutation.isPending}>
              {t("staffPage.saveButton")}
            </Button>
          </Group>
        </Stack>
      </form>
      )}
    </Modal>
  );
}
