import { Paper, Text } from "@mantine/core";

export default function HomePage() {
  return (
    <Paper
      withBorder
      radius="xl"
      p="xl"
      style={{ minHeight: "calc(100vh - 140px)" }}
    >
      <Text c="dimmed" size="sm">
        Use the URL pattern <code>/companies/&lt;companyId&gt;/category</code>{" "}
        or
        <code>/companies/&lt;companyId&gt;/product</code> to open the only
        supported sections.
      </Text>
    </Paper>
  );
}
