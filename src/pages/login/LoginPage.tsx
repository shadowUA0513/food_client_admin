import {
  Box,
  Button,
  Center,
  Paper,
  PasswordInput,
  Select,
  Stack,
  Text,
  Title,
  useComputedColorScheme,
} from "@mantine/core";
import { IconLock, IconPhoneCall } from "@tabler/icons-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../app/providers/AuthProvider";
import { PhoneNumberInput } from "../../components/common/PhoneNumberInput";
import {
  hasCompleteUzbekistanPhone,
  UZBEKISTAN_PHONE_PREFIX,
} from "../../utils/phone";

interface FormErrors {
  phone?: string;
  password?: string;
  form?: string;
}

const MIN_PASSWORD_LENGTH = 6;

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const computedColorScheme = useComputedColorScheme("light");
  const isDark = computedColorScheme === "dark";
  const [phone, setPhone] = useState(UZBEKISTAN_PHONE_PREFIX);
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const clearFieldError = (field: keyof FormErrors) => {
    setErrors((current) => ({
      ...current,
      [field]: undefined,
      form: undefined,
    }));
  };

  const validate = () => {
    const nextErrors: FormErrors = {};

    if (!phone.trim() || phone === UZBEKISTAN_PHONE_PREFIX) {
      nextErrors.phone = t("login.phoneRequired");
    } else if (!hasCompleteUzbekistanPhone(phone)) {
      nextErrors.phone = t("login.phoneInvalidLength");
    }

    if (!password.trim()) {
      nextErrors.password = t("login.passwordRequired");
    } else if (password.trim().length < MIN_PASSWORD_LENGTH) {
      nextErrors.password = t("login.passwordTooShort");
    }

    if (nextErrors.phone || nextErrors.password) {
      nextErrors.form = t("login.formError");
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      await login({ phone, password });
      navigate("/", { replace: true });
    } catch (error) {
      setErrors((current) => ({
        ...current,
        form: error instanceof Error ? error.message : t("login.formError"),
      }));
    }
  };

  return (
    <Box
      mih="100vh"
      px={{ base: "md", sm: "xl" }}
      py={{ base: "xl", md: 40 }}
      pos="relative"
      style={{
        background: isDark
          ? "radial-gradient(circle at top left, rgba(251, 146, 60, 0.18), transparent 28%), radial-gradient(circle at bottom right, rgba(56, 189, 248, 0.14), transparent 34%), linear-gradient(135deg, #0f172a 0%, #111827 45%, #1e293b 100%)"
          : "radial-gradient(circle at top left, rgba(46, 204, 113, 0.18), transparent 30%), radial-gradient(circle at bottom right, rgba(59, 130, 246, 0.12), transparent 32%), linear-gradient(135deg, #f8fafc 0%, #eef6ff 45%, #f8fafc 100%)",
      }}
    >
      <Box
        pos="absolute"
        top={{ base: 16, sm: 24 }}
        right={{ base: 16, sm: 24 }}
        w={140}
      >
        <Select
          value={i18n.resolvedLanguage ?? i18n.language}
          onChange={(value) => {
            if (value === "ru" || value === "uz") {
              void i18n.changeLanguage(value);
            }
          }}
          data={[
            { value: "ru", label: t("common.languageRu") },
            { value: "uz", label: t("common.languageUz") },
          ]}
          aria-label={t("common.language")}
          allowDeselect={false}
          radius="md"
        />
      </Box>

      <Center mih="calc(100vh - 80px)">
        <Paper
          radius="xl"
          shadow="xl"
          withBorder
          w="100%"
          maw={460}
          bg={isDark ? "dark.7" : "white"}
          style={{
            borderColor: isDark
              ? "rgba(255, 255, 255, 0.10)"
              : "var(--mantine-color-gray-2)",
            backdropFilter: "blur(10px)",
          }}
        >
          <Box p={{ base: "lg", sm: "xl" }}>
            <Stack gap="xl">
              <Stack gap={6} ta="center">
                <Title order={2} fw={800}>
                  {t("login.title")}
                </Title>
                <Text c="dimmed" size="sm">
                  {t("login.subtitle")}
                </Text>
              </Stack>

              <Paper
                component="form"
                onSubmit={handleSubmit}
                radius="lg"
                p={{ base: "md", sm: "lg" }}
                bg={isDark ? "dark.6" : "gray.0"}
                style={{
                  border: isDark
                    ? "1px solid rgba(255, 255, 255, 0.08)"
                    : "1px solid var(--mantine-color-gray-2)",
                }}
              >
                <Stack gap="md">
                  <PhoneNumberInput
                    label={t("login.phoneLabel")}
                    placeholder={t("login.phonePlaceholder")}
                    value={phone}
                    onChange={(value) => {
                      setPhone(value);
                      clearFieldError("phone");
                    }}
                    error={errors.phone}
                    leftSection={<IconPhoneCall size={16} stroke={1.8} />}
                    size="md"
                    radius="md"
                    styles={{
                      input: {
                        backgroundColor: isDark
                          ? "var(--mantine-color-dark-5)"
                          : undefined,
                        borderColor: isDark
                          ? "rgba(255, 255, 255, 0.12)"
                          : undefined,
                      },
                    }}
                    required
                  />

                  <Stack gap={6}>
                    <PasswordInput
                      label={t("login.passwordLabel")}
                      placeholder={t("login.passwordPlaceholder")}
                      value={password}
                      onChange={(event) => {
                        setPassword(event.currentTarget.value);
                        clearFieldError("password");
                      }}
                      error={errors.password}
                      leftSection={<IconLock size={16} stroke={1.8} />}
                      autoComplete="current-password"
                      size="md"
                      radius="md"
                      styles={{
                        input: {
                          backgroundColor: isDark
                            ? "var(--mantine-color-dark-5)"
                            : undefined,
                          borderColor: isDark
                            ? "rgba(255, 255, 255, 0.12)"
                            : undefined,
                        },
                      }}
                      required
                    />
                  </Stack>

                  {errors.form ? (
                    <Text c="red.6" size="sm">
                      {errors.form}
                    </Text>
                  ) : null}

                  <Button
                    type="submit"
                    fullWidth
                    size="md"
                    radius="md"
                    loading={isLoading}
                  >
                    {t("login.submit")}
                  </Button>
                </Stack>
              </Paper>
            </Stack>
          </Box>
        </Paper>
      </Center>
    </Box>
  );
}
