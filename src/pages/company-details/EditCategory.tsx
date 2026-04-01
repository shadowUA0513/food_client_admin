import {
  Alert,
  Button,
  Group,
  Loader,
  Modal,
  NumberInput,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  useCategoryById,
  useUpdateCategory,
} from "../../service/categories";
import type { Category, UpdateCategoryPayload } from "../../types/categories";
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

const EMPTY_FORM: UpdateCategoryPayload = {
  company_id: "",
  name_uz: "",
  name_ru: "",
  sort_order: 0,
};

export default function EditCategory() {
  const { t } = useTranslation();
  const { companyId, categoryId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const updateCategoryMutation = useUpdateCategory();
  const locationCategory = (location.state as { category?: Category } | null)
    ?.category;
  const {
    data: fetchedCategory,
    isLoading,
    error,
  } = useCategoryById(companyId, categoryId);
  const category = locationCategory ?? fetchedCategory;
  const [form, setForm] = useState<UpdateCategoryPayload>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (!category) {
      return;
    }

    setForm({
      company_id: category.company_id,
      name_uz: category.name_uz,
      name_ru: category.name_ru,
      sort_order: category.sort_order,
    });
    setErrors({});
  }, [category]);

  const handleClose = () => {
    setErrors({});
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

    if (!categoryId || !companyId || !validateForm()) {
      return;
    }

    try {
      await updateCategoryMutation.mutateAsync({
        id: categoryId,
        payload: {
          company_id: companyId,
          name_uz: form.name_uz.trim(),
          name_ru: form.name_ru.trim(),
          sort_order: Number(form.sort_order),
        },
      });
      await queryClient.invalidateQueries({ queryKey: ["categories", companyId] });
      await queryClient.invalidateQueries({
        queryKey: ["category", companyId, categoryId],
      });
      showSuccessNotification({
        message: t("companyDetails.categoryUpdateSuccess"),
      });
      handleClose();
    } catch (updateError) {
      const message =
        updateError instanceof Error
          ? updateError.message
          : t("companyDetails.categoryUpdateError");

      setErrors((current) => ({
        ...current,
        form: message,
      }));
      showErrorNotification({ message });
    }
  };

  return (
    <Modal
      opened
      onClose={handleClose}
      title={t("companyDetails.editCategory")}
      centered
    >
      {error ? (
        <Stack gap="md">
          <Alert color="red" variant="light">
            {error.message || t("companyDetails.categoryLoadError")}
          </Alert>
          <Group justify="flex-end">
            <Button variant="default" onClick={handleClose}>
              {t("staffPage.cancel")}
            </Button>
          </Group>
        </Stack>
      ) : isLoading && !category ? (
        <Stack align="center" gap="sm" py="md">
          <Loader />
          <Text c="dimmed">{t("companyDetails.categoryLoading")}</Text>
        </Stack>
      ) : (
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
              <Button type="submit" loading={updateCategoryMutation.isPending}>
                {t("staffPage.saveButton")}
              </Button>
            </Group>
          </Stack>
        </form>
      )}
    </Modal>
  );
}
