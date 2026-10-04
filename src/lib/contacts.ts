import { Contact, ContactField } from "expo-contacts";

export type DeviceContact = {
  name: string;
  phone: string;
};

export async function pickDeviceContact(): Promise<DeviceContact | null> {
  const contact = await Contact.presentPicker();
  if (!contact) return null;

  const details = await contact.getDetails([
    ContactField.FULL_NAME,
    ContactField.PHONES,
  ]);
  return {
    name: details.fullName || "",
    phone: details.phones?.find((item) => item.number)?.number || "",
  };
}
