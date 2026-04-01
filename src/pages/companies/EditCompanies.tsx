import {
  Alert,
  Button,
  ColorInput,
  FileInput,
  Group,
  Loader,
  Modal,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { useQueryClient } from "@tanstack/react-query";
import { startTransition, useEffect, useState, type FormEvent } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useCompanyById, useUpdateCompany } from "../../service/companies";
import { uploadImage } from "../../service/images";
import type { Company, UpdateCompanyPayload } from "../../types/companies";
import {
  showErrorNotification,
  showSuccessNotification,
} from "../../utils/notifications";

interface FormErrors {
  name?: string;
  bot_token?: string;
  bot_username?: string;
  brand_color?: string;
  logo_url?: string;
  form?: string;
}

const HEX_COLOR_REGEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

const EMPTY_FORM: UpdateCompanyPayload = {
  name: "",
  bot_token: "",
  bot_username: "",
  brand_color: "#F08C00",
  logo_url: "",
  is_active: false,
};

const BRAND_COLOR_SWATCHES = [
  "#F08C00",
  "#E03131",
  "#2F9E44",
  "#1C7ED6",
  "#6741D9",
  "#0C8599",
  "#5C940D",
  "#C2255C",
];

export default function EditCompanies() {
  const location = useLocation();
  const navigate = useNavigate();
  const { companyId } = useParams();
  const queryClient = useQueryClient();
  const updateCompanyMutation = useUpdateCompany();
  const locationCompany =
    (location.state as { company?: Company } | null)?.company;
  const {
    data: fetchedCompany,
    isLoading,
    error,
  } = useCompanyById(companyId);
  const company = locationCompany ?? fetchedCompany;
  const [form, setForm] = useState<UpdateCompanyPayload>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  useEffect(() => {
    if (!company) {
      return;
    }

    startTransition(() => {
      setForm({
        name: company.name,
        bot_token: company.bot_token,
        bot_username: company.bot_username,
        brand_color: company.brand_color,
        logo_url: company.logo_url,
        is_active: company.is_active,
      });
      setErrors({});
    });
  }, [company]);

  const handleClose = () => {
    setErrors({});
    navigate("/companies");
  };

  const handleLogoFileChange = async (file: File | null) => {
    if (!file) {
      setForm((current) => ({
        ...current,
        logo_url: "",
      }));
      setErrors((current) => ({
        ...current,
        logo_url: undefined,
        form: undefined,
      }));
      return;
    }

    if (!file.type.startsWith("image/")) {
      setErrors((current) => ({
        ...current,
        logo_url: "Please choose an image file.",
        form: undefined,
      }));
      return;
    }

    try {
      setIsUploadingLogo(true);
      const imageUrl = await uploadImage(file);

      setForm((current) => ({
        ...current,
        logo_url: imageUrl,
      }));
      setErrors((current) => ({
        ...current,
        logo_url: undefined,
        form: undefined,
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to upload the selected image.";

      setErrors((current) => ({
        ...current,
        logo_url: message,
        form: undefined,
      }));
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const validateForm = () => {
    const nextErrors: FormErrors = {};

    if (!form.name?.trim()) {
      nextErrors.name = "Company name is required.";
    }

    if (!form.bot_token?.trim()) {
      nextErrors.bot_token = "Bot token is required.";
    }

    if (!form.bot_username?.trim()) {
      nextErrors.bot_username = "Bot username is required.";
    }

    if (!form.brand_color?.trim()) {
      nextErrors.brand_color = "Brand color is required.";
    } else if (!HEX_COLOR_REGEX.test(form.brand_color)) {
      nextErrors.brand_color = "Use a valid hex color like #0088cc.";
    }

    if (!form.logo_url?.trim()) {
      nextErrors.logo_url = "Logo URL is required.";
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
      await updateCompanyMutation.mutateAsync({
        id: companyId,
        payload: {
          name: form.name?.trim(),
          bot_token: form.bot_token?.trim(),
          bot_username: form.bot_username?.trim(),
          brand_color: form.brand_color?.trim(),
          logo_url: form.logo_url?.trim(),
          is_active: Boolean(form.is_active),
        },
      });
      await queryClient.invalidateQueries({ queryKey: ["companies"] });
      await queryClient.invalidateQueries({ queryKey: ["company", companyId] });
      showSuccessNotification({
        message: "Company updated successfully.",
      });
      handleClose();
    } catch (updateError) {
      const message =
        updateError instanceof Error
          ? updateError.message
          : "Failed to update company.";

      setErrors((current) => ({
        ...current,
        form: message,
      }));
      showErrorNotification({ message });
    }
  };

  return (
    <Modal opened onClose={handleClose} title="Edit company" centered>
      {error ? (
        <Stack gap="md">
          <Alert color="red" variant="light">
            {error.message || "Failed to load the company."}
          </Alert>
          <Group justify="flex-end">
            <Button variant="default" onClick={handleClose}>
              Cancel
            </Button>
          </Group>
        </Stack>
      ) : isLoading && !company ? (
        <Stack align="center" gap="sm" py="md">
          <Loader />
          <Text c="dimmed">Loading company...</Text>
        </Stack>
      ) : (
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <TextInput
            label="Company name"
            value={form.name ?? ""}
            onChange={(event) => {
              const value = event.currentTarget.value;

              setForm((current) => ({
                ...current,
                name: value,
              }));
              setErrors((current) => ({
                ...current,
                name: undefined,
                form: undefined,
              }));
            }}
            error={errors.name}
            required
          />

          <TextInput
            label="Bot username"
            value={form.bot_username ?? ""}
            onChange={(event) => {
              const value = event.currentTarget.value;

              setForm((current) => ({
                ...current,
                bot_username: value,
              }));
              setErrors((current) => ({
                ...current,
                bot_username: undefined,
                form: undefined,
              }));
            }}
            error={errors.bot_username}
            required
          />

          <TextInput
            label="Bot token"
            value={form.bot_token ?? ""}
            onChange={(event) => {
              const value = event.currentTarget.value;

              setForm((current) => ({
                ...current,
                bot_token: value,
              }));
              setErrors((current) => ({
                ...current,
                bot_token: undefined,
                form: undefined,
              }));
            }}
            error={errors.bot_token}
            required
          />

          <ColorInput
            label="Brand color"
            placeholder="#F08C00"
            value={form.brand_color ?? ""}
            onChange={(value) => {
              setForm((current) => ({
                ...current,
                brand_color: value,
              }));
              setErrors((current) => ({
                ...current,
                brand_color: undefined,
                form: undefined,
              }));
            }}
            swatches={BRAND_COLOR_SWATCHES}
            withPicker
            format="hex"
            error={errors.brand_color}
            required
          />

          <FileInput
            label="Logo image"
            placeholder="Choose an image"
            accept="image/*"
            clearable
            onChange={handleLogoFileChange}
            error={errors.logo_url}
            description={
              isUploadingLogo ? "Uploading image..." : "Select an image file to upload."
            }
          />

          <div>
            <Text size="sm" fw={500} mb={8}>
              Status
            </Text>
            <SegmentedControl
              fullWidth
              radius="md"
              size="md"
              value={form.is_active ? "active" : "inactive"}
              onChange={(value) => {
                setForm((current) => ({
                  ...current,
                  is_active: value === "active",
                }));
                setErrors((current) => ({
                  ...current,
                  form: undefined,
                }));
              }}
              data={[
                { label: "Active", value: "active" },
                { label: "Inactive", value: "inactive" },
              ]}
            />
          </div>

          {errors.form ? (
            <Alert color="red" variant="light">
              {errors.form}
            </Alert>
          ) : null}

          <Group justify="flex-end">
            <Button variant="default" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={updateCompanyMutation.isPending || isUploadingLogo}
              disabled={isUploadingLogo}
            >
              Save
            </Button>
          </Group>
        </Stack>
      </form>
      )}
    </Modal>
  );
}
