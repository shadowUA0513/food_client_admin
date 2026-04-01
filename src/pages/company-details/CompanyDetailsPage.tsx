import {
  ActionIcon,
  Box,
  Button,
  Group,
  NavLink,
  Paper,
  Select,
  Stack,
  Text,
  Title,
  useComputedColorScheme,
  useMantineColorScheme,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconCategory,
  IconLogout,
  IconMoon,
  IconPackage,
  IconSun,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../app/providers/AuthProvider";

export default function CompanyDetailsPage() {
  const { companyId } = useParams();
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme("light");
  const isDark = computedColorScheme === "dark";
  const companyName = companyId ? `Company ${companyId}` : "Unknown company";

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const navigationItems = [
    {
      label: t("companyDetails.category"),
      icon: IconCategory,
      to: `/companies/${companyId}/category`,
    },
    {
      label: t("companyDetails.product"),
      icon: IconPackage,
      to: `/companies/${companyId}/product`,
    },
  ];

  return (
    <Box
      style={{
        minHeight: "100vh",
        width: "100%",
        padding: "24px",
      }}
    >
      <Stack gap="lg">
        <Group justify="space-between" align="center">
          <Box>
            <Text size="xs" tt="uppercase" fw={700} c="dimmed">
              {t("common.appName")}
            </Text>
            <Title order={4}>{t("layout.controlPanel")}</Title>
          </Box>

          <Group gap="sm">
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
              w={140}
              radius="md"
              allowDeselect={false}
            />
            <ActionIcon
              variant="light"
              size="lg"
              radius="xl"
              onClick={() => setColorScheme(isDark ? "light" : "dark")}
              aria-label={t("layout.toggleColorScheme")}
            >
              {isDark ? <IconSun size={18} /> : <IconMoon size={18} />}
            </ActionIcon>
            <Button
              variant="light"
              color="red"
              leftSection={<IconLogout size={16} />}
              onClick={handleLogout}
            >
              {t("common.logout")}
            </Button>
          </Group>
        </Group>

        <Group justify="space-between" align="center">
          <Button
            variant="light"
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => {
              navigate("/");
            }}
          >
            {t("companyDetails.back")}
          </Button>
          <Title order={1}>{companyName}</Title>
        </Group>

        <Group align="stretch" gap="lg" wrap="nowrap">
          <Paper
            withBorder
            radius="xl"
            p="md"
            style={{ width: 260, alignSelf: "stretch" }}
          >
            <Stack gap={6}>
              {navigationItems.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.to}
                    label={item.label}
                    leftSection={<Icon size={18} />}
                    active={location.pathname.startsWith(item.to)}
                    variant="filled"
                    color="orange"
                    onClick={() => {
                      navigate(item.to);
                    }}
                    styles={{
                      root: {
                        borderRadius: "var(--mantine-radius-lg)",
                      },
                    }}
                  />
                );
              })}
            </Stack>
          </Paper>

          <Box style={{ flex: 1, minWidth: 0 }}>
            <Outlet />
          </Box>
        </Group>
      </Stack>
    </Box>
  );
}
