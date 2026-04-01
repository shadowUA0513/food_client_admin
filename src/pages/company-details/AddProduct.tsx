import {
  Alert,
  Button,
  FileInput,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
  Switch,
  TextInput,
  Textarea,
} from "@mantine/core";
import { useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { useCategories } from "../../service/categories";
import { uploadImage } from "../../service/images";
import { useCreateProduct } from "../../service/products";
import type { CreateProductPayload } from "../../types/products";
import {
  showErrorNotification,
  showSuccessNotification,
} from "../../utils/notifications";

interface FormErrors {
  category_id?: string;
  name_uz?: string;
  name_ru?: string;
  description?: string;
  price?: string;
  stock_quantity?: string;
  form?: string;
}

const EMPTY_FORM = {
  category_id: "",
  name_uz: "",
  name_ru: "",
  description: "",
  price: 0,
  image_url: "",
  stock_quantity: 0,
  is_available: true,
};

export default function AddProduct() {
  const { t } = useTranslation();
  const { companyId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const createProductMutation = useCreateProduct();
  const { data: categoriesData } = useCategories(companyId, 1000, 1, "");
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const categoryOptions = (categoriesData?.categories ?? []).map((category) => ({
    value: category.id,
    label: `${category.name_uz} / ${category.name_ru}`,
  }));

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    navigate(`/companies/${companyId}/product`);
  };

  const handleImageFileChange = async (file: File | null) => {
    if (!file) {
      setForm((current) => ({
        ...current,
        image_url: "",
      }));
      setErrors((current) => ({
        ...current,
        form: undefined,
      }));
      return;
    }

    if (!file.type.startsWith("image/")) {
      setErrors((current) => ({
        ...current,
        form: "Please choose an image file.",
      }));
      return;
    }

    try {
      setIsUploadingImage(true);
      const imageUrl = await uploadImage(file);

      setForm((current) => ({
        ...current,
        image_url: imageUrl,
      }));
      setErrors((current) => ({
        ...current,
        form: undefined,
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to upload the selected image.";

      setErrors((current) => ({
        ...current,
        form: message,
      }));
    } finally {
      setIsUploadingImage(false);
    }
  };

  const validateForm = () => {
    const nextErrors: FormErrors = {};

    if (!form.category_id) {
      nextErrors.category_id = t("companyDetails.productCategoryRequired");
    }

    if (!form.name_uz.trim()) {
      nextErrors.name_uz = t("companyDetails.productNameUzRequired");
    }

    if (!form.name_ru.trim()) {
      nextErrors.name_ru = t("companyDetails.productNameRuRequired");
    }

    if (!form.description.trim()) {
      nextErrors.description = t("companyDetails.productDescriptionRequired");
    }

    if (!Number.isFinite(form.price) || form.price <= 0) {
      nextErrors.price = t("companyDetails.productPriceRequired");
    }

    if (!Number.isFinite(form.stock_quantity) || form.stock_quantity < 0) {
      nextErrors.stock_quantity = t("companyDetails.productStockRequired");
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
      const payload: CreateProductPayload = {
        company_id: companyId,
        category_id: form.category_id,
        name_uz: form.name_uz.trim(),
        name_ru: form.name_ru.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        image_url: form.image_url.trim(),
        stock_quantity: Number(form.stock_quantity),
        is_available: form.is_available,
      };

      await createProductMutation.mutateAsync(payload);
      await queryClient.invalidateQueries({ queryKey: ["products", companyId] });
      showSuccessNotification({
        message: t("companyDetails.productCreateSuccess"),
      });
      handleClose();
    } catch (createError) {
      const message =
        createError instanceof Error
          ? createError.message
          : t("companyDetails.productCreateError");

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
      title={t("companyDetails.addProduct")}
      centered
      size="70rem"
      radius="lg"
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md" p="xs">
          <Select
            label={t("companyDetails.category")}
            placeholder={t("companyDetails.productCategoryPlaceholder")}
            data={categoryOptions}
            value={form.category_id}
            onChange={(value) => {
              setForm((current) => ({
                ...current,
                category_id: value ?? "",
              }));
              setErrors((current) => ({
                ...current,
                category_id: undefined,
                form: undefined,
              }));
            }}
            error={errors.category_id}
            searchable
            required
          />

          <TextInput
            label={t("companyDetails.productNameUz")}
            placeholder={t("companyDetails.productNameUzPlaceholder")}
            value={form.name_uz}
            onChange={(event) => {
              const value = event.currentTarget.value;
              setForm((current) => ({ ...current, name_uz: value }));
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
            label={t("companyDetails.productNameRu")}
            placeholder={t("companyDetails.productNameRuPlaceholder")}
            value={form.name_ru}
            onChange={(event) => {
              const value = event.currentTarget.value;
              setForm((current) => ({ ...current, name_ru: value }));
              setErrors((current) => ({
                ...current,
                name_ru: undefined,
                form: undefined,
              }));
            }}
            error={errors.name_ru}
            required
          />

          <Textarea
            label={t("companyDetails.productDescription")}
            placeholder={t("companyDetails.productDescriptionPlaceholder")}
            value={form.description}
            onChange={(event) => {
              const value = event.currentTarget.value;
              setForm((current) => ({ ...current, description: value }));
              setErrors((current) => ({
                ...current,
                description: undefined,
                form: undefined,
              }));
            }}
            error={errors.description}
            minRows={3}
            required
          />

          <NumberInput
            label={t("companyDetails.price")}
            value={form.price}
            onChange={(value) => {
              setForm((current) => ({
                ...current,
                price: typeof value === "number" ? value : 0,
              }));
              setErrors((current) => ({
                ...current,
                price: undefined,
                form: undefined,
              }));
            }}
            min={0}
            error={errors.price}
            required
          />

          <FileInput
            label={t("companyDetails.productImageUrl")}
            placeholder="Choose an image"
            accept="image/*"
            clearable
            onChange={handleImageFileChange}
            description={
              isUploadingImage ? "Uploading image..." : "Select an image file to upload."
            }
          />

          <NumberInput
            label={t("companyDetails.productStockQuantity")}
            value={form.stock_quantity}
            onChange={(value) => {
              setForm((current) => ({
                ...current,
                stock_quantity: typeof value === "number" ? value : 0,
              }));
              setErrors((current) => ({
                ...current,
                stock_quantity: undefined,
                form: undefined,
              }));
            }}
            min={0}
            error={errors.stock_quantity}
            required
          />

          <Switch
            label={t("companyDetails.productAvailable")}
            checked={form.is_available}
            onChange={(event) => {
              const checked = event.currentTarget.checked;

              setForm((current) => ({
                ...current,
                is_available: checked,
              }));
            }}
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
            <Button
              type="submit"
              loading={createProductMutation.isPending || isUploadingImage}
              disabled={isUploadingImage}
            >
              {t("staffPage.createButton")}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
