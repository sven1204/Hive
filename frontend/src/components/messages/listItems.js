import { dmKey, getGroupTitle, getUserName, groupKey, idOf } from "./messageUtils";

/* Liste unique DM + groupes, triée par activité récente (createdAt de la conversation pour un groupe vide) */
export function buildListItems({ conversations, groupConvs, getLastRead, myId, activeKey, t }) {
  const dms = conversations.map(({ partner, lastMessage, unread }) => ({
    key: dmKey(idOf(partner)),
    type: "dm",
    id: idOf(partner),
    name: getUserName(partner, t("messages.userFallback")),
    partner,
    lastMessage,
    unread: unread || 0,
    sortTime: new Date(lastMessage?.createdAt || 0).getTime(),
  }));
  const groups = groupConvs.map(({ conversation, lastMessage }) => {
    const id = idOf(conversation);
    const key = groupKey(id);
    const lastRead = getLastRead(id);
    const fromOther = !!lastMessage && idOf(lastMessage.senderId) !== myId;
    const lastAt = lastMessage?.createdAt ? new Date(lastMessage.createdAt).toISOString() : null;
    return {
      key,
      type: "group",
      id,
      name: getGroupTitle(conversation, t("messages.groupDefault")),
      conversation,
      lastMessage,
      unread: 0,
      // Point « nouveau » : dernier message d'autrui postérieur au dernier passage (localStorage)
      hasNew: key !== activeKey && fromOther && !!lastAt && (!lastRead || lastAt > lastRead),
      sortTime: new Date(lastMessage?.createdAt || conversation.createdAt || conversation.updatedAt || 0).getTime(),
    };
  });
  return [...dms, ...groups].sort((a, b) => b.sortTime - a.sortTime);
}

export function buildArchivedItems({ archivedDMs, archivedConvs, t }) {
  return [
    ...archivedDMs.map(({ partner }) => ({
      key: dmKey(idOf(partner)), type: "dm", id: idOf(partner), partner,
      name: getUserName(partner, t("messages.userFallback")),
    })),
    ...archivedConvs.map(({ conversation }) => ({
      key: groupKey(idOf(conversation)), type: "group", id: idOf(conversation), conversation,
      name: getGroupTitle(conversation, t("messages.groupDefault")),
    })),
  ];
}
