import {
  Alert,
  Badge,
  Button,
  Card,
  Center,
  Code,
  Group,
  Loader,
  Stack,
  Table,
  Text,
  Title,
} from "@mantine/core";
import { useQueryClient } from "@tanstack/react-query";
import { CLIENTS_COMPANY_ID, useCompanyClients } from "../../service/clients";

export default function ClientsPage() {
  const queryClient = useQueryClient();
  const { data, error, isLoading, isFetching } = useCompanyClients();
  const clients = data?.clients ?? [];
  const totalCount = data?.count ?? 0;

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-start">
        <div>
          <Title order={3}>Clients</Title>
          <Text c="dimmed">
            Clients for company <Code>{CLIENTS_COMPANY_ID}</Code>
          </Text>
        </div>
        <Group gap="sm">
          <Badge color="orange" variant="light" size="lg">
            {totalCount} clients
          </Badge>
          <Button
            variant="light"
            loading={isFetching}
            onClick={() => {
              void queryClient.invalidateQueries({
                queryKey: ["company-clients", CLIENTS_COMPANY_ID],
              });
            }}
          >
            Refresh
          </Button>
        </Group>
      </Group>

      <Card withBorder radius="xl" p="lg">
        {error ? (
          <Stack gap="md">
            <Alert color="red" variant="light">
              {error.message || "Failed to load clients."}
            </Alert>
            <Group justify="flex-end">
              <Button
                variant="light"
                onClick={() => {
                  void queryClient.invalidateQueries({
                    queryKey: ["company-clients", CLIENTS_COMPANY_ID],
                  });
                }}
              >
                Retry
              </Button>
            </Group>
          </Stack>
        ) : isLoading ? (
          <Center py="xl">
            <Stack align="center" gap="sm">
              <Loader />
              <Text c="dimmed">Loading clients...</Text>
            </Stack>
          </Center>
        ) : !clients.length ? (
          <Center py="xl">
            <Text c="dimmed">No clients found.</Text>
          </Center>
        ) : (
          <Table highlightOnHover verticalSpacing="md">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>ID</Table.Th>
                <Table.Th>Full name</Table.Th>
                <Table.Th>Username</Table.Th>
                <Table.Th>Phone</Table.Th>
                <Table.Th>Language</Table.Th>
                <Table.Th>Created at</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {clients.map((client) => (
                <Table.Tr key={client.id}>
                  <Table.Td>
                    <Text fw={600}>{client.id}</Text>
                  </Table.Td>
                  <Table.Td>{client.full_name || "-"}</Table.Td>
                  <Table.Td>
                    <Text c="dimmed">
                      {client.username ? `@${client.username}` : "-"}
                    </Text>
                  </Table.Td>
                  <Table.Td>{client.phone_number || "-"}</Table.Td>
                  <Table.Td>
                    <Badge variant="light">{client.language_code || "-"}</Badge>
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
        )}
      </Card>
    </Stack>
  );
}
