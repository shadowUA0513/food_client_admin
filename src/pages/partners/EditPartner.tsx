import {
  Alert,
  Button,
  Group,
  Loader,
  Modal,
  NumberInput,
  Stack,
  Switch,
  Text,
  TextInput,
  Textarea,
} from "@mantine/core";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { usePartnerById, useUpdatePartner } from "../../service/partners";
import { useAuthStore } from "../../store/auth";
import type { Partner, UpdatePartnerPayload } from "../../types/partners";
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

const EMPTY_FORM: UpdatePartnerPayload = {
  company_id: "",
  name_uz: "",
  name_ru: "",
  latitude: 0,
  longitude: 0,
  address_description: "",
  is_active: true,
};

export default function EditPartner() {
  const { t } = useTranslation();
  const { partnerId } = useParams();
  const companyId = useAuthStore((state) => state.company?.id);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const updatePartnerMutation = useUpdatePartner();
  const locationPartner = (location.state as { partner?: Partner } | null)?.partner;
  const {
    data: fetchedPartner,
    isLoading,
    error,
  } = usePartnerById(companyId, partnerId);
  const partner = locationPartner ?? fetchedPartner;
  const [form, setForm] = useState<UpdatePartnerPayload>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (!partner) {
      return;
    }

    setForm({
      company_id: partner.company_id,
      name_uz: partner.name_uz,
      name_ru: partner.name_ru,
      latitude: partner.latitude,
      longitude: partner.longitude,
      address_description: partner.address_description,
      is_active: partner.is_active,
    });
    setErrors({});
  }, [partner]);

  const handleClose = () => {
    setErrors({});
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

    if (!Number.isFinite(form.latitude)) {
      nextErrors.latitude = t("partnersPage.latitudeRequired");
    }

    if (!Number.isFinite(form.longitude)) {
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

    if (!partnerId || !companyId || !validateForm()) {
      return;
    }

    try {
      await updatePartnerMutation.mutateAsync({
        id: partnerId,
        payload: {
          company_id: companyId,
          name_uz: form.name_uz.trim(),
          name_ru: form.name_ru.trim(),
          latitude: Number(form.latitude),
          longitude: Number(form.longitude),
          address_description: form.address_description.trim(),
          is_active: form.is_active,
        },
      });
      await queryClient.invalidateQueries({ queryKey: ["partners", companyId] });
      await queryClient.invalidateQueries({
        queryKey: ["partner", companyId, partnerId],
      });
      showSuccessNotification({
        message: t("partnersPage.updateSuccess"),
      });
      handleClose();
    } catch (updateError) {
      const message =
        updateError instanceof Error
          ? updateError.message
          : t("partnersPage.updateError");

      setErrors((current) => ({
        ...current,
        form: message,
      }));
      showErrorNotification({ message });
    }
  };

  return (
    <Modal opened onClose={handleClose} title={t("partnersPage.editPartner")} centered>
      {error ? (
        <Stack gap="md">
          <Alert color="red" variant="light">
            {error.message || t("partnersPage.loadError")}
          </Alert>
          <Group justify="flex-end">
            <Button variant="default" onClick={handleClose}>
              {t("staffPage.cancel")}
            </Button>
          </Group>
        </Stack>
      ) : isLoading && !partner ? (
        <Stack align="center" gap="sm" py="md">
          <Loader />
          <Text c="dimmed">{t("partnersPage.loading")}</Text>
        </Stack>
      ) : (
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

            <NumberInput
              label={t("partnersPage.latitude")}
              value={form.latitude}
              decimalScale={6}
              onChange={(value) => {
                setForm((current) => ({
                  ...current,
                  latitude: typeof value === "number" ? value : 0,
                }));
                setErrors((current) => ({
                  ...current,
                  latitude: undefined,
                  form: undefined,
                }));
              }}
              error={errors.latitude}
              required
            />

            <NumberInput
              label={t("partnersPage.longitude")}
              value={form.longitude}
              decimalScale={6}
              onChange={(value) => {
                setForm((current) => ({
                  ...current,
                  longitude: typeof value === "number" ? value : 0,
                }));
                setErrors((current) => ({
                  ...current,
                  longitude: undefined,
                  form: undefined,
                }));
              }}
              error={errors.longitude}
              required
            />

            <Textarea
              label={t("partnersPage.address")}
              value={form.address_description}
              minRows={3}
              onChange={(event) => {
                const value = event.currentTarget.value;

                setForm((current) => ({
                  ...current,
                  address_description: value,
                }));
                setErrors((current) => ({
                  ...current,
                  address_description: undefined,
                  form: undefined,
                }));
              }}
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
              <Button type="submit" loading={updatePartnerMutation.isPending}>
                {t("staffPage.saveButton")}
              </Button>
            </Group>
          </Stack>
        </form>
      )}
    </Modal>
  );
}
