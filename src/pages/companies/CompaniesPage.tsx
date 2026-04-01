import {
  ActionIcon,
  Avatar,
  Badge,
  Button,
  Card,
  Group,
  Modal,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { IconPencil, IconPlus, IconTrash } from "@tabler/icons-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Outlet, useNavigate } from "react-router-dom";
import { useCompanies, useDeleteCompany } from "../../service/companies";
import type { Company } from "../../types/companies";
import {
  showErrorNotification,
  showSuccessNotification,
} from "../../utils/notifications";

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function maskToken(token: string) {
  if (token.length <= 8) {
    return token;
  }

  return `${token.slice(0, 4)}...${token.slice(-4)}`;
}

export default function CompaniesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteOpened, { open: openDelete, close: closeDelete }] =
    useDisclosure(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: companies = [] } = useCompanies();
  const deleteCompanyMutation = useDeleteCompany();

  const handleDelete = async () => {
    if (!selectedCompany) {
      return;
    }

    try {
      setDeletingId(selectedCompany.id);
      await deleteCompanyMutation.mutateAsync(selectedCompany.id);
      await queryClient.invalidateQueries({ queryKey: ["companies"] });
      showSuccessNotification({
        message: "Company deleted successfully.",
      });
      closeDelete();
      setSelectedCompany(null);
    } catch (deleteError) {
      showErrorNotification({
        message:
          deleteError instanceof Error
            ? deleteError.message
            : "Failed to delete company.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleOpenDelete = (company: Company) => {
    setSelectedCompany(company);
    openDelete();
  };

  const handleCloseDelete = () => {
    closeDelete();
    setSelectedCompany(null);
  };

  return (
    <Stack gap="lg">
      <Outlet />

      <Modal
        opened={deleteOpened}
        onClose={handleCloseDelete}
        title="Delete company"
        centered
      >
        <Stack gap="md">
          <Text>
            Are you sure you want to delete{" "}
            <Text span fw={700}>
              {selectedCompany?.name}
            </Text>
            ?
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={handleCloseDelete}>
              Cancel
            </Button>
            <Button
              color="red"
              loading={
                deleteCompanyMutation.isPending &&
                deletingId === selectedCompany?.id
              }
              onClick={() => {
                void handleDelete();
              }}
            >
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Group justify="space-between" align="flex-start">
        <div>
          <Title order={2}>{t("companiesPage.title")}</Title>
          <Text c="dimmed">{t("companiesPage.subtitle")}</Text>
        </div>
        <Button
          leftSection={<IconPlus size={16} />}
          radius="md"
          onClick={() => {
            navigate("/companies/add");
          }}
        >
          {t("common.addCompany")}
        </Button>
      </Group>

      <SimpleGrid cols={{ base: 1, lg: 3 }}>
        {companies.map((company) => (
          <Card
            key={company.id}
            withBorder
            radius="xl"
            p="lg"
            style={{ cursor: "pointer" }}
            onClick={() => {
              navigate(`/companies/${company.id}`, {
                state: { company },
              });
            }}
          >
            <Stack gap="md">
              <Group justify="space-between" align="flex-start" wrap="nowrap">
                <Group gap="sm" wrap="nowrap" align="flex-start">
                  <Avatar
                    src={company.logo_url}
                    alt={company.name}
                    radius="xl"
                    size={48}
                  >
                    {company.name.charAt(0).toUpperCase()}
                  </Avatar>
                  <div>
                    <Title order={4}>{company.name}</Title>
                    <Text size="sm" c="dimmed" mt={4}>
                      {company.bot_username}
                    </Text>
                  </div>
                </Group>
                <Badge color={company.is_active ? "teal" : "gray"} variant="light">
                  {company.is_active ? t("companiesPage.active") : "Inactive"}
                </Badge>
              </Group>

              <div>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                  Brand color
                </Text>
                <Text mt={4}>{company.brand_color}</Text>
              </div>

              <div>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                  Bot token
                </Text>
                <Text mt={4}>{maskToken(company.bot_token)}</Text>
              </div>

              <div>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                  Created at
                </Text>
                <Text mt={4}>{formatDate(company.created_at)}</Text>
              </div>

              <div>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                  Updated at
                </Text>
                <Text mt={4}>{formatDate(company.updated_at)}</Text>
              </div>

              <Group justify="flex-end" gap="xs">
                <ActionIcon
                  variant="light"
                  color="blue"
                  aria-label="Edit company"
                  title="Edit company"
                  onClick={(event) => {
                    event.stopPropagation();
                    navigate(`/companies/edit/${company.id}`, {
                      state: { company },
                    });
                  }}
                >
                  <IconPencil size={18} />
                </ActionIcon>
                <ActionIcon
                  variant="light"
                  color="red"
                  aria-label="Delete company"
                  title="Delete company"
                  disabled={deleteCompanyMutation.isPending}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleOpenDelete(company);
                  }}
                >
                  <IconTrash size={18} />
                </ActionIcon>
              </Group>
            </Stack>
          </Card>
        ))}
      </SimpleGrid>
    </Stack>
  );
}
