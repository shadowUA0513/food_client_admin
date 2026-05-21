import {
  Alert,
  Badge,
  Button,
  Card,
  Center,
  ColorInput,
  Group,
  Loader,
  NumberInput,
  SimpleGrid,
  Stack,
  TagsInput,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useQueryClient } from "@tanstack/react-query";
import { IconRefresh } from "@tabler/icons-react";
import { startTransition, useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import {
  useCompanyProfile,
  useUpdateCompanyProfile,
} from "../../service/companyProfile";
import { useAuthStore } from "../../store/auth";
import type {
  CompanyProfile,
  UpdateCompanyProfilePayload,
} from "../../types/companyProfile";
import {
  showErrorNotification,
  showSuccessNotification,
} from "../../utils/notifications";

interface ProfileFormState {
  address: string;
  brand_color: string;
  phone_numbers: string[];
  card_pans: string[];
  min_order_amount: number;
  delivery_fee: number;
  delivery_estimated_time: number;
  free_delivery_threshold: number;
}

interface FormErrors {
  address?: string;
  brand_color?: string;
  min_order_amount?: string;
  delivery_fee?: string;
  delivery_estimated_time?: string;
  free_delivery_threshold?: string;
  form?: string;
}

const EMPTY_FORM: ProfileFormState = {
  address: "",
  brand_color: "#f08c00",
  phone_numbers: [],
  card_pans: [],
  min_order_amount: 0,
  delivery_fee: 0,
  delivery_estimated_time: 0,
  free_delivery_threshold: 0,
};

function sanitizeList(values: string[]) {
  return values.map((value) => value.trim()).filter(Boolean);
}

function buildInitialForm(profile: CompanyProfile): ProfileFormState {
  return {
    address: profile.address ?? "",
    brand_color: profile.brand_color ?? "#f08c00",
    phone_numbers: sanitizeList(profile.phone_numbers ?? []),
    card_pans: sanitizeList(profile.card_pans ?? []),
    min_order_amount: profile.min_order_amount ?? 0,
    delivery_fee: profile.delivery_fee ?? 0,
    delivery_estimated_time: profile.delivery_estimated_time ?? 0,
    free_delivery_threshold: profile.free_delivery_threshold ?? 0,
  };
}

function buildPayload(
  profile: CompanyProfile,
  form: ProfileFormState,
): UpdateCompanyProfilePayload {
  return {
    name: profile.name,
    bot_token: profile.bot_token,
    bot_username: profile.bot_username,
    address: form.address.trim(),
    lat: profile.lat,
    long: profile.long,
    min_order_distance: profile.min_order_distance,
    telegram_chat_id: profile.telegram_chat_id,
    phone_numbers: sanitizeList(form.phone_numbers),
    card_pans: sanitizeList(form.card_pans),
    brand_color: form.brand_color.trim(),
    logo_url: profile.logo_url,
    is_active: profile.is_active,
    supported_order_types: profile.supported_order_types ?? [],
    min_order_amount: Number(form.min_order_amount),
    delivery_fee: Number(form.delivery_fee),
    delivery_estimated_time: Number(form.delivery_estimated_time),
    free_delivery_threshold: Number(form.free_delivery_threshold),
    payment_accepting_style: profile.payment_accepting_style,
  };
}

export default function ProfilePage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const companyId = useAuthStore((state) => state.company?.id);
  const companyName = useAuthStore((state) => state.company?.name);
  const { data, isLoading, error, isFetching } = useCompanyProfile(companyId);
  const updateCompanyProfileMutation = useUpdateCompanyProfile();
  const [form, setForm] = useState<ProfileFormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (!data) {
      return;
    }

    startTransition(() => {
      setForm(buildInitialForm(data));
      setErrors({});
    });
  }, [data]);

  const validateForm = () => {
    const nextErrors: FormErrors = {};

    if (!form.address.trim()) {
      nextErrors.address = t("profilePage.validation.addressRequired");
    }

    if (!form.brand_color.trim()) {
      nextErrors.brand_color = t("profilePage.validation.brandColorRequired");
    }

    if (!Number.isFinite(form.min_order_amount) || form.min_order_amount < 0) {
      nextErrors.min_order_amount = t(
        "profilePage.validation.minOrderAmountInvalid",
      );
    }

    if (!Number.isFinite(form.delivery_fee) || form.delivery_fee < 0) {
      nextErrors.delivery_fee = t("profilePage.validation.deliveryFeeInvalid");
    }

    if (
      !Number.isFinite(form.delivery_estimated_time) ||
      form.delivery_estimated_time < 0
    ) {
      nextErrors.delivery_estimated_time = t(
        "profilePage.validation.deliveryEstimatedTimeInvalid",
      );
    }

    if (
      !Number.isFinite(form.free_delivery_threshold) ||
      form.free_delivery_threshold < 0
    ) {
      nextErrors.free_delivery_threshold = t(
        "profilePage.validation.freeDeliveryThresholdInvalid",
      );
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!companyId || !data || !validateForm()) {
      return;
    }

    try {
      await updateCompanyProfileMutation.mutateAsync({
        companyId,
        payload: buildPayload(data, form),
      });

      showSuccessNotification({
        message: t("profilePage.saveSuccess"),
      });
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : t("profilePage.saveError");

      setErrors((current) => ({
        ...current,
        form: message,
      }));
      showErrorNotification({ message });
    }
  };

  if (!companyId) {
    return (
      <Alert color="red" variant="light">
        {t("profilePage.companyRequired")}
      </Alert>
    );
  }

  return (
    <Stack gap="lg">
      <Card withBorder radius="xl" p="lg">
        <Group justify="space-between" align="flex-start" wrap="wrap">
          <div>
            <Title order={3}>{t("profilePage.title")}</Title>
            <Text c="dimmed">{t("profilePage.subtitle")}</Text>
          </div>
          <Group gap="sm">
            <Badge variant="light" color="orange" size="lg">
              {companyName ?? data?.name ?? "-"}
            </Badge>
            <Button
              variant="light"
              leftSection={<IconRefresh size={16} />}
              loading={isFetching}
              onClick={() => {
                void queryClient.invalidateQueries({
                  queryKey: ["company-profile", companyId],
                });
              }}
            >
              {t("commonActions.refresh")}
            </Button>
          </Group>
        </Group>
      </Card>

      {error ? (
        <Alert color="red" variant="light">
          {error.message || t("profilePage.loadError")}
        </Alert>
      ) : isLoading ? (
        <Center py="xl">
          <Stack align="center" gap="sm">
            <Loader />
            <Text c="dimmed">{t("profilePage.loading")}</Text>
          </Stack>
        </Center>
      ) : data ? (
        <form onSubmit={handleSubmit}>
          <Stack gap="lg">
            <SimpleGrid cols={{ base: 1, xl: 2 }}>
              <Card withBorder radius="xl" p="lg">
                <Stack gap="md">
                  <div>
                    <Text fw={700}>{t("profilePage.sections.branding")}</Text>
                    <Text size="sm" c="dimmed">
                      {t("profilePage.sections.brandingHint")}
                    </Text>
                  </div>

                  <TextInput
                    label={t("profilePage.fields.address")}
                    placeholder={t("profilePage.placeholders.address")}
                    value={form.address}
                    onChange={(event) => {
                      const value = event.currentTarget.value;

                      setForm((current) => ({ ...current, address: value }));
                      setErrors((current) => ({
                        ...current,
                        address: undefined,
                        form: undefined,
                      }));
                    }}
                    error={errors.address}
                    required
                  />

                  <ColorInput
                    label={t("profilePage.fields.brandColor")}
                    placeholder="#0088d1"
                    value={form.brand_color}
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
                    error={errors.brand_color}
                    format="hex"
                    swatches={[
                      "#f08c00",
                      "#0088d1",
                      "#15aabf",
                      "#2f9e44",
                      "#e03131",
                      "#7c3aed",
                    ]}
                    required
                  />
                </Stack>
              </Card>

              <Card withBorder radius="xl" p="lg">
                <Stack gap="md">
                  <div>
                    <Text fw={700}>{t("profilePage.sections.contacts")}</Text>
                    <Text size="sm" c="dimmed">
                      {t("profilePage.sections.contactsHint")}
                    </Text>
                  </div>

                  <TagsInput
                    label={t("profilePage.fields.phoneNumbers")}
                    placeholder={t("profilePage.placeholders.phoneNumbers")}
                    value={form.phone_numbers}
                    onChange={(value) => {
                      setForm((current) => ({
                        ...current,
                        phone_numbers: value,
                      }));
                      setErrors((current) => ({
                        ...current,
                        form: undefined,
                      }));
                    }}
                    clearable
                    splitChars={[",", ";"]}
                    description={t("profilePage.helpers.phoneNumbers")}
                  />

                  <TagsInput
                    label={t("profilePage.fields.cardPans")}
                    placeholder={t("profilePage.placeholders.cardPans")}
                    value={form.card_pans}
                    onChange={(value) => {
                      setForm((current) => ({
                        ...current,
                        card_pans: value,
                      }));
                      setErrors((current) => ({
                        ...current,
                        form: undefined,
                      }));
                    }}
                    clearable
                    splitChars={[",", ";"]}
                    description={t("profilePage.helpers.cardPans")}
                  />
                </Stack>
              </Card>
            </SimpleGrid>

            <Card withBorder radius="xl" p="lg">
              <Stack gap="md">
                <div>
                  <Text fw={700}>{t("profilePage.sections.delivery")}</Text>
                  <Text size="sm" c="dimmed">
                    {t("profilePage.sections.deliveryHint")}
                  </Text>
                </div>

                <SimpleGrid cols={{ base: 1, sm: 2 }}>
                  <NumberInput
                    label={t("profilePage.fields.minOrderAmount")}
                    value={form.min_order_amount}
                    onChange={(value) => {
                      setForm((current) => ({
                        ...current,
                        min_order_amount: typeof value === "number" ? value : 0,
                      }));
                      setErrors((current) => ({
                        ...current,
                        min_order_amount: undefined,
                        form: undefined,
                      }));
                    }}
                    min={0}
                    thousandSeparator=","
                    error={errors.min_order_amount}
                    required
                  />

                  <NumberInput
                    label={t("profilePage.fields.deliveryFee")}
                    value={form.delivery_fee}
                    onChange={(value) => {
                      setForm((current) => ({
                        ...current,
                        delivery_fee: typeof value === "number" ? value : 0,
                      }));
                      setErrors((current) => ({
                        ...current,
                        delivery_fee: undefined,
                        form: undefined,
                      }));
                    }}
                    min={0}
                    thousandSeparator=","
                    error={errors.delivery_fee}
                    required
                  />

                  <NumberInput
                    label={t("profilePage.fields.deliveryEstimatedTime")}
                    value={form.delivery_estimated_time}
                    onChange={(value) => {
                      setForm((current) => ({
                        ...current,
                        delivery_estimated_time:
                          typeof value === "number" ? value : 0,
                      }));
                      setErrors((current) => ({
                        ...current,
                        delivery_estimated_time: undefined,
                        form: undefined,
                      }));
                    }}
                    min={0}
                    suffix={` ${t("profilePage.minutesSuffix")}`}
                    error={errors.delivery_estimated_time}
                    required
                  />

                  <NumberInput
                    label={t("profilePage.fields.freeDeliveryThreshold")}
                    value={form.free_delivery_threshold}
                    onChange={(value) => {
                      setForm((current) => ({
                        ...current,
                        free_delivery_threshold:
                          typeof value === "number" ? value : 0,
                      }));
                      setErrors((current) => ({
                        ...current,
                        free_delivery_threshold: undefined,
                        form: undefined,
                      }));
                    }}
                    min={0}
                    thousandSeparator=","
                    error={errors.free_delivery_threshold}
                    required
                  />
                </SimpleGrid>
              </Stack>
            </Card>

            {errors.form ? (
              <Alert color="red" variant="light">
                {errors.form}
              </Alert>
            ) : null}

            <Group justify="flex-end">
              <Button
                variant="default"
                type="button"
                onClick={() => {
                  if (!data) {
                    return;
                  }

                  setForm(buildInitialForm(data));
                  setErrors({});
                }}
              >
                {t("commonActions.reset")}
              </Button>
              <Button type="submit" loading={updateCompanyProfileMutation.isPending}>
                {t("profilePage.save")}
              </Button>
            </Group>
          </Stack>
        </form>
      ) : (
        <Alert color="blue" variant="light">
          {t("profilePage.empty")}
        </Alert>
      )}
    </Stack>
  );
}
