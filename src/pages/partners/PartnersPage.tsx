import {
  ActionIcon,
  Alert,
  Button,
  Card,
  Center,
  Group,
  Loader,
  Modal,
  Pagination,
  Stack,
  Switch,
  Table,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useDebouncedValue, useDisclosure } from "@mantine/hooks";
import { useQueryClient } from "@tanstack/react-query";
import {
  IconPencil,
  IconPlus,
  IconSearch,
  IconTrash,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Outlet, useNavigate } from "react-router-dom";
import { useDeletePartner, usePartners } from "../../service/partners";
import { useAuthStore } from "../../store/auth";
import type { Partner } from "../../types/partners";
import {
  showErrorNotification,
  showSuccessNotification,
} from "../../utils/notifications";

const ITEMS_PER_PAGE = 10;

export default function PartnersPage() {
  const { t } = useTranslation();
  const companyId = useAuthStore((state) => state.company?.id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search, 400);
  const [page, setPage] = useState(1);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteOpened, { open: openDelete, close: closeDelete }] =
    useDisclosure(false);

  const { data, isLoading, error } = usePartners(
    companyId,
    ITEMS_PER_PAGE,
    page,
    debouncedSearch.trim(),
  );
  const deletePartnerMutation = useDeletePartner();
  const partners = data?.partners ?? [];
  const totalCount = data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const handleOpenDelete = (partner: Partner) => {
    setSelectedPartner(partner);
    openDelete();
  };

  const handleCloseDelete = () => {
    closeDelete();
    setSelectedPartner(null);
  };

  const handleDelete = async () => {
    if (!selectedPartner || !companyId) {
      return;
    }

    try {
      setDeletingId(selectedPartner.id);
      await deletePartnerMutation.mutateAsync(selectedPartner.id);
      await queryClient.invalidateQueries({
        queryKey: ["partners", companyId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["partner", companyId, selectedPartner.id],
      });
      showSuccessNotification({
        message: t("partnersPage.deleteSuccess"),
      });
      handleCloseDelete();
    } catch (deleteError) {
      showErrorNotification({
        message:
          deleteError instanceof Error
            ? deleteError.message
            : t("partnersPage.deleteError"),
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Stack gap="lg">
      <Outlet />

      <Modal
        opened={deleteOpened}
        onClose={handleCloseDelete}
        title={t("partnersPage.deletePartner")}
        centered
      >
        <Stack gap="md">
          <Text>
            {t("partnersPage.deleteConfirmation")}{" "}
            <Text span fw={700}>
              {selectedPartner?.name_uz}
            </Text>
            ?
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={handleCloseDelete}>
              {t("staffPage.cancel")}
            </Button>
            <Button
              color="red"
              loading={
                deletePartnerMutation.isPending &&
                deletingId === selectedPartner?.id
              }
              onClick={() => {
                void handleDelete();
              }}
            >
              {t("partnersPage.deletePartner")}
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Group justify="space-between" align="center">
        <div>
          <Title order={3}>{t("partnersPage.title")}</Title>
          <Text c="dimmed">{t("partnersPage.subtitle")}</Text>
        </div>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => {
            navigate("/partners/add");
          }}
        >
          {t("partnersPage.addPartner")}
        </Button>
      </Group>

      <Card withBorder radius="xl" p="lg">
        <Group justify="space-between" align="end">
          <TextInput
            label={t("partnersPage.search")}
            placeholder={t("partnersPage.searchPlaceholder")}
            value={search}
            onChange={(event) => {
              setSearch(event.currentTarget.value);
            }}
            leftSection={<IconSearch size={16} />}
            styles={{
              label: {
                marginBottom: 8,
              },
            }}
            style={{ flex: 1 }}
          />
          <Text size="sm" c="dimmed">
            {totalCount} {t("companyDetails.items")}
          </Text>
        </Group>
      </Card>

      <Card withBorder radius="xl" p="lg">
        {error ? (
          <Stack align="center" py="xl" gap="sm">
            <Alert color="red" variant="light" w="100%">
              {error.message || t("partnersPage.loadError")}
            </Alert>
            <Button
              variant="light"
              onClick={() => {
                void queryClient.invalidateQueries({
                  queryKey: ["partners", companyId],
                });
              }}
            >
              {t("staffPage.retry")}
            </Button>
          </Stack>
        ) : isLoading ? (
          <Center py="xl">
            <Stack align="center" gap="sm">
              <Loader />
              <Text c="dimmed">{t("partnersPage.loading")}</Text>
            </Stack>
          </Center>
        ) : (
          <>
            <Table highlightOnHover verticalSpacing="md">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t("partnersPage.nameUz")}</Table.Th>
                  <Table.Th>{t("partnersPage.nameRu")}</Table.Th>
                  <Table.Th>{t("partnersPage.address")}</Table.Th>
                  <Table.Th>{t("partnersPage.coordinates")}</Table.Th>
                  <Table.Th>{t("partnersPage.active")}</Table.Th>
                  <Table.Th>{t("staffPage.actions")}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {partners.length ? (
                  partners.map((partner) => (
                    <Table.Tr key={partner.id}>
                      <Table.Td>
                        <Text fw={600}>{partner.name_uz}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text c="dimmed">{partner.name_ru}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text c="dimmed">{partner.address_description}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text
                          fw={700}
                          c="orange.7"
                          size="xs"
                          span
                          style={{
                            display: "inline-block",
                            whiteSpace: "nowrap",
                            padding: "2px 8px",
                            borderRadius: 999,
                            background: "var(--mantine-color-orange-0)",
                          }}
                        >
                          {partner.latitude}, {partner.longitude}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Switch checked={partner.is_active} readOnly />
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs" wrap="nowrap">
                          <ActionIcon
                            variant="light"
                            color="blue"
                            aria-label={t("partnersPage.editPartner")}
                            onClick={() => {
                              navigate(`/partners/edit/${partner.id}`, {
                                state: { partner },
                              });
                            }}
                          >
                            <IconPencil size={18} />
                          </ActionIcon>
                          <ActionIcon
                            variant="light"
                            color="red"
                            aria-label={t("partnersPage.deletePartner")}
                            title={t("partnersPage.deletePartner")}
                            disabled={deletePartnerMutation.isPending}
                            onClick={() => {
                              handleOpenDelete(partner);
                            }}
                          >
                            <IconTrash size={18} />
                          </ActionIcon>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))
                ) : (
                  <Table.Tr>
                    <Table.Td colSpan={6}>
                      <Text c="dimmed" ta="center" py="md">
                        {t("partnersPage.empty")}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>

            <Group justify="space-between" mt="lg">
              <Text size="sm" c="dimmed">
                {t("companyDetails.showing")}{" "}
                {totalCount ? (page - 1) * ITEMS_PER_PAGE + 1 : 0}-
                {Math.min(page * ITEMS_PER_PAGE, totalCount)}{" "}
                {t("companyDetails.of")} {totalCount}
              </Text>
              <Pagination value={page} onChange={setPage} total={totalPages} />
            </Group>
          </>
        )}
      </Card>
    </Stack>
  );
}
