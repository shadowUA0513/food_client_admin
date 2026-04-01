import { TextInput, type TextInputProps } from "@mantine/core";
import { formatUzbekistanPhone, normalizeUzbekistanPhone } from "../../utils/phone";

type PhoneNumberInputProps = Omit<TextInputProps, "value" | "onChange"> & {
  value: string;
  onChange: (value: string) => void;
};

export function PhoneNumberInput({
  value,
  onChange,
  ...props
}: PhoneNumberInputProps) {
  return (
    <TextInput
      {...props}
      value={formatUzbekistanPhone(value)}
      onChange={(event) => {
        onChange(normalizeUzbekistanPhone(event.currentTarget.value));
      }}
      inputMode="tel"
      autoComplete="tel"
    />
  );
}
