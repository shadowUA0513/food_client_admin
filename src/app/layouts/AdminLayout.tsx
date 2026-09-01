import {
  ActionIcon,
  AppShell,
  Box,
  Burger,
  Button,
  Divider,
  Group,
  NavLink,
  Paper,
  Select,
  Stack,
  Text,
  Title,
  UnstyledButton,
  useComputedColorScheme,
  useMantineColorScheme,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconBriefcase,
  IconChefHat,
  IconClockHour4,
  IconHistory,
  IconLayoutDashboard,
  IconLogout,
  IconMoon,
  IconShoppingCartPlus,
  IconSun,
  IconUserCircle,
  IconUsers,
} from "@tabler/icons-react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useKitchenRealtime } from "../../hooks/useKitchenRealtime";
import { useAuthStore } from "../../store/auth";
import { useAuth } from "../providers/AuthProvider";
import { isOperator } from "../../utils/auth";

export function AdminLayout() {
  const [opened, { toggle, close }] = useDisclosure(false);
  const { logout, phone, user } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const company = useAuthStore((state) => state.company);
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme("light");
  const isDark = computedColorScheme === "dark";
  const isOperatorUser = isOperator(user?.role);
  const dashboardPath = "/";
  const aiImageDashboardPath = "/ai-image-dashboard";
  const isDashboardRoute =
    location.pathname === dashboardPath ||
    location.pathname.startsWith(aiImageDashboardPath);
  const [dashboardOpened, setDashboardOpened] = useState(isDashboardRoute);

  useEffect(() => {
    if (isDashboardRoute) {
      setDashboardOpened(true);
    }
  }, [isDashboardRoute]);

  useKitchenRealtime(company?.id);
  const navigationItems = isOperatorUser
    ? [
        { label: "Kitchen", icon: IconChefHat, to: "/kitchen" },
        {
          label: t("createOrderPage.navLabel"),
          icon: IconShoppingCartPlus,
          to: "/create-order",
        },
      ]
    : [
        { label: t("common.partners"), icon: IconUsers, to: "/partners" },
        { label: t("common.staff"), icon: IconBriefcase, to: "/staff" },
        {
          label: t("companyDetails.category"),
          icon: IconLayoutDashboard,
          to: "/category",
        },
        {
          label: t("companyDetails.product"),
          icon: IconLayoutDashboard,
          to: "/product",
        },
        {
          label: t("createOrderPage.navLabel"),
          icon: IconShoppingCartPlus,
          to: "/create-order",
        },
        {
          label: t("workingHours.navLabel"),
          icon: IconClockHour4,
          to: "/working-hours",
        },
        {
          label: t("profilePage.navLabel"),
          icon: IconUserCircle,
          to: "/profile",
        },
        { label: "Kitchen", icon: IconChefHat, to: "/kitchen" },
        {
          label: t("kitchenPage.orderHistoryNav"),
          icon: IconHistory,
          to: "/order-history",
        },
        { label: "Clients", icon: IconUsers, to: "/clients" },
      ];

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <AppShell
      header={{ height: 72 }}
      navbar={{ width: 280, breakpoint: "sm", collapsed: { mobile: !opened } }}
      padding="lg"
    >
      <AppShell.Header>
        <Group h="100%" px="lg" justify="space-between">
          <Group gap="sm">
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
            />
            <UnstyledButton
              onClick={() => {
                navigate("/");
                close();
              }}
              style={{
                borderRadius: 16,
                padding: "6px 10px",
                transition: "background-color 150ms ease",
              }}
              aria-label={t("common.dashboard")}
            >
              <Box>
                <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                  {t("common.appName")}
                </Text>
                <Title order={4}>{t("layout.controlPanel")}</Title>
              </Box>
            </UnstyledButton>
          </Group>

          <Group gap="sm">
            <Select
              value={i18n.resolvedLanguage ?? i18n.language}
              onChange={(value) => {
                if (value === "ru" || value === "uz" || value === "en") {
                  void i18n.changeLanguage(value);
                }
              }}
              data={[
                { value: "ru", label: t("common.languageRu") },
                { value: "uz", label: t("common.languageUz") },
                { value: "en", label: t("common.languageEn") },
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
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Stack justify="space-between" h="100%" style={{ minHeight: 0 }}>
          <Stack gap="md" style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
            <Paper withBorder radius="xl" p="md">
              <Group wrap="nowrap">
                <div>
                  <Text fw={700}>{user?.full_name}</Text>
                  <Text size="sm" c="dimmed">
                    {phone ?? t("layout.noPhone")}
                  </Text>
                </div>
              </Group>
            </Paper>

            <Stack gap={6}>
              {isOperatorUser ? (
                navigationItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.to}
                      label={item.label}
                      leftSection={<Icon size={18} />}
                      active={
                        item.to === "/"
                          ? location.pathname === "/"
                          : location.pathname.startsWith(item.to)
                      }
                      variant="filled"
                      color="orange"
                      component="button"
                      onClick={() => {
                        navigate(item.to);
                        close();
                      }}
                      styles={{
                        root: {
                          borderRadius: "var(--mantine-radius-lg)",
                        },
                      }}
                    />
                  );
                })
              ) : (
                <>
                  <NavLink
                    label={t("common.dashboard")}
                    leftSection={<IconLayoutDashboard size={18} />}
                    active={isDashboardRoute}
                    opened={dashboardOpened}
                    onChange={setDashboardOpened}
                    variant="filled"
                    color="orange"
                    childrenOffset="md"
                    styles={{
                      root: {
                        borderRadius: "var(--mantine-radius-lg)",
                      },
                    }}
                  >
                    <NavLink
                      label={t("common.dashboard")}
                      leftSection={<IconLayoutDashboard size={18} />}
                      active={location.pathname === dashboardPath}
                      variant="filled"
                      color="orange"
                      component="button"
                      onClick={() => {
                        navigate(dashboardPath);
                        close();
                      }}
                      styles={{
                        root: {
                          borderRadius: "var(--mantine-radius-lg)",
                        },
                      }}
                    />
                    <NavLink
                      label={t("aiImageDashboard.navLabel", {
                        defaultValue: "AI Image Dashboard",
                      })}
                      leftSection={<IconLayoutDashboard size={18} />}
                      active={location.pathname.startsWith(aiImageDashboardPath)}
                      variant="filled"
                      color="orange"
                      component="button"
                      onClick={() => {
                        navigate(aiImageDashboardPath);
                        close();
                      }}
                      styles={{
                        root: {
                          borderRadius: "var(--mantine-radius-lg)",
                        },
                      }}
                    />
                  </NavLink>

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
                        component="button"
                        onClick={() => {
                          navigate(item.to);
                          close();
                        }}
                        styles={{
                          root: {
                            borderRadius: "var(--mantine-radius-lg)",
                          },
                        }}
                      />
                    );
                  })}
                </>
              )}
            </Stack>
          </Stack>

          <Box>
            <Divider mb="md" />
            <Text size="sm" c="dimmed">
              {/* {t("layout.sidebarNote")} */}
            </Text>
          </Box>
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
