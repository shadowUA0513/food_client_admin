import {
  Alert,
  Button,
  Group,
  Modal,
  Stack,
  Switch,
  TextInput,
  Textarea,
} from "@mantine/core";
import { useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { MapAddressPicker } from "../../components/common/MapAddressPicker";
import { useCreatePartner } from "../../service/partners";
import { useAuthStore } from "../../store/auth";
import type { CreatePartnerPayload } from "../../types/partners";
import {
  showErrorNotification,
  showSuccessNotification,
} from "../../utils/notifications";

interface FormErrors {
  name_uz?: string;
  name_ru?: string;
  latitude?: string;
  longitude?: string;
  address_description?: string;
  form?: string;
}

const EMPTY_FORM = {
  name_uz: "",
  name_ru: "",
  latitude: 0,
  longitude: 0,
  address_description: "",
  is_active: true,
};

function hasValidCoordinates(latitude: number, longitude: number) {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    !(latitude === 0 && longitude === 0)
  );
}

export default function AddPartner() {
  const { t } = useTranslation();
  const companyId = useAuthStore((state) => state.company?.id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const createPartnerMutation = useCreatePartner();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    navigate("/partners");
  };

  const validateForm = () => {
    const nextErrors: FormErrors = {};

    if (!form.name_uz.trim()) {
      nextErrors.name_uz = t("partnersPage.nameUzRequired");
    }

    if (!form.name_ru.trim()) {
      nextErrors.name_ru = t("partnersPage.nameRuRequired");
    }

    if (!hasValidCoordinates(form.latitude, form.longitude)) {
      nextErrors.latitude = t("partnersPage.latitudeRequired");
    }

    if (!hasValidCoordinates(form.latitude, form.longitude)) {
      nextErrors.longitude = t("partnersPage.longitudeRequired");
    }

    if (!form.address_description.trim()) {
      nextErrors.address_description = t("partnersPage.addressRequired");
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
      const payload: CreatePartnerPayload = {
        company_id: companyId,
        name_uz: form.name_uz.trim(),
        name_ru: form.name_ru.trim(),
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        address_description: form.address_description.trim(),
        is_active: form.is_active,
      };

      await createPartnerMutation.mutateAsync(payload);
      await queryClient.invalidateQueries({ queryKey: ["partners", companyId] });
      showSuccessNotification({
        message: t("partnersPage.createSuccess"),
      });
      handleClose();
    } catch (createError) {
      const message =
        createError instanceof Error
          ? createError.message
          : t("partnersPage.createError");

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
      title={t("partnersPage.addPartner")}
      centered
      size="xl"
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <TextInput
            label={t("partnersPage.nameUz")}
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
            label={t("partnersPage.nameRu")}
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

          <MapAddressPicker
            address={form.address_description}
            latitude={form.latitude}
            longitude={form.longitude}
            error={errors.address_description}
            onChange={(value) => {
              setForm((current) => ({
                ...current,
                latitude: value.latitude,
                longitude: value.longitude,
                address_description: value.address,
              }));
              setErrors((current) => ({
                ...current,
                latitude: undefined,
                longitude: undefined,
                address_description: undefined,
                form: undefined,
              }));
            }}
          />

          <Group grow>
            <TextInput
              label={t("partnersPage.latitude")}
              value={form.latitude.toFixed(6)}
              readOnly
              error={errors.latitude}
            />
            <TextInput
              label={t("partnersPage.longitude")}
              value={form.longitude.toFixed(6)}
              readOnly
              error={errors.longitude}
            />
          </Group>

          <Textarea
            label={t("partnersPage.address")}
            value={form.address_description}
            minRows={3}
            readOnly
            error={errors.address_description}
            required
          />

          <Switch
            label={t("partnersPage.active")}
            checked={form.is_active}
            onChange={(event) => {
              const checked = event.currentTarget.checked;

              setForm((current) => ({
                ...current,
                is_active: checked,
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
            <Button type="submit" loading={createPartnerMutation.isPending}>
              {t("staffPage.createButton")}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
