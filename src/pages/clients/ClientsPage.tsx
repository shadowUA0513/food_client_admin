import {
  Alert,
  Badge,
  Button,
  Card,
  Center,
  Group,
  Loader,
  Pagination,
  Stack,
  Table,
  Text,
  Title,
} from "@mantine/core";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useCompanyClientsPaginated } from "../../service/clients";
import { useAuthStore } from "../../store/auth";

const ITEMS_PER_PAGE = 10;

export default function ClientsPage() {
  const { t } = useTranslation();
  const companyId = useAuthStore((state) => state.company?.id);
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const { data, error, isLoading, isFetching } = useCompanyClientsPaginated(
    companyId,
    ITEMS_PER_PAGE,
    page,
  );
  const clients = data?.clients ?? [];
  const totalCount = data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-start">
        <div>
          <Title order={3}>{t("clientsPage.title")}</Title>
          <Text c="dimmed">{t("clientsPage.subtitle")}</Text>
        </div>
        <Group gap="sm">
          <Badge color="orange" variant="light" size="lg">
            {t("clientsPage.clientsCount", { count: totalCount })}
          </Badge>
          <Button
            variant="light"
            loading={isFetching}
            onClick={() => {
              void queryClient.invalidateQueries({
                queryKey: ["company-clients", companyId],
              });
            }}
          >
            {t("commonActions.refresh")}
          </Button>
        </Group>
      </Group>

      <Card withBorder radius="xl" p="lg">
        {error ? (
          <Stack gap="md">
            <Alert color="red" variant="light">
              {error.message || t("clientsPage.loadError")}
            </Alert>
            <Group justify="flex-end">
              <Button
                variant="light"
                onClick={() => {
                  void queryClient.invalidateQueries({
                    queryKey: ["company-clients", companyId],
                  });
                }}
              >
                {t("commonActions.retry")}
              </Button>
            </Group>
          </Stack>
        ) : isLoading ? (
          <Center py="xl">
            <Stack align="center" gap="sm">
              <Loader />
              <Text c="dimmed">{t("clientsPage.loading")}</Text>
            </Stack>
          </Center>
        ) : !clients.length ? (
          <Center py="xl">
            <Text c="dimmed">{t("clientsPage.empty")}</Text>
          </Center>
        ) : (
          <>
            <Table highlightOnHover verticalSpacing="md">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t("clientsPage.fullName")}</Table.Th>
                  <Table.Th>{t("clientsPage.username")}</Table.Th>
                  <Table.Th>{t("clientsPage.phone")}</Table.Th>
                  <Table.Th>{t("clientsPage.language")}</Table.Th>
                  <Table.Th>{t("clientsPage.createdAt")}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {clients.map((client) => (
                  <Table.Tr key={client.id}>
                    <Table.Td>{client.full_name || "-"}</Table.Td>
                    <Table.Td>
                      <Text c="dimmed">
                        {client.username ? `@${client.username}` : "-"}
                      </Text>
                    </Table.Td>
                    <Table.Td>{client.phone_number || "-"}</Table.Td>
                    <Table.Td>
                      <Badge variant="light">
                        {client.language_code || "-"}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text c="dimmed">
                        {new Date(client.created_at).toLocaleString()}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
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
