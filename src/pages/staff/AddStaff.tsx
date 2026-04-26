import {
  Alert,
  Button,
  Group,
  Modal,
  PasswordInput,
  Select,
  Stack,
  TextInput,
} from "@mantine/core";
import { useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../store/auth";
import { useNavigate } from "react-router-dom";
import { PhoneNumberInput } from "../../components/common/PhoneNumberInput";
import { useCreateStaffUser } from "../../service/staff";
import type { CreateStaffPayload, StaffRole } from "../../types/staff";
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

export default function AddStaff() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const companyId = useAuthStore((state) => state.company?.id);
  const queryClient = useQueryClient();
  const createStaffMutation = useCreateStaffUser();
  const [errors, setErrors] = useState<FormErrors>({});
  const [form, setForm] = useState<CreateStaffPayload>({
    full_name: "",
    phone_number: UZBEKISTAN_PHONE_PREFIX,
    password: "",
    role: "admin",
  });

  const resetForm = () => {
    setForm({
      full_name: "",
      phone_number: UZBEKISTAN_PHONE_PREFIX,
      password: "",
      role: "admin",
    });
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
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

    if (!form.password.trim()) {
      nextErrors.password = t("staffPage.passwordRequired");
    } else if (form.password.trim().length < MIN_PASSWORD_LENGTH) {
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

    if (!validateForm()) {
      return;
    }

    try {
      await createStaffMutation.mutateAsync({ ...form, company_id: companyId });
      await queryClient.invalidateQueries({
        queryKey: ["staff-users", companyId],
      });
      showSuccessNotification({
        message: t("staffPage.createSuccess"),
      });
      handleClose();
    } catch (createError) {
      const message =
        createError instanceof Error
          ? createError.message
          : t("staffPage.createError");

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
      title={t("staffPage.createModalTitle")}
      centered
    >
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
            placeholder="Test@123"
            value={form.password}
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
            required
          />

          <Select
            label={t("staffPage.roleLabel")}
            value={form.role}
            onChange={(value) => {
              if (value === "admin" || value === "operator") {
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
              { value: "operator", label: t("staffPage.operatorRole") },
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
            <Button type="submit" loading={createStaffMutation.isPending}>
              {t("staffPage.createButton")}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
