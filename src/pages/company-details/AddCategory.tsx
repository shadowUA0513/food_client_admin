import {
  Alert,
  Button,
  Group,
  Modal,
  NumberInput,
  Stack,
  TextInput,
} from "@mantine/core";
import { useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { useCreateCategory } from "../../service/categories";
import type { CreateCategoryPayload } from "../../types/categories";
import {
  showErrorNotification,
  showSuccessNotification,
} from "../../utils/notifications";

interface FormErrors {
  name_uz?: string;
  name_ru?: string;
  sort_order?: string;
  form?: string;
}

const EMPTY_FORM = {
  name_uz: "",
  name_ru: "",
  sort_order: 0,
};

export default function AddCategory() {
  const { t } = useTranslation();
  const { companyId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const createCategoryMutation = useCreateCategory();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    navigate(`/companies/${companyId}/category`);
  };

  const validateForm = () => {
    const nextErrors: FormErrors = {};

    if (!form.name_uz.trim()) {
      nextErrors.name_uz = t("companyDetails.categoryNameUzRequired");
    }

    if (!form.name_ru.trim()) {
      nextErrors.name_ru = t("companyDetails.categoryNameRuRequired");
    }

    if (!Number.isFinite(form.sort_order)) {
      nextErrors.sort_order = t("companyDetails.sortOrderRequired");
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!companyId || !validateForm()) {
      return;
    }

    try {
      const payload: CreateCategoryPayload = {
        company_id: companyId,
        name_uz: form.name_uz.trim(),
        name_ru: form.name_ru.trim(),
        sort_order: Number(form.sort_order),
      };

      await createCategoryMutation.mutateAsync(payload);
      await queryClient.invalidateQueries({ queryKey: ["categories", companyId] });
      showSuccessNotification({
        message: t("companyDetails.categoryCreateSuccess"),
      });
      handleClose();
    } catch (createError) {
      const message =
        createError instanceof Error
          ? createError.message
          : t("companyDetails.categoryCreateError");

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
      title={t("companyDetails.addCategory")}
      centered
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <TextInput
            label={t("companyDetails.categoryNameUz")}
            placeholder={t("companyDetails.categoryNameUzPlaceholder")}
            value={form.name_uz}
            onChange={(event) => {
              const value = event.currentTarget.value;

              setForm((current) => ({
                ...current,
                name_uz: value,
              }));
              setErrors((current) => ({
                ...current,
                name_uz: undefined,
                form: undefined,
              }));
            }}
            error={errors.name_uz}
            required
          />

          <TextInput
            label={t("companyDetails.categoryNameRu")}
            placeholder={t("companyDetails.categoryNameRuPlaceholder")}
            value={form.name_ru}
            onChange={(event) => {
              const value = event.currentTarget.value;

              setForm((current) => ({
                ...current,
                name_ru: value,
              }));
              setErrors((current) => ({
                ...current,
                name_ru: undefined,
                form: undefined,
              }));
            }}
            error={errors.name_ru}
            required
          />

          <NumberInput
            label={t("companyDetails.sortOrder")}
            value={form.sort_order}
            onChange={(value) => {
              setForm((current) => ({
                ...current,
                sort_order: typeof value === "number" ? value : 0,
              }));
              setErrors((current) => ({
                ...current,
                sort_order: undefined,
                form: undefined,
              }));
            }}
            error={errors.sort_order}
            min={0}
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
            <Button type="submit" loading={createCategoryMutation.isPending}>
              {t("staffPage.createButton")}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
