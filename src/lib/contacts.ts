import { Alert } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';

export type DeviceContact = {
  id?: string;
  name?: string;
  phoneNumbers?: { number?: string }[];
};

export async function fetchDeviceContacts(): Promise<DeviceContact[] | null> {
  try {
    // Safely check if native contacts module is linked in the native binary
    const hasNativeContacts = !!(
      requireOptionalNativeModule('ExpoContactsNext') ||
      requireOptionalNativeModule('ExpoContacts')
    );

    if (!hasNativeContacts) {
      return null;
    }

    let Contacts: any = null;
    try {
      Contacts = require('expo-contacts');
    } catch (e) {
      console.warn('expo-contacts module could not be required:', e);
      return null;
    }

    if (!Contacts || !Contacts.requestPermissionsAsync) {
      return null;
    }

    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Permission to access phone contacts was denied.');
      return [];
    }

    const { data } = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.PhoneNumbers],
    });

    return (data || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      phoneNumbers: c.phoneNumbers,
    }));
  } catch (error) {
    console.warn('Unable to load device contacts:', error);
    return null;
  }
}

