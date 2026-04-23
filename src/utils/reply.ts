import { MessageEvent, NapLink } from '@naplink/naplink';

export function isGroupMessageEvent(
  event: MessageEvent,
): event is MessageEvent & { group_id: number | string } {
  return 'group_id' in event && event.group_id !== undefined && event.group_id !== null;
}

export async function reply(
  client: NapLink,
  event: MessageEvent,
  message: any,
): Promise<any> {
  if (isGroupMessageEvent(event)) {
    return client.sendGroupMessage(event.group_id, message);
  }

  return client.sendPrivateMessage(event.user_id, message);
}
